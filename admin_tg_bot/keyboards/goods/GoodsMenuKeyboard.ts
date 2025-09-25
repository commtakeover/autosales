import { Menu } from "@grammyjs/menu";
import { type MyContext } from "../../Context.ts";
import { createRestock } from "../../mockup_db.ts";
import { FormattedString } from "@grammyjs/parse-mode";
import { restockText } from "../../textGetters/restockText.ts";
import { editMessage } from "../keyboardUtils/KeyboardUtils.ts";
import { GoodsMenuInlineKeyboard_restoke } from "./RestockMenu.ts";
import { GoodsMenuInlineKeyboard_activate } from "./ActivateSubmenu.ts";
import { GoodsMenuInlineKeyboard_move_to_stash } from "./MoveToStashSubmenu.ts";
import { goodsMenuWithStatusText, goodsMenuWithStatusText_manipulate } from "../../textGetters/goodsMenuWithStatusText.ts";

export const GoodsMenuInlineKeyboard = new Menu<MyContext>("goods_menu")
    .dynamic(async (ctx, range) => {
        if (ctx.session.menu.goods_menu.state == "") return range;
        const currentPage = ctx.session.menu.goods_menu.page
        const totalPages = ctx.session.menu.goods_menu.totalPages
        if (totalPages > 0) {
            range
                .text("⬅️", async (ctx) => {
                    if (currentPage > 0) {
                        ctx.session.menu.goods_menu.page = currentPage - 1;
                        const goodsMenuWithStatusTextResult = await goodsMenuWithStatusText_manipulate(ctx.session.menu.goods_menu.state, ctx.session.menu.goods_menu.page)
                        await editMessage(ctx, goodsMenuWithStatusTextResult.text, goodsMenuWithStatusTextResult.entities)
                    }
                })
                .text(`${currentPage + 1}/${totalPages}`)
                .text("➡️", async (ctx) => {
                    if (currentPage < totalPages - 1) {
                        ctx.session.menu.goods_menu.page = currentPage + 1;
                        const goodsMenuWithStatusTextResult = await goodsMenuWithStatusText_manipulate(ctx.session.menu.goods_menu.state, ctx.session.menu.goods_menu.page)
                        await editMessage(ctx, goodsMenuWithStatusTextResult.text, goodsMenuWithStatusTextResult.entities)
                    }
                })
                .row();
        }
    })
    .dynamic(async (ctx, range) => {
        const goodsMenuWithStatusTextResult = await goodsMenuWithStatusText_manipulate(ctx.session.menu.goods_menu.state, ctx.session.menu.goods_menu.page)
        if (ctx.session.menu.goods_menu.state == "active" && Object.keys(goodsMenuWithStatusTextResult.restockIdsByPage).length > 0) {
            range
                .submenu("Выбрать и убрать в стэш", "goods_menu_move_to_stash", async (ctx) => {
                    // set page to 0
                    ctx.session.menu.goods_menu.page = 0
                    const goodsMenuWithStatusTextResult = await goodsMenuWithStatusText_manipulate(ctx.session.menu.goods_menu.state, ctx.session.menu.goods_menu.page)
                    await editMessage(ctx, goodsMenuWithStatusTextResult.text, goodsMenuWithStatusTextResult.entities)
                })
                .row()
        } else if (ctx.session.menu.goods_menu.state == "stash" && Object.keys(goodsMenuWithStatusTextResult.restockIdsByPage).length > 0) {
            range
                .submenu("Выбрать и активировать", "goods_menu_activate", async (ctx) => {
                    ctx.session.menu.goods_menu.page = 0
                    const goodsMenuWithStatusTextResult = await goodsMenuWithStatusText_manipulate(ctx.session.menu.goods_menu.state, ctx.session.menu.goods_menu.page)
                    await editMessage(ctx, goodsMenuWithStatusTextResult.text, goodsMenuWithStatusTextResult.entities)
                })
                .row()
        } else if (ctx.session.menu.goods_menu.state == "sold" && Object.keys(goodsMenuWithStatusTextResult.restockIdsByPage).length > 0) {
            // range.text("Спрятать", async (ctx) => {
            //     await ctx.conversation.enter("hide_goods_conversation")
            // })
            // .row()
        }
        return range;
    })
    .text(ctx => ctx.session.menu.goods_menu.state == "active" ? "🍏 Активные 🟢" : "🍏 Активные", async (ctx) => {
        ctx.session.menu.goods_menu.state = "active"
        ctx.session.menu.goods_menu.filter = "restock"
        ctx.session.menu.goods_menu.page = 0
        const goodsMenuWithStatusTextResult = await goodsMenuWithStatusText(ctx.session.menu.goods_menu.state, ctx.session.menu.goods_menu.page)
        ctx.session.menu.goods_menu.totalPages = goodsMenuWithStatusTextResult.totalPages
        await editMessage(ctx, goodsMenuWithStatusTextResult.text, goodsMenuWithStatusTextResult.entities)
    })
    .text(ctx => ctx.session.menu.goods_menu.state == "stash" ? "🗄️ Стэш 🟢" : "🗄️ Стэш", async (ctx) => {
        ctx.session.menu.goods_menu.state = "stash"
        ctx.session.menu.goods_menu.filter = "restock"
        ctx.session.menu.goods_menu.page = 0
        const goodsMenuWithStatusTextResult = await goodsMenuWithStatusText(ctx.session.menu.goods_menu.state, ctx.session.menu.goods_menu.page)
        ctx.session.menu.goods_menu.totalPages = goodsMenuWithStatusTextResult.totalPages
        await editMessage(ctx, goodsMenuWithStatusTextResult.text, goodsMenuWithStatusTextResult.entities)
    })
    .text(ctx => ctx.session.menu.goods_menu.state == "sold" ? "🧾 Продано 🟢" : "🧾 Продано", async (ctx) => {
        ctx.session.menu.goods_menu.state = "sold"
        ctx.session.menu.goods_menu.filter = "restock"
        ctx.session.menu.goods_menu.page = 0
        const goodsMenuWithStatusTextResult = await goodsMenuWithStatusText(ctx.session.menu.goods_menu.state, ctx.session.menu.goods_menu.page)
        ctx.session.menu.goods_menu.totalPages = goodsMenuWithStatusTextResult.totalPages
        await editMessage(ctx, goodsMenuWithStatusTextResult.text, goodsMenuWithStatusTextResult.entities)
    })
    .row()
    .submenu("Пополнить", "goods_menu_restoke", async (ctx) => {
        await editMessage(ctx, await restockText(ctx))
    })
    .row()
    .dynamic(async (ctx, range) => {
        if (ctx.from?.id != process.env.SUPER_OWNER_ID || ctx.from?.id != process.env.SUPER_OWNER_ID_2) return range;
        return range
            .text("TEST", async (ctx) => {
                await ctx.reply("TEST")
            })
            .row()
            .text("CreateRestock", async (ctx) => {
                const restock = await createRestock();
                await ctx.reply(`🔢 Категория: ${restock.category}\n🏙️ Город: ${restock.place}\n🏘️ Район: ${restock.subplace}\n⚖️ Ед. измерения: ${restock.unitOfMeasure}\n🧮 Количество (шт/гр в 1 ссылке): ${restock.quantity}\n🔖 Название: ${restock.name}\n💰 Цена: ${restock.price}\n🔗 Ссылки:\n${restock.links.join("\n")}\n🏭 Производитель: ${restock.manufacturer || "Не указан"}\n🚚 Доставщик: ${restock.deliverer || "Не указан"}\n`)
            })
            .row()
    })
    .row()




GoodsMenuInlineKeyboard.register(GoodsMenuInlineKeyboard_activate);
GoodsMenuInlineKeyboard.register(GoodsMenuInlineKeyboard_move_to_stash);
GoodsMenuInlineKeyboard.register(GoodsMenuInlineKeyboard_restoke);


// 🔴 🟢