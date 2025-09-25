import { bot } from "../../bot.ts";
import { editMessage } from "../../keyboards/keyboardUtils/KeyboardUtils.ts";
import type { HideLinkContext, HideLinkConversation } from "../../Context.ts";
import { goodsMenuWithStatusText, goodsMenuWithStatusText_manipulate } from "../../textGetters/goodsMenuWithStatusText.ts";
import { LinkRepository } from "../../../db/repositories/LinkRepository.ts";
import { LinkStatus } from "../../../db/entities/link.entity.ts";

export async function hideLinkConversation(conversation: HideLinkConversation, ctx: HideLinkContext) {
    const session = await conversation.external((ctx: HideLinkContext) => { return ctx.session });
    const hideLinkMenuClone = conversation.menu('hide_link_conversation')
        .dynamic(async (ctx, menu) => {
            menu.text("__ Сортировать по: __").row()
                .text(session.menu.goods_menu.filter == "restock" ? "🛍️🟢 По пополнениям" : "🛍️ По пополнениям")
                .text(session.menu.goods_menu.filter == "category" ? "🔠 🟢 По категориям" : "🔠 По категориям")
                .row()
                .text(session.menu.goods_menu.filter == "place" ? "🏘️🟢 По городам" : "🏘️ По городам")
                .text(session.menu.goods_menu.filter == "subplace" ? "🏘️🟢 По районам" : "🏘️ По районам")
                .row()
                // .text("Активировать")
                // .row()
                .text(session.menu.goods_menu.state == "active" ? "🍏 Активные 🟢" : "🍏 Активные")
                .text(session.menu.goods_menu.state == "stash" ? "🗄️ Стэш 🟢" : "🗄️ Стэш")
                .text(session.menu.goods_menu.state == "sold" ? "🧾 Продано 🟢" : "🧾 Продано")
                .row()
                .text("Пополнить")
                return menu;
        })

    const soldLinks = await LinkRepository.findAllLinksWithStatus(LinkStatus.SOLD)
    
    const hideLinkMenu = conversation.menu()
        .text("Cancel", async (ctx: any) => {
            await bot.api.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id);
            await conversation.halt();
        });

    const checkpoint = conversation.checkpoint();

    const msg = await ctx.reply("Выберите пополнение которое хотите скрыть:", { reply_markup: hideLinkMenu });
    const name = await conversation.form.text({
        action: async (ctx: any) => {
            const link = soldLinks.find((link) => link.name == ctx.message.text);
            if (link) {
                await LinkRepository.updateLink(link.id, { link_status: LinkStatus.STASHED });
            }
        },
        otherwise: async (ctx: any) => {
            const msg1 = await ctx.reply("Нужно отправить название товара текстом");
            conversation.external((ctx: HideLinkContext) => {
                ctx.session.msgToDelete.from = "nameConversation";
                ctx.session.msgToDelete.chat_id = msg1.chat.id;
                ctx.session.msgToDelete.message_id = msg1.message_id;
            });
            return conversation.rewind(checkpoint);
        }
    });

    const goodsMenuWithStatusTextResult = await goodsMenuWithStatusText_manipulate(session.menu.goods_menu.state, session.menu.goods_menu.page)
    await editMessage(ctx, goodsMenuWithStatusTextResult.text, goodsMenuWithStatusTextResult.entities);
    await ctx.editMessageReplyMarkup({ reply_markup: hideLinkMenuClone });
} 