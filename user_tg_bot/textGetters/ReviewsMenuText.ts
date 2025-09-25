import { FormattedString } from "@grammyjs/parse-mode";
import { PurchaseReviewRepository } from "../../db/repositories/PurchaseReviewRepository.ts";
import { type MyContext } from "../Context.ts";
import type { Purchase } from "../../db/entities/purchase.entity.ts";

export async function getUserReviewsText(ctx: MyContext, userId: string) {
    const reviews = await PurchaseReviewRepository.findAllPurchasesByTgId(userId)
    const currentPage = ctx.session.reviews?.currentPage || 1
    const itemsPerPage = 8
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const userReviews = reviews.slice(startIndex, endIndex)
    const totalPages = Math.ceil(reviews.length / 10)
    let finalText = new FormattedString("")
    for (const [index, review] of userReviews.entries()) {
        finalText = finalText.expandableBlockquote(`Отзыв #${index + 1}\nНазвание: ${review.purchase.link.name + " | " + review.purchase.link.quantity + review.purchase.link.unit_of_measure + " | " + review.purchase.link.price_usd}\nДата покупки: ${review.purchase.created_at.toLocaleDateString()}\n`)
    }
    return {
        text: finalText.text ? finalText.text : "Нет отзывов",
        entities: finalText.entities,
        totalPages
    }
}

export async function getAllReviewsText(ctx: MyContext) {
    const allReviews = await PurchaseReviewRepository.findAllReviews()
    const currentPage = ctx.session.reviews?.currentPage || 1
    const itemsPerPage = 8
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const reviews = allReviews.slice(startIndex, endIndex)
    const totalPages = Math.ceil(allReviews.length / 10)
    let finalText = new FormattedString("")
    for (const [index, review] of reviews.entries()) {
        finalText = finalText.expandableBlockquote(`Отзыв #${index + 1}\nНазвание: ${review.purchase.link.name + " | " + review.purchase.link.quantity + review.purchase.link.unit_of_measure + " | " + review.purchase.link.price_usd}\nДата покупки: ${review.purchase.created_at.toLocaleDateString()}\n`)
    }
    return {
        text: finalText.text ? finalText.text : "Нет отзывов",
        entities: finalText.entities,
        totalPages
    }
}

export async function leaveReviewText(ctx: MyContext, purchase: Purchase) {
    const text = "Ваша покупка: " + purchase.link.name + " | " + purchase.link.quantity + purchase.link.unit_of_measure + " | " + purchase.link.price_usd + "\nОцените покупку и оставьте отзыв:\n\tВаша оценка: " + (ctx.session.reviews.review.rating ? ctx.session.reviews.review.rating : "...") + "\n\tВаш отзыв: " + (ctx.session.reviews.review.comment ? ctx.session.reviews.review.comment : "...")
    const finalText = new FormattedString(text)
    return {
        text: finalText.text,
        entities: finalText.entities
    }
}