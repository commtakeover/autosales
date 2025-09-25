import { LinkStatus } from "../../db/entities/link.entity"
import { UserRepository } from "../../db/repositories/UserRepository"
import { LinkRepository } from "../../db/repositories/LinkRepository"
import { PurchaseRepository } from "../../db/repositories/PurchaseRepository"
import type { Purchase } from "../../db/entities/purchase.entity"
// import { PurchaseStatus } from "../../db/entities/purchase.entity"

export async function checkBalanceAndBuyLink(userTgId: string, linkId: number) {
    const user = await UserRepository.findByTgId(userTgId)
    const userBalance = Number(user!.balance_usd)
    if (!user) { throw new Error("User not found") }
    const link = await LinkRepository.findById(linkId)
    if (!link) { throw new Error("Link not found") }
    if (link.link_status !== LinkStatus.ACTIVE) { throw new Error("Link is not active") }
    const linkPrice = Number(link!.price_usd)
    if (userBalance < Number(link!.price_usd)) {
        console.log("[checkBalanceAndBuyLink] - Not enough balance 1")
        throw new Error("Not enough balance")
    }
    else {
        // deduct balance from user
        user.balance_usd = (userBalance - linkPrice)
        if (Number(user.balance_usd) < 0) {
            // console.log("[checkBalanceAndBuyLink] - Not enough balance 2")
            throw new Error("Not enough balance")
        }

        let purchase: Purchase;
        try {
            purchase = await PurchaseRepository.createPurchase(user, {
                link,
                purchase_price: linkPrice,
                // purchase_status: PurchaseStatus.DONE
            })
            // console.log("[checkBalanceAndBuyLink] - purchase", purchase)
        } catch (error) { throw new Error("Error creating purchase") }

        try {
            const linkWithPurchase = await LinkRepository.updateLink(link.id, {purchase, link_status: LinkStatus.SOLD})
            // console.log("[checkBalanceAndBuyLink] - linkWithPurchase", linkWithPurchase)
        } catch (error) { throw new Error("Error updating link with purchase") }

        try {
            user.purchases.push(purchase)
            await UserRepository.updateUser(userTgId, user)
        }
        catch (error) {
            throw new Error("Error updating user balance")
        }
    }
    const userAfter = await UserRepository.findByTgId(userTgId)
    // console.log("[checkBalanceAndBuyLink] - user.balance_usd AFTER", userAfter!.balance_usd)

}