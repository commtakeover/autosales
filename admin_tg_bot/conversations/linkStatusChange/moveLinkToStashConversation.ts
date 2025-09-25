import { bot } from "../../bot.ts";
import { LinkStatus } from "../../../db/entities/link.entity.ts";
import { LinkRepository } from "../../../db/repositories/LinkRepository.ts";
import { getSingleRestockText } from "../../textGetters/getSingleRestockText.ts";
import { type MoveLinkToStashContext, type MoveLinkToStashConversation } from "../../Context.ts";

// Shows full restock info and shows 2 buttons:
// 1. Move all active links in restock to stash
// 2. go back to goods menu
export async function moveLinkToStashConversation(conversation: MoveLinkToStashConversation, ctx: MoveLinkToStashContext, restockId: number) {
    const session = await conversation.external((ctx: MoveLinkToStashContext) => { return ctx.session })
    const checkpoint = conversation.checkpoint()

    const moveToStashKeyboard = conversation.menu("moveToStashKeyboard")
        .text("Да", async (ctx) => {
            let session;
            await conversation.external(async (ctx: MoveLinkToStashContext) => {
                session = ctx
                const links = await LinkRepository.findAllLinksWithStatusByRestockId(restockId)
                for (const link of links) {
                    await LinkRepository.updateLink(link.id, { link_status: LinkStatus.STASHED })
                }
            })

            await bot.api.deleteMessage(session!.update.callback_query?.message?.chat.id, session!.update.callback_query?.message?.message_id)

            // await ctx.answerCallbackQuery({
            //     text: `Все активные ссылки из пополнения #${restockId} перемещены в стэш.`,
            //     show_alert: true
            // });
            // console.log("Links moved to stash, message deleted..")
            await conversation.halt()
        })
        .text("Отмена", async (ctx) => {
            let context;
            await conversation.external(async (ctx: MoveLinkToStashContext) => {
                context = ctx
            })
            await bot.api.deleteMessage(context!.update.callback_query?.message?.chat.id, context!.update.callback_query?.message?.message_id)  
            // console.log("Message deleted..")
            await conversation.halt()
        })

    const restockText = await getSingleRestockText(restockId, LinkStatus.ACTIVE)
    const msg = await ctx.reply('Вы точно хотите переместить все активные ссылки с этого пополнения в стэш?\n' + restockText, { reply_markup: moveToStashKeyboard })

    const unit = await conversation.form.text({
        action: async (ctx: any) => {
            // console.log("ctx.message.text", ctx.message.text)
        }
    })
} 