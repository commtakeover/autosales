import { PurchaseReviewRepository } from "../../db/repositories/PurchaseReviewRepository.ts";
import { type MyContext } from "../Context.ts";
import { getAllReviewsText } from "../textGetters/ReviewsMenuText.ts";
import { reviewsMenuKeyboard } from "../keyboards/ReviewsMenuKeyboard.ts";

// export async function ReviewsMenuHandler(ctx: MyContext) {
//     const { text, entities, totalPages } = await getAllReviewsText(ctx)
//     ctx.session.reviews.currentPage = 1
//     ctx.session.reviews.totalPages = totalPages
//     ctx.session.reviews.mode = "all"
//     await ctx.reply(text, { entities, reply_markup: reviewsMenuKeyboard })
// }

export async function ReviewsMenuHandler(ctx: MyContext) {
    await ctx.reply("🛠️🔧🔩 Меню отзывов в разработке 🛠️🔧🔩")
}