import { bot } from "../../bot.ts";
import { type MyContext } from "../../Context.ts";
import { createCategoryText } from "../../textGetters/createCategoryText.ts";
import { editMessage } from "../../keyboards/keyboardUtils/KeyboardUtils.ts";
import { createCategoryClone } from "../menuClones.ts/createCategoryClone.ts";

export async function quantityConversation(conversation: any, ctx: MyContext) {
    const categoryClone = createCategoryClone(conversation);
    const checkpoint = conversation.checkpoint();
    const msg = await ctx.reply("Отправьте количество (целое число)");
    const quantity = await conversation.form.number({
        action: async (ctx: any) => {
            const msgToDelete = await conversation.external((ctx: MyContext) => { return ctx.session.msgToDelete });
            if (msgToDelete.from === "quantityConversation") {
                try { await bot.api.deleteMessage(msgToDelete.chat_id, msgToDelete.message_id) }
                catch (error) { console.log("couldn't delete message:") }
            }
            try {
                await bot.api.deleteMessage(msg.chat.id, msg.message_id);
                await bot.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            } catch (error) { console.log("couldn't delete message:") }
            
            if (Number(ctx.message.text) < 1) {
                const msg1 = await ctx.reply("Количество не может быть меньше 1 и должно быть целым числом");
                await conversation.external((ctx: MyContext) => {
                    ctx.session.msgToDelete.from = "quantityConversation";
                    ctx.session.msgToDelete.chat_id = msg1.chat.id;
                    ctx.session.msgToDelete.message_id = msg1.message_id;
                });
                return conversation.rewind(checkpoint);
            }
        },
        otherwise: async (ctx: any) => {
            const msg1 = await ctx.reply("Нужно отправить количество");
            await conversation.external((ctx: MyContext) => {
                ctx.session.msgToDelete.from = "quantityConversation";
                ctx.session.msgToDelete.chat_id = msg1.chat.id;
                ctx.session.msgToDelete.message_id = msg1.message_id;
            });
            return conversation.rewind(checkpoint);
        }
    });
    
    let newCategory: any;

    await conversation.external((ctx: MyContext) => {
        ctx.session.new_category.quantity = quantity.toString();
        newCategory = ctx.session.new_category;
    });

    await editMessage(ctx, await createCategoryText(ctx, newCategory));
    await ctx.editMessageReplyMarkup({ reply_markup: categoryClone });
} 