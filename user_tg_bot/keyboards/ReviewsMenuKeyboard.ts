import { bot } from "../bot.ts";
import { Menu } from "@grammyjs/menu";
import { editMessage } from "./utils/KeyboardUtils.ts";
import { MyPurchasesMenuInlineKeyboard } from "./UserMenuKeyboard.ts";
import { PurchaseRepository } from "../../db/repositories/PurchaseRepository.ts";
import { getAllReviewsText, getUserReviewsText, leaveReviewText } from "../textGetters/ReviewsMenuText.ts";
import { type LeaveReviewContext, type LeaveReviewConversation, type MyContext } from "../Context.ts";
import { PurchaseReviewRepository } from "../../db/repositories/PurchaseReviewRepository.ts";
import { UserRepository } from "../../db/repositories/UserRepository.ts";

export const reviewsMenuKeyboard = new Menu<MyContext>("reviews_menu")
    .dynamic(async (ctx, range) => {
        let totalPages;
        if (ctx.session.reviews.mode === "all") {
            ({ totalPages } = await getAllReviewsText(ctx))
        } else {
            ({ totalPages } = await getUserReviewsText(ctx, ctx.from!.id.toString()))
        }
        if (totalPages < 2) {
            return
        }
        ctx.session.reviews.totalPages = totalPages

        if (totalPages > 1) {
            range.text("⬅️", async (ctx) => {
                ctx.session.reviews.currentPage--
                const { text, entities } = await getAllReviewsText(ctx)
                ctx.session.reviews.totalPages = totalPages
                await editMessage(ctx, text, entities, reviewsMenuKeyboard)  
            })
            range.text(`${ctx.session.reviews.currentPage}/${totalPages}`)
            range.text("➡️", async (ctx) => {  
                ctx.session.reviews.currentPage++
                const { text, entities } = await getAllReviewsText(ctx)
                ctx.session.reviews.totalPages = totalPages
                await editMessage(ctx, text, entities, reviewsMenuKeyboard)
            })  
        }
    })  
    .text(ctx => ctx.session.reviews.mode === "all" ? "🟢 Все отзывы" : "Все отзывы", async (ctx) => {
        ctx.session.reviews.mode = "all"
        ctx.session.reviews.currentPage = 1
        const { text, entities, totalPages } = await getAllReviewsText(ctx)
        ctx.session.reviews.totalPages = totalPages
        await editMessage(ctx, text, entities, reviewsMenuKeyboard)
    })
    .text(ctx => ctx.session.reviews.mode === "my" ? "🟢 Мои отзывы" : "Мои отзывы", async (ctx) => {
        ctx.session.reviews.mode = "my"
        ctx.session.reviews.currentPage = 1
        const { text, entities, totalPages } = await getUserReviewsText(ctx, ctx.from!.id.toString())
        ctx.session.reviews.totalPages = totalPages
        await editMessage(ctx, text, entities, reviewsMenuKeyboard)
    })
    .row()
    .submenu("💬 Оставить отзыв на покупку 💬", "purchase_review_menu", async (ctx) => {
        await editMessage(ctx, "Выберите покупку для отзыва", undefined, MyPurchasesMenuInlineKeyboard)
    })
    // .text("Оставить отзыв этому боту", )

export const purchaseReviewMenuKeyboard = new Menu<MyContext>("purchase_review_menu")
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
                // await ctx.conversation.enter("leaveReviewConversation", { purchase })
                ctx.session.reviews.purchaseIdToReview = purchase.id
                const { text, entities } = await leaveReviewText(ctx, purchase)
                await editMessage(ctx, text, entities)
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
    .back("◀️ Назад", async (ctx) => {
        const { text, entities, totalPages } = await getAllReviewsText(ctx)
        ctx.session.reviews.currentPage = 1
        ctx.session.reviews.totalPages = totalPages
        ctx.session.reviews.mode = "all"
        ctx.session.reviews.purchaseIdToReview = 0
        ctx.session.reviews.review.rating = 0
        ctx.session.reviews.review.comment = ""
        await editMessage(ctx, text, entities, reviewsMenuKeyboard)
    })

export const leaveReviewMenuKeyboard = new Menu<MyContext>("leave_review_menu")
    .text("⭐️ Оставьте оценку:", async (ctx) => {
        await ctx.conversation.enter("leaveReviewRating", {
            purchase: ctx.session.reviews.purchaseIdToReview,
        })
    })
    .row()
    .text("💬 Оставьте отзыв:", async (ctx) => {
        await ctx.conversation.enter("leaveReviewComment", {
            purchase: ctx.session.reviews.purchaseIdToReview,
        })
    })
    .row()
    .dynamic(async (ctx, range) => {
        if (ctx.session.reviews.review.rating && ctx.session.reviews.review.comment) {
            range.text("✅ Готово", async (ctx) => {
                const user = await UserRepository.findById(ctx.from!.id)
                const purchase = await PurchaseRepository.findById(ctx.session.reviews.purchaseIdToReview)
                const submittedReview = await PurchaseReviewRepository.createReview(user!, purchase!, {
                    rating: ctx.session.reviews.review.rating,
                    comment: ctx.session.reviews.review.comment || undefined    
                })
                const userUpdated = await UserRepository.updateUser(ctx.from!.id.toString(), {
                    purchase_reviews: [...(user!.purchase_reviews || []), submittedReview]
                })
                const purchaseUpdated = await PurchaseRepository.updatePurchase(ctx.session.reviews.purchaseIdToReview, {
                    purchase_review: submittedReview,
                    edited_at: new Date()
                })
                console.log("purchaseUpdated:", purchaseUpdated)
                console.log("userUpdated:", userUpdated)
                const { text, entities } = await getAllReviewsText(ctx)
                await ctx.menu.nav("reviews_menu")
                await editMessage(ctx, text, entities, reviewsMenuKeyboard)
                await ctx.reply("Спасибо за оставленный отзыв!", { reply_markup: reviewsMenuKeyboard })
            }).row()
        }
    })
    .back("◀️ Назад", async (ctx) => {
        ctx.session.reviews.purchaseIdToReview = 0
        ctx.session.reviews.review.rating = 0
        ctx.session.reviews.review.comment = ""
        await editMessage(ctx, "Выберите покупку для отзыва")
    })

export async function leaveReviewRating(conversation: LeaveReviewConversation, ctx: LeaveReviewContext, purchase: number) {
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
            let currentPage;
            await conversation.external((ctx: MyContext) => {
                currentPage = ctx.session.reviews.currentPage
            })
            
            const startIndex = (currentPage! - 1) * itemsPerPage
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
    const checkpoint = conversation.checkpoint()
    const msg = await ctx.reply("Ответьте цифрой от 1 до 5 для выбора оценки.",)
    const rating = await conversation.form.number({
        action: async (ctx: any) => {
            const msgToDelete = await conversation.external((ctx: MyContext) => { return ctx.session.msgToDelete });
            if (msgToDelete.from === "reviewRating") {
                console.log("msgToDelete:", msgToDelete)
                try { await bot.api.deleteMessage(msgToDelete.chat_id, msgToDelete.message_id) }
                catch (error) { console.log("couldn't delete message: 1") }
            }
            try {
                await bot.api.deleteMessage(msg.chat.id, msg.message_id);
                await bot.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            } catch (error) { console.log("couldn't delete message: 2") }
            
            if (Number(ctx.message.text) < 1) {
                const msg1 = await ctx.reply("Оценка не может быть ни нулём, ни отрицательной");
                await conversation.external((ctx: MyContext) => {
                    ctx.session.msgToDelete.from = "reviewRating";
                    ctx.session.msgToDelete.chat_id = msg1.chat.id;
                    ctx.session.msgToDelete.message_id = msg1.message_id;
                });
                return conversation.rewind(checkpoint);
            }
        },
        otherwise: async (ctx: any) => {
            const msg1 = await ctx.reply("Нужно отправить оценку целым числом от 1 до 5");
            await conversation.external((ctx: MyContext) => {
                ctx.session.msgToDelete.from = "reviewRating";
                ctx.session.msgToDelete.chat_id = msg1.chat.id;
                ctx.session.msgToDelete.message_id = msg1.message_id;
            });
            return conversation.rewind(checkpoint);
        }
    })
    let context;
    await conversation.external((ctx: MyContext) => {
        ctx.session.reviews.review.rating = rating
        context = ctx

    })
    const thePurchase = await PurchaseRepository.findById(context!.session.reviews.purchaseIdToReview)
    const { text, entities } = await leaveReviewText(context!, thePurchase!) 
    console.log("text:", text)
    try {
        await editMessage(context!, text, entities, leaveReviewMenuKeyboard)
        // await ctx.editMessageReplyMarkup({ reply_markup: leaveReviewMenuKeyboard });  
    } catch (error) {
        console.log("[leaveReviewRating] error:", error)
    }
}

export async function leaveReviewComment(conversation: LeaveReviewConversation, ctx: LeaveReviewContext, purchase: number) {
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
            let currentPage;
            await conversation.external((ctx: MyContext) => {
                currentPage = ctx.session.reviews.currentPage
            })
            
            const startIndex = (currentPage! - 1) * itemsPerPage
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
    
    const checkpoint = conversation.checkpoint()
    const msg = await ctx.reply("Напишите ваш отзыв (максимум 500 символов).")
    const comment = await conversation.form.text({
        action: async (ctx: any) => {
            const msgToDelete = await conversation.external((ctx: MyContext) => { return ctx.session.msgToDelete });
            if (msgToDelete.from === "reviewComment") {
                try { await bot.api.deleteMessage(msgToDelete.chat_id, msgToDelete.message_id) }
                catch (error) { console.log("couldn't delete message: 1") }
            }
            try {
                await bot.api.deleteMessage(msg.chat.id, msg.message_id);
                await bot.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            } catch (error) { console.log("couldn't delete message: 2") }
            
            if (ctx.message.text.length > 500) {
                const msg1 = await ctx.reply("Отзыв слишком длинный. Максимум 500 символов.");
                await conversation.external((ctx: MyContext) => {
                    ctx.session.msgToDelete.from = "reviewComment";
                    ctx.session.msgToDelete.chat_id = msg1.chat.id;
                    ctx.session.msgToDelete.message_id = msg1.message_id;
                });
                return conversation.rewind(checkpoint);
            }
        },
        otherwise: async (ctx: any) => {
            const msg1 = await ctx.reply("Пожалуйста, отправьте текстовое сообщение.");
            await conversation.external((ctx: MyContext) => {
                ctx.session.msgToDelete.from = "reviewComment";
                ctx.session.msgToDelete.chat_id = msg1.chat.id;
                ctx.session.msgToDelete.message_id = msg1.message_id;
            });
            return conversation.rewind(checkpoint);
        }
    })
    let context;
    await conversation.external((ctx: MyContext) => {
        ctx.session.reviews.review.comment = comment
        context = ctx
    })
    
    const thePurchase = await PurchaseRepository.findById(context!.session.reviews.purchaseIdToReview)
    // const link = thePurchase!.link
    const { text, entities } = await leaveReviewText(context!, thePurchase!) 
    try {
        await editMessage(ctx, text, entities, leaveReviewMenuKeyboard)
        // await ctx.editMessageReplyMarkup({ reply_markup: leaveReviewMenuKeyboard });  
    } catch (error) {
        console.log("[leaveReviewComment] error:", error)
    }
}

reviewsMenuKeyboard.register(purchaseReviewMenuKeyboard)
reviewsMenuKeyboard.register(leaveReviewMenuKeyboard)