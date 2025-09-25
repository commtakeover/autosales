import { bot } from "../../bot.ts";
import { type MyContext } from "../../Context.ts";
import { editMessage } from "../../keyboards/keyboardUtils/KeyboardUtils.ts";
import { createCategoryText } from "../../textGetters/createCategoryText.ts";
import { createCategoryClone } from "../menuClones.ts/createCategoryClone.ts";

export async function categoryConversation(conversation: any, ctx: MyContext) {
    const categoryClone = createCategoryClone(conversation);
    const checkpoint = conversation.checkpoint();
    const msg = await ctx.reply("Отправьте название категории");
    const category = await conversation.form.text({
        action: async (ctx: any) => {
            const msgToDelete = await conversation.external((ctx: MyContext) => { return ctx.session.msgToDelete });
            if (msgToDelete.from === "categoryConversation") {
                try { await bot.api.deleteMessage(msgToDelete.chat_id, msgToDelete.message_id) }
                catch (error) { console.log("couldn't delete message:") }
            }
            try {
                await bot.api.deleteMessage(msg.chat.id, msg.message_id);
                await bot.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            } catch (error) { console.log("couldn't delete message:") }
            
            if (ctx.message.text.length > 20) {
                const msg1 = await ctx.reply("Название категории не может быть длиннее 20 символов");
                await conversation.external((ctx: MyContext) => {
                    ctx.session.msgToDelete.from = "categoryConversation";
                    ctx.session.msgToDelete.chat_id = msg1.chat.id;
                    ctx.session.msgToDelete.message_id = msg1.message_id;
                });
                return conversation.rewind(checkpoint);
            }
        },
        otherwise: async (ctx: any) => {
            const msg1 = await ctx.reply("Нужно отправить название категории");
            conversation.external((ctx: MyContext) => {
                ctx.session.msgToDelete.from = "categoryConversation";
                ctx.session.msgToDelete.chat_id = msg1.chat.id;
                ctx.session.msgToDelete.message_id = msg1.message_id;
            });
            return conversation.rewind(checkpoint);
        }
    });
    
    let newCategory: any;

    await conversation.external((ctx: MyContext) => {
        ctx.session.new_category.category = category;
        newCategory = ctx.session.new_category;
    });

    await editMessage(ctx, await createCategoryText(ctx, newCategory));
    await ctx.editMessageReplyMarkup({ reply_markup: categoryClone });
} 