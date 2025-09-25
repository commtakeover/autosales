import { bot } from "../../bot.ts";
import { type MyContext, type PriceContext, type PriceConversation } from "../../Context.ts";
import { createCategoryText } from "../../textGetters/createCategoryText.ts";
import { editMessage } from "../../keyboards/keyboardUtils/KeyboardUtils.ts";
import { createCategoryClone } from "../menuClones.ts/createCategoryClone.ts";

export async function priceConversation(conversation: PriceConversation, ctx: PriceContext) {
    const categoryClone = createCategoryClone(conversation);
    const checkpoint = conversation.checkpoint();

    const msg = await ctx.reply("Отправьте цену целым числом или числом с одним или двумя десятичными\nПример: 38 или 38.50");
    const price = await conversation.form.number({
        action: async (ctx: any) => {
            const msgToDelete = await conversation.external((ctx: MyContext) => { return ctx.session.msgToDelete });
            if (msgToDelete.from === "priceConversation") {
                try { await bot.api.deleteMessage(msgToDelete.chat_id, msgToDelete.message_id) }
                catch (error) { console.log("couldn't delete message:") }
            }
            try {
                await bot.api.deleteMessage(msg.chat.id, msg.message_id);
                await bot.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            } catch (error) { console.log("couldn't delete message:") }
            
            if (Number(ctx.message.text) < 1) {
                const msg1 = await ctx.reply("Цена не может быть отрицательной");
                await conversation.external((ctx: MyContext) => {
                    ctx.session.msgToDelete.from = "priceConversation";
                    ctx.session.msgToDelete.chat_id = msg1.chat.id;
                    ctx.session.msgToDelete.message_id = msg1.message_id;
                });
                return conversation.rewind(checkpoint);
            }
        },
        otherwise: async (ctx: any) => {
            const msg1 = await ctx.reply("Нужно отправить цену целым числом или числом с одним или двумя десятичными\nПример: 38 или 38.50");
            await conversation.external((ctx: MyContext) => {
                ctx.session.msgToDelete.from = "priceConversation";
                ctx.session.msgToDelete.chat_id = msg1.chat.id;
                ctx.session.msgToDelete.message_id = msg1.message_id;
            });
            return conversation.rewind(checkpoint);
        }
    });
    let newCategory: any;

    // console.log("price:", price);

    await conversation.external((ctx: MyContext) => {
        ctx.session.new_category.price_usd = price.toFixed(2).toString();
        newCategory = ctx.session.new_category;
    });

    await editMessage(ctx, await createCategoryText(ctx, newCategory));
    await ctx.editMessageReplyMarkup({ reply_markup: categoryClone });
}