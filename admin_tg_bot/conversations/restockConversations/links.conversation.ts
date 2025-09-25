import { bot } from "../../bot.ts";
import { type MyContext } from "../../Context.ts";
import { createCategoryText } from "../../textGetters/createCategoryText.ts";
import { editMessage } from "../../keyboards/keyboardUtils/KeyboardUtils.ts";
import { createCategoryClone } from "../menuClones.ts/createCategoryClone.ts";

export async function linksConversation(conversation: any, ctx: MyContext) {
    const categoryClone = createCategoryClone(conversation);
    const checkpoint = conversation.checkpoint();
    const msg = await ctx.reply("Отправьте ссылки на товары.\nМаксимум 40 ссылок.\nКаждая ссылка должна быть на новой строке.\nПример:\nssilka.com\neshe-ssilka.com");
    const links: string = await conversation.form.text({
        action: async (ctx: any) => {
            const msgToDelete = await conversation.external((ctx: MyContext) => { return ctx.session.msgToDelete });
            if (msgToDelete.from === "linksConversation") {
                try { await bot.api.deleteMessage(msgToDelete.chat_id, msgToDelete.message_id) }
                catch (error) { console.log("couldn't delete message:") }
            }
            try {
                await bot.api.deleteMessage(msg.chat.id, msg.message_id);
                await bot.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            } catch (error) { console.log("couldn't delete message:") }

            if (ctx.message.text.split("\n").length > 40 || ctx.message.text.length > 1800) {
                const msg1 = await ctx.reply("Сообщение не может быть длиннее 1800 символов и не может быть больше 40 ссылок");
                await conversation.external((ctx: MyContext) => {
                    ctx.session.msgToDelete.from = "linksConversation";
                    ctx.session.msgToDelete.chat_id = msg1.chat.id;
                    ctx.session.msgToDelete.message_id = msg1.message_id;
                });
                return conversation.rewind(checkpoint);
            }
        },
        otherwise: async (ctx: any) => {
            const msg1 = await ctx.reply("Нужно отправить ссылки на товары.\nМакесимум 40 ссылок.\nКаждая ссылка должна быть на новой строке.\nПример:\nssilka.com\neshe-ssilka.com");
            const msgToDelete = await conversation.external((ctx: MyContext) => { return ctx.session.msgToDelete });
            if (msgToDelete.from === "linksConversation") {
                try { await bot.api.deleteMessage(msgToDelete.chat_id, msgToDelete.message_id) }
                catch (error) { console.log("couldn't delete message:") }
            }
            try {
                await bot.api.deleteMessage(msg.chat.id, msg.message_id);
                await bot.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            } catch (error) { console.log("couldn't delete message:") }
            await conversation.external((ctx: MyContext) => {
                ctx.session.msgToDelete.from = "linksConversation";
                ctx.session.msgToDelete.chat_id = msg1.chat.id;
                ctx.session.msgToDelete.message_id = msg1.message_id;
            });
            return conversation.rewind(checkpoint);
        }
    });
    
    // console.log("links:", typeof links);

    let newCategory: any;

    await conversation.external((ctx: MyContext) => {
        ctx.session.new_category.links = links.split("\n");
        newCategory = ctx.session.new_category;
    });

    await editMessage(ctx, await createCategoryText(ctx, newCategory));
    await ctx.editMessageReplyMarkup({ reply_markup: categoryClone });
} 