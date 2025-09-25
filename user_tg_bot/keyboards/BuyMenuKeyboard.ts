import { Menu } from "@grammyjs/menu";
import { type MyContext } from "../Context.ts";
import { editMessage } from "./utils/KeyboardUtils.ts";
import { FormattedString } from "@grammyjs/parse-mode";
import { LinkStatus } from "../../db/entities/link.entity.ts";
import { LinkRepository } from "../../db/repositories/LinkRepository.ts";
import { checkBalanceAndBuyLink } from "../utils/checkBalanceAndBuyLink.ts";
import { getPurchaseSuccessText } from "../textGetters/PurchaseSuccessText.ts";

export const BuyMenuInlineKeyboard = new Menu<MyContext>("buy_menu_category")
    .dynamic(async (ctx, range) => {
        const activeLinks = await LinkRepository.findAllLinksWithStatus(LinkStatus.ACTIVE)
        const uniqueCategories = new Map<string, {name: string, places: string[]}>()
        activeLinks.forEach((link) => {
            const category = uniqueCategories.get(link.category.name)
            if (category) {
                category.places.push(link.place.name)
            } else {
                uniqueCategories.set(link.category.name, {name: link.category.name, places: [link.place.name]})
            }
        })
        for (const category of uniqueCategories.values()) {
            range.submenu(category.name, "buy_menu_place", async (ctx) => {
                ctx.session.buy_menu.category = category.name;
                await ctx.editMessageText("Выберите город:")
            }).row()
        }
    }) 

export const BuyMenuPlaceInlineKeyboard = new Menu<MyContext>("buy_menu_place")
    .dynamic(async (ctx, range) => {
        const activeLinks = await LinkRepository.findAllActiveLinksByCategoryPlaceSubplace(ctx.session.buy_menu.category)
        const uniquePlaces = new Map<string, {name: string, subplaces: string[]}>()
        activeLinks.forEach((link) => {
            const place = uniquePlaces.get(link.place.name)
            if (place) {
                place.subplaces.push(link.subplace.name)
            } else {
                uniquePlaces.set(link.place.name, {name: link.place.name, subplaces: [link.subplace.name]})
            }
        })
        for (const place of uniquePlaces.values()) {
            range.submenu(place.name, "buy_menu_subplace", async (ctx) => {
                ctx.session.buy_menu.place = place.name;
                await ctx.editMessageText("Выберите район:")
            }).row()
        }
    })
    .row()
    .back("◀️ Назад", async (ctx) => {
        ctx.session.buy_menu.category = '';
        ctx.session.buy_menu.place = '';
        ctx.session.buy_menu.subplace = '';
        await ctx.editMessageText("Выберите категорию:")
    })

export const BuyMenuSubplaceInlineKeyboard = new Menu<MyContext>("buy_menu_subplace")
    .dynamic(async (ctx, range) => {    
        const activeLinks = await LinkRepository.findAllActiveLinksByCategoryPlaceSubplace(ctx.session.buy_menu.category, ctx.session.buy_menu.place, ctx.session.buy_menu.subplace)
        const uniqueSubplaces = new Map<string, {name: string, links: string[]}>()
        activeLinks.forEach((link) => {
            const subplace = uniqueSubplaces.get(link.subplace.name)
            if (subplace) {
                subplace.links.push(link.link)
            } else {
                uniqueSubplaces.set(link.subplace.name, {name: link.subplace.name, links: [link.link]})
            }
        })
        for (const subplace of uniqueSubplaces.values()) {
            range.submenu(subplace.name, "buy_menu_name", async (ctx) => {
                ctx.session.buy_menu.subplace = subplace.name;
                await ctx.editMessageText("Выберите товар:")
            }).row()
        }
    })
    .row()
    .back("◀️ Назад", async (ctx) => {
        ctx.session.buy_menu.place = '';
        ctx.session.buy_menu.subplace = '';
        await ctx.editMessageText("Выберите город:")
    })
    
export const BuyMenuLinkInlineKeyboard = new Menu<MyContext>("buy_menu_name")
    .dynamic(async (ctx, range) => {
        const activeLinks = await LinkRepository.findAllActiveLinksByCategoryPlaceSubplace(ctx.session.buy_menu.category, ctx.session.buy_menu.place, ctx.session.buy_menu.subplace);
        const uniqueLinks = new Map();
        activeLinks.forEach(link => {
            const key = `${link.name}-${link.quantity}-${link.unit_of_measure}-${link.price_usd}`;
            if (!uniqueLinks.has(key)) {
                uniqueLinks.set(key, {
                    link_ids: [link.id],
                    name: link.name,
                    quantity: link.quantity,
                    unit_of_measure: link.unit_of_measure, 
                    price_usd: link.price_usd,
                    displayText: `${link.name} | ${link.quantity}${link.unit_of_measure} | ${link.price_usd}`
                });
            } else {
                uniqueLinks.get(key)!.link_ids.push(link.id);
            }
        });
        for (const linkData of uniqueLinks.values()) {
            range.submenu(linkData.displayText, "buy_menu_confirm", async (ctx) => {
                ctx.session.buy_menu.link.id = linkData.link_ids[Math.floor(Math.random() * linkData.link_ids.length)];
                ctx.session.buy_menu.link.displayText = linkData.displayText;
                const formattedText = new FormattedString("Подтвердите покупку: ").code(linkData.displayText)
                await editMessage(ctx, formattedText.text, formattedText.entities)
            }).row();
        }
    })
    .row()  
    .back("◀️ Назад", async (ctx) => {
        ctx.session.buy_menu.subplace = '';
        await ctx.editMessageText("Выберите район:")
    })


    export const BuyMenuLinkConfirmInlineKeyboard = new Menu<MyContext>("buy_menu_confirm")
    .submenu("🛍️ Купить 🎉", "buy_menu_category", async (ctx) => {
        const linkToBuy = ctx.session.buy_menu.link.id
        try {
            const {isActive, link} = await LinkRepository.isLinkActive(linkToBuy);
            if (!isActive) {
                await ctx.answerCallbackQuery({
                    text: "Ссылка не найдена",
                    show_alert: true
                });
                return;
            }
            try {
                await checkBalanceAndBuyLink(ctx!.update.callback_query!.from.id.toString(), linkToBuy);
                const {text, entities} = await getPurchaseSuccessText(linkToBuy, link!.name)
                await editMessage(ctx, "Выберите категорию:",)
                await ctx.reply(text)
            } catch (error) {
                console.error('Error processing link purchase:', error instanceof Error ? error.message : String(error));
                if (error instanceof Error && error.message === "Not enough balance") {
                    await ctx.reply("Недостаточно средств на балансе..")
                } else if (error instanceof Error && error.message === "Link is not active") {
                    await ctx.reply("Ссылка не активна..")
                } else if (error instanceof Error && error.message === "Link not found") {
                    await ctx.reply("Ссылка уже куплена..")
                } else if (error instanceof Error && error.message === "Error updating link status") {
                    await ctx.reply("Произошла ошибка при обновлении статуса ссылки..")
                } else if (error instanceof Error && error.message === "Error updating user balance") {
                    await ctx.reply("Произошла ошибка при обновлении баланса пользователя..")
                } else {
                    await ctx.reply("Произошла ошибка при покупке..")
                }
                await ctx.editMessageText("Выберите категорию:")
            }
            await ctx.deleteMessage()
        } catch (error) {
            console.error('Error processing link purchase:', error);
            await ctx.answerCallbackQuery({
                text: "Произошла ошибка при покупке",
                show_alert: true
            });
        }
    })
    .row()
    .back("◀️ Назад", async (ctx) => {
        ctx.session.buy_menu.link.id = 0;
        ctx.session.buy_menu.link.displayText = '';
        await ctx.editMessageText("Выберите товар:")
    })

BuyMenuInlineKeyboard.register(BuyMenuPlaceInlineKeyboard)
BuyMenuPlaceInlineKeyboard.register(BuyMenuSubplaceInlineKeyboard)
BuyMenuSubplaceInlineKeyboard.register(BuyMenuLinkInlineKeyboard)
BuyMenuLinkInlineKeyboard.register(BuyMenuLinkConfirmInlineKeyboard)