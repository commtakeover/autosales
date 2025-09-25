import { Menu } from "@grammyjs/menu"
import type { MyContext } from "../../Context"
import { editMessage } from "../keyboardUtils/KeyboardUtils"
import { InventoryRestockRepository } from "../../../db/repositories/InventoryRestockRepository"
import { goodsMenuWithStatusText, goodsMenuWithStatusText_manipulate } from "../../textGetters/goodsMenuWithStatusText"
import { restockText } from "../../textGetters/restockText"

export const GoodsMenuInlineKeyboard_activate = new Menu<MyContext>("goods_menu_activate")
    .dynamic(async (ctx, range) => {
        const goodsMenuWithStatusTextResult = await goodsMenuWithStatusText_manipulate(ctx.session.menu.goods_menu.state, ctx.session.menu.goods_menu.page)
        const currentPage = goodsMenuWithStatusTextResult.currentPage
        const totalPages = goodsMenuWithStatusTextResult.totalPages
        const currentPageRestockIds = goodsMenuWithStatusTextResult.restockIdsByPage[currentPage] || []
        
        // Add pagination navigation if there are multiple pages
        if (totalPages > 1) {
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
        
        let rowCount = 0
        
        for (const restockId of currentPageRestockIds) {
            range.text(restockId.toString(), async (ctx) => {
                ctx.session.menu.goods_menu.restockId = restockId
                await ctx.conversation.enter("activateLinkConversation", restockId)
            })
            rowCount++
            if (rowCount >= 8) {
                range.row()
                rowCount = 0
            }
        }
    })
    .row()  
    .back("◀️ Назад", async (ctx) => {
        const goodsMenuWithStatusTextResult = await goodsMenuWithStatusText(ctx.session.menu.goods_menu.state)
        await editMessage(ctx, goodsMenuWithStatusTextResult.text, goodsMenuWithStatusTextResult.entities)
    })
