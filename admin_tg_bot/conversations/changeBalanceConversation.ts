// import { Conversation } from "@grammyjs/conversations";
// import { type ChangeBalanceContext, type ChangeBalanceConversation } from "../Context.ts";

// export async function changeBalanceConversation(conversation: ChangeBalanceConversation, ctx: ChangeBalanceContext, action: "increase" | "decrease", amount: number) {
//     // const session = await conversation.external((ctx: ChangeBalanceContext) => { return ctx.session })
//     const checkpoint = conversation.checkpoint()

//     const clone = conversation.menu("changeBalanceSubmenu")
//         .text("Да", async (ctx) => {
//             await conversation.external((ctx: ChangeBalanceContext) => (ctx.session.menu.goods_menu.restockId = restockId))
//             await ctx.conversation.enter("activateLinkConversation", restockId)
//         })
//         .row()
//         .back("◀️ Назад")

//     await clone.reply()
// }   