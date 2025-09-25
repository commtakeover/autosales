import { type MyContext } from "../Context.ts";
import { LinkStatus } from "../../db/entities/link.entity.ts";
import { GoodsMenuInlineKeyboard } from "../keyboards/goods/GoodsMenuKeyboard.ts";
import { goodsMenuWithStatusText } from "../textGetters/goodsMenuWithStatusText.ts";
import { goodsMenuMainText } from "../textGetters/goodsMenuMainText.ts";

export async function goodsMenuHandler(ctx: MyContext) {
    // console.log("session", ctx.session)
    ctx.session.menu.goods_menu.state = ""
    ctx.session.menu.goods_menu.filter = "restock"
    ctx.session.menu.goods_menu.page = 0
    // const goodsReview = await goodsMenuWithStatusText("active")
    const goodsReview = await goodsMenuMainText()
    await ctx.reply(goodsReview, { reply_markup: GoodsMenuInlineKeyboard });

}