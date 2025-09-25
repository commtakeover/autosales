import { type LeaveReviewContext, type LeaveReviewConversation } from "../Context.ts";
import { type Purchase } from "../../db/entities/purchase.entity.ts";
import { purchaseReviewMenuKeyboard } from "../keyboards/ReviewsMenuKeyboard.ts";
import { PurchaseRepository } from "../../db/repositories/PurchaseRepository.ts";

export const leaveReviewConversation = async (conversation: LeaveReviewConversation, ctx: LeaveReviewContext, purchase: Purchase) => {
    const clone = conversation.menu("purchase_review_menu_clone")
        .dynamic(async (ctx, range) => {
            const purchases = await PurchaseRepository.findAllPurchasesWithLinksByUserTgId(ctx.from!.id.toString())
            const purchasesWithoutReviews = purchases.filter(purchase => !purchase.purchase_review)
            
            if (purchasesWithoutReviews.length === 0) {
                await ctx.reply("У вас нет покупок без отзывов")
                return
            }
    
            const itemsPerPage = 8
            const totalPages = Math.ceil(purchasesWithoutReviews.length / itemsPerPage)
            const currentPage = ctx.session.reviews.currentPage || 1
            
            const startIndex = (currentPage - 1) * itemsPerPage
            const endIndex = startIndex + itemsPerPage
            const currentPagePurchases = purchasesWithoutReviews.slice(startIndex, endIndex)
    
            // Add purchase buttons
            for (const purchase of currentPagePurchases) {
                const buttonName = `${purchase.link.name} ${purchase.link.quantity}${purchase.link.unit_of_measure} - ${purchase.link.price_usd}$`
                range.submenu(buttonName, "leave_review_menu", async (ctx) => {
                    await ctx.conversation.enter("leaveReviewConversation", { purchase })
                    // ctx.session.reviews.purchaseIdToReview = purchase.id
                    // await editMessage(ctx, "Оцените покупку и оставьте отзыв:")
                }).row()
            }
    
            // Add pagination if needed
            if (totalPages > 1) {
                range.text("⬅️", async (ctx) => {
                    ctx.session.reviews.currentPage--
                    await ctx.editMessageText("Выберите покупку для отзыва", { reply_markup: purchaseReviewMenuKeyboard })
                })
                range.text(`${currentPage}/${totalPages}`)
                range.text("➡️", async (ctx) => {
                    ctx.session.reviews.currentPage++
                    await ctx.editMessageText("Выберите покупку для отзыва", { reply_markup: purchaseReviewMenuKeyboard })
                })
            }
        })
    const newReviewKeyboard = conversation.menu("leave_review_menu_clone")
        .text("1 ⭐️")
        .text("2")
        .text("3")
        .text("4")
        .text("5")
        .row()
    const checkpoint = conversation.checkpoint()
    await ctx.reply("Оцените покупку и оставьте отзыв:", { reply_markup: clone })
    await ctx.conversation.enter("leaveReviewConversation", {
        checkpoint: checkpoint,
    })
}