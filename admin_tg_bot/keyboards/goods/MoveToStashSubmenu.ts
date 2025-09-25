import { Menu } from "@grammyjs/menu"
import type { MyContext } from "../../Context"
import { editMessage } from "../keyboardUtils/KeyboardUtils"
import { goodsMenuWithStatusText, goodsMenuWithStatusText_manipulate } from "../../textGetters/goodsMenuWithStatusText"

export const GoodsMenuInlineKeyboard_move_to_stash = new Menu<MyContext>("goods_menu_move_to_stash")
    .dynamic(async (ctx, range) => {
        // console.log("ctx.session.menu.goods_menu.restockId")
        const goodsMenuWithStatusTextResult = await goodsMenuWithStatusText_manipulate(ctx.session.menu.goods_menu.state, ctx.session.menu.goods_menu.page)
        const currentPage = goodsMenuWithStatusTextResult.currentPage
        // console.log("currentPage", currentPage)
        const currentPageRestockIds = goodsMenuWithStatusTextResult.restockIdsByPage[currentPage] || []
        // console.log("currentPageRestockIds", currentPageRestockIds)
        // console.log("goodsMenuWithStatusTextResult", goodsMenuWithStatusTextResult)
        
        let rowCount = 0
        

        // create keyboard for each restockId on current page
        for (const restockId of currentPageRestockIds) {
            // console.log("restockId", restockId)
            range.text(restockId.toString(), async (ctx) => {
                ctx.session.menu.goods_menu.restockId = restockId
                await ctx.conversation.enter("moveLinkToStashConversation", restockId)
                // await editMessage(ctx, goodsMenuWithStatusTextResult.text, goodsMenuWithStatusTextResult.entities)
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

