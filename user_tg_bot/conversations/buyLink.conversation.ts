import { type BuyLinkContext, type BuyLinkConversation } from "../Context.js";
import { Link } from "../../db/entities/link.entity.js";

export async function buyLinkConversation(conversation: BuyLinkConversation, ctx: BuyLinkContext, link: Link    ) {
    const checkpoint = conversation.checkpoint()
    await ctx.reply(`Выберите количество: ${link.name} | ${link.quantity}${link.unit_of_measure} | ${link.price_usd}`)
    await ctx.conversation.enter("buyLinkQuantity", {
        checkpoint: checkpoint,
    })
}               