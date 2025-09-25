import { Keyboard } from "grammy";
import { bot } from "../../bot.ts";
import { LinkStatus } from "../../../db/entities/link.entity.ts";
import { LinkRepository } from "../../../db/repositories/LinkRepository.ts";
import { editMessage } from "../../keyboards/keyboardUtils/KeyboardUtils.ts";
import { getSingleRestockText } from "../../textGetters/getSingleRestockText.ts";
import { GoodsMenuInlineKeyboard } from "../../keyboards/goods/GoodsMenuKeyboard.ts";
import { goodsMenuWithStatusText_manipulate } from "../../textGetters/goodsMenuWithStatusText.ts";
import { type ActivateLinkContext, type ActivateLinkConversation, type UnitOfMeasureContext } from "../../Context.ts";

// Shows full restock info and shows 2 buttons:
// 1. Activate all links in restock
// 2. go back to goods menu
export async function activateLinkConversation(conversation: ActivateLinkConversation, ctx: ActivateLinkContext, restockId: number) {
    const session = await conversation.external((ctx: ActivateLinkContext) => { return ctx.session })
    const goodsMenuWithStatusTextResult = await goodsMenuWithStatusText_manipulate(session.menu.goods_menu.state, session.menu.goods_menu.page)
    const checkpoint = conversation.checkpoint()

    const clone = conversation.menu("activateSubmenu")
        .dynamic(async (ctx, range) => {
            const currentPage = goodsMenuWithStatusTextResult.currentPage
            const currentPageRestockIds = goodsMenuWithStatusTextResult.restockIdsByPage[currentPage] || []
            let rowCount = 0
            for (const restockId of currentPageRestockIds) {
                range.text(restockId.toString(), async (ctx) => {
                    await conversation.external((ctx: ActivateLinkContext) => (ctx.session.menu.goods_menu.restockId = restockId))
                    await ctx.conversation.enter("activateLinkConversation", restockId)
                })
                rowCount++
                if (rowCount >= 8) {
                    range.row()
                    rowCount = 0
                }
            }
        })
        .row()  
        .back("◀️ Назад")

    const activateKeyboard = conversation.menu("activateKeyboard")
        .text("Да", async (ctx) => {
            let session;
            await conversation.external(async (ctx: ActivateLinkContext) => {
                session = ctx
                const links = await LinkRepository.findAllLinksWithStatusByRestockId(restockId)
                for (const link of links) {
                    await LinkRepository.updateLink(link.id, { link_status: LinkStatus.ACTIVE })
                }
            })

            // console.log("message_id", session!.update.callback_query?.message?.message_id)
            // console.log("message_text", session!.update.callback_query?.message?.text)
            await bot.api.deleteMessage(session!.update.callback_query?.message?.chat.id, session!.update.callback_query?.message?.message_id)

            // await ctx.answerCallbackQuery({
            //     text: `Все неактивные ссылки из пополнения #${restockId} активированы.`,
            //     show_alert: true
            // });
            // console.log("Links activated, message deleted..")
            await conversation.halt()
            await ctx.menu.nav("goods_menu_activate", { immediate: true })
        })
        .text("Отмена", async (ctx) => {
            let context;
            await conversation.external(async (ctx: ActivateLinkContext) => {
                context = ctx
            })
            await bot.api.deleteMessage(context!.update.callback_query?.message?.chat.id, context!.update.callback_query?.message?.message_id)  
            // console.log("Message deleted..")
            await conversation.halt()
        })
        // .resized()
        // .oneTime()

    const restockText = await getSingleRestockText(restockId, LinkStatus.STASHED)
    // const msg = await ctx.editMessageText('Вы точно хотите активировать все неактивные ссылки с этого пополнения?\n' + restockText, { reply_markup: activateKeyboard })
    const msg = await ctx.reply('Вы точно хотите активировать все неактивные ссылки с этого пополнения?\n' + restockText, { reply_markup: activateKeyboard })
    // const unit = await conversation.form.select(["Да", "Отмена"], {
    //     action: async (ctx: any) => {
    //         const msgToDelete = await conversation.external((ctx: UnitOfMeasureContext) => { return ctx.session.msgToDelete });
    //         if (msgToDelete.from === "activateLinkConversation") {
    //             try { await bot.api.deleteMessage(msgToDelete.chat_id, msgToDelete.message_id) }
    //             catch (error) { console.log("couldn't delete message:") }
    //         }
    //         try {
    //             await bot.api.deleteMessage(msg.chat.id, msg.message_id);
    //             await bot.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
    //         } catch (error) { console.log("couldn't delete message:") }
    //         if (ctx.message.text !== "Да" && ctx.message.text !== "Отмена") {
    //             const msg1 = await ctx.reply("Неверный ответ");
    //             await conversation.external((ctx: UnitOfMeasureContext) => {
    //                 ctx.session.msgToDelete.from = "activateLinkConversation";
    //                 ctx.session.msgToDelete.chat_id = msg1.chat.id;
    //                 ctx.session.msgToDelete.message_id = msg1.message_id;
    //             });
    //             return conversation.rewind(checkpoint);
    //         }
    //     },
    //     otherwise: async (ctx: any) => {
    //         const msgToDelete = await conversation.external((ctx: UnitOfMeasureContext) => { return ctx.session.msgToDelete });
    //         if (msgToDelete.from === "activateLinkConversation") {
    //             try { await bot.api.deleteMessage(msgToDelete.chat_id, msgToDelete.message_id) }
    //             catch (error) { console.log("couldn't delete message:") }
    //         }
    //         try {
    //             await bot.api.deleteMessage(msg.chat.id, msg.message_id);
    //             await bot.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
    //         } catch (error) { console.log("couldn't delete message:") }
    //         const msg1 = await ctx.reply("Неверный ответ, выберите Да или Отмена");
    //         await conversation.external((ctx: ActivateLinkContext) => {
    //             ctx.session.msgToDelete.from = "activateLinkConversation";
    //             ctx.session.msgToDelete.chat_id = msg1.chat.id;
    //             ctx.session.msgToDelete.message_id = msg1.message_id;
    //         });
    //         return conversation.rewind(checkpoint);
    //     }
    // });

    const unit = await conversation.form.text({
        action: async (ctx: any) => {
            // console.log("ctx.message.text", ctx.message.text)
        }
    })
}

