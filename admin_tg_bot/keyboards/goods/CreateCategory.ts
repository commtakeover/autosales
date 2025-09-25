import { Menu } from "@grammyjs/menu";
import { type MyContext } from "../../Context.ts";
import { LinkStatus, type Link } from "../../../db/entities/link.entity.ts";
import { editMessage } from "../keyboardUtils/KeyboardUtils.ts";
import { restockText } from "../../textGetters/restockText.ts";
import { LinkCategoryRepository } from "../../../db/repositories/LinkCategoryRepository.ts";
import { LinkPlaceRepository } from "../../../db/repositories/LinkPlaceRepository.ts";
import { LinkSubplaceRepository } from "../../../db/repositories/LinkSubplaceRepository.ts";
import { InventoryRestockRepository } from "../../../db/repositories/InventoryRestockRepository.ts";
import { LinkCategory } from "../../../db/entities/link-category.entity.ts";
import { LinkPlace } from "../../../db/entities/link-place.entity.ts";
import { LinkSubplace } from "../../../db/entities/link-subplace.entity.ts";
import type { InventoryRestock } from "../../../db/entities/inventory-restock.entity.ts";
import { LinkRepository } from "../../../db/repositories/LinkRepository.ts";
import { FormattedString } from "@grammyjs/parse-mode";
import axios from "axios";

export const CreateCategoryInlineKeyboard = new Menu<MyContext>("create_category")
    .text("Категория", (ctx) => ctx.conversation.enter("categoryConversation"))
    .text("Город", (ctx) => ctx.conversation.enter("placeConversation"))
    .row()
    .text("Район", (ctx) => ctx.conversation.enter("subplaceConversation"))
    .text("Название", (ctx) => ctx.conversation.enter("nameConversation"))
    .row()
    .text("Количество", (ctx) => ctx.conversation.enter("quantityConversation"))
    .text("Ед. измерения", (ctx) => ctx.conversation.enter("unit_of_measureConversation"))
    .row()
    .text("Цена", (ctx) => ctx.conversation.enter("priceConversation"))
    .text("Ссылки", (ctx) => ctx.conversation.enter("linksConversation"))
    .row()
    .text("Производитель", (ctx) => ctx.conversation.enter("domainConversation"))
    .text("Доставщик", (ctx) => ctx.conversation.enter("delivererConversation"))
    .row()
    .text("✅ Готово", async (ctx) => {
        // Check all required fields (1-8)
        if (!ctx.session.new_category.category || !ctx.session.new_category.place ||
            !ctx.session.new_category.subplace || !ctx.session.new_category.unit_of_measure ||
            !ctx.session.new_category.quantity || !ctx.session.new_category.name ||
            !ctx.session.new_category.price_usd || !ctx.session.new_category.links
        ) {
            await ctx.answerCallbackQuery({
                text: "⚠️ Заполните все обязательные поля (1-8) ⚠️",
                show_alert: true
            });
            return;
        }
        console.log("before dublicates check")
        const links = ctx.session.new_category.links
        const uniqueLinks = [...new Set(links)];
        if (uniqueLinks.length !== links.length) {
            await ctx.answerCallbackQuery({
                text: "⚠️ Вы отправили одинаковые ссылки. Пожалуйста, удалите дубликаты. ⚠️",
                show_alert: true
            });
            return;
        }
        console.log("after dublicates check")
        try {
            let category: LinkCategory | null = null;
            let place: LinkPlace | null = null;
            let subplace: LinkSubplace | null = null;
            let inventoryRestock: InventoryRestock | null = null;

            // Handle required category
            category = await LinkCategoryRepository.findByName(ctx.session.new_category.category);
            if (!category) {
                category = await LinkCategoryRepository.createCategory({ name: ctx.session.new_category.category });
            }

            place = await LinkPlaceRepository.findByName(ctx.session.new_category.place);
            if (!place) {
                place = await LinkPlaceRepository.createPlace({ name: ctx.session.new_category.place });
            }

            subplace = await LinkSubplaceRepository.findByName(ctx.session.new_category.subplace);
            if (!subplace) {
                subplace = await LinkSubplaceRepository.createSubplace({ name: ctx.session.new_category.subplace });
            }

            let links: Partial<Link>[] = [];
            for (const link of ctx.session.new_category.links) {
                links.push({
                    link,
                    name: ctx.session.new_category.name,
                    price_usd: parseFloat(ctx.session.new_category.price_usd),
                    category: category,
                    place: place,
                    subplace: subplace,
                    quantity: parseInt(ctx.session.new_category.quantity),
                    unit_of_measure: ctx.session.new_category.unit_of_measure,
                    manufacturer: ctx.session.new_category.manufacturer,
                    deliverer: ctx.session.new_category.deliverer,
                } as Partial<Link>)
            }

            // create inventory restock
            inventoryRestock = await InventoryRestockRepository.createRestock({
                quantity: ctx.session.new_category.links.length
            });

            for (const link of links) {
                link.inventory_restock = inventoryRestock;
                if (ctx.session.new_category.manufacturer) link.manufacturer = ctx.session.new_category.manufacturer;
                if (ctx.session.new_category.deliverer) link.deliverer = ctx.session.new_category.deliverer;
                const createdLink = await LinkRepository.createLink(link as unknown as Link);
                link.id = createdLink.id;
            }

            await InventoryRestockRepository.updateRestock(inventoryRestock.id, {
                links: links.map(link => link as unknown as Link)
            });

            for (const link of links) {
                try {
                    const updatedLink = await LinkRepository.updateLink(link.id as number, {
                        inventory_restock: inventoryRestock
                    });
                } catch (error) {
                    console.error("Error updating link:", error);
                }
            }
            
            const linksText = ctx.session.new_category.links.map(link => link).join('\n');
            const restockNotif = new FormattedString("🆕 Добавлено пополнение:\n").plain(`Название:  ${ctx.session.new_category.name}\nКоличество: ${ctx.session.new_category.quantity}${ctx.session.new_category.unit_of_measure}\nЦена: ${ctx.session.new_category.price_usd}\nСсылки:\n`).code(`${linksText}`).plain(`\nПроизводитель: ${ctx.session.new_category.manufacturer}\nДоставщик: ${ctx.session.new_category.deliverer}`)
            // console.log(process.env.TG_NOTIFICATION_CHANNEL_ID!)
            const response = await axios.post(`http://server:${process.env.SERVER_PORT}/notifications/new-restock`, {
                text: restockNotif.toString(),
                entities: restockNotif.entities
            })
            await editMessage(ctx, await restockText(ctx))
            await ctx.menu.nav("goods_menu_restoke", { immediate: true })

        } catch (error) {
            console.error("Error creating category:", error);
            await ctx.reply("❌ Произошла ошибка при создании категории. Попробуйте еще раз.");
        }
    })
    .row()
    .back("◀️ Назад", async (ctx) => {
        await editMessage(ctx, await restockText(ctx))
    });