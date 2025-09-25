import { type MyContext } from "../Context";
import { FormattedString, s } from "@grammyjs/parse-mode";
import { UserRepository } from "../../db/repositories/UserRepository";
import type { Purchase } from "../../db/entities/purchase.entity";
import { LinkRepository } from "../../db/repositories/LinkRepository";
import { PurchaseRepository } from "../../db/repositories/PurchaseRepository";
import { LinkStatus } from "../../db/entities/link.entity";

export async function getUserPurchasesText(ctx: MyContext, userTgId: string) {
    const allPurchases = await PurchaseRepository.findAllPurchasesWithLinks(userTgId)
    const currentPage = ctx.session.purchases?.currentPage || 1
    const itemsPerPage = 8
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const purchases = allPurchases.slice(startIndex, endIndex)
    
    let purchasesText: FormattedString = new FormattedString("Мои покупки:")
    for (const [index, purchase] of purchases.entries()) {
        purchasesText = purchasesText.expandableBlockquote(`Покупка #${index + 1}\nСсылка: ${purchase.link.link}\nНазвание: ${purchase.link.name + " | " + purchase.link.quantity + purchase.link.unit_of_measure + " | " + purchase.link.price_usd}\nДата покупки: ${purchase.created_at.toLocaleDateString()}\n`)
    }
    
    return { 
        text: purchasesText.toString(), 
        entities: purchasesText.entities, 
        totalPages: Math.ceil(allPurchases.length / itemsPerPage) 
    }
}
