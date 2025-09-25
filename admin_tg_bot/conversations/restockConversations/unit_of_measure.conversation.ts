import { bot } from "../../bot.ts";
import { type MyContext, type UnitOfMeasureContext, type UnitOfMeasureConversation } from "../../Context.ts";
import { createCategoryText } from "../../textGetters/createCategoryText.ts";
import { editMessage } from "../../keyboards/keyboardUtils/KeyboardUtils.ts";
import { createCategoryClone } from "../menuClones.ts/createCategoryClone.ts";

export async function unit_of_measureConversation(conversation: UnitOfMeasureConversation, ctx: UnitOfMeasureContext) {
    const categoryClone = createCategoryClone(conversation);
    const checkpoint = conversation.checkpoint();

    const msg = await ctx.reply("Отправьте единицу измерения:\nДоступные варианты: `гр`, `г`, `шт`");
    const unit = await conversation.form.text({
        action: async (ctx: any) => {
            const msgToDelete = await conversation.external((ctx: UnitOfMeasureContext) => { return ctx.session.msgToDelete });
            // console.log("msgToDelete:", msgToDelete);

            if (msgToDelete.from === "unit_of_measureConversation") {
                try { await bot.api.deleteMessage(msgToDelete.chat_id, msgToDelete.message_id) }
                catch (error) { console.log("couldn't delete message:") }
            }
            try {
                await bot.api.deleteMessage(msg.chat.id, msg.message_id);
                await bot.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            } catch (error) { console.log("couldn't delete message:") }
            
            if (ctx.message.text !== "гр" && ctx.message.text !== "г" && ctx.message.text !== "шт") {
                // console.log("Неверная единица измерения");
                const msg1 = await ctx.reply("Неверная единица измерения");
                await conversation.external((ctx: UnitOfMeasureContext) => {
                    ctx.session.msgToDelete.from = "unit_of_measureConversation";
                    ctx.session.msgToDelete.chat_id = msg1.chat.id;
                    ctx.session.msgToDelete.message_id = msg1.message_id;
                });
                return conversation.rewind(checkpoint);
            }
        },
        otherwise: async (ctx: any) => {
            const msgToDelete = await conversation.external((ctx: UnitOfMeasureContext) => { return ctx.session.msgToDelete });
            if (msgToDelete.from === "unit_of_measureConversation") {
                try { await bot.api.deleteMessage(msgToDelete.chat_id, msgToDelete.message_id) }
                catch (error) { console.log("couldn't delete message:") }
            }
            try {
                await bot.api.deleteMessage(msg.chat.id, msg.message_id);
                await bot.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            } catch (error) { console.log("couldn't delete message:") }
            const msg1 = await ctx.reply("Нужно отправить единицу измерения текстом:\nДоступные варианты: `гр`, `г`, `шт`");
            await conversation.external((ctx: UnitOfMeasureContext) => {
                ctx.session.msgToDelete.from = "unit_of_measureConversation";
                ctx.session.msgToDelete.chat_id = msg1.chat.id;
                ctx.session.msgToDelete.message_id = msg1.message_id;
            });
            return conversation.rewind(checkpoint);
        }
    });

    // console.log("unit:", unit);
    
    let newCategory: any;

    await conversation.external((ctx: MyContext) => {
        ctx.session.new_category.unit_of_measure = unit;
        newCategory = ctx.session.new_category;
    });

    await editMessage(ctx, await createCategoryText(ctx, newCategory));
    await ctx.editMessageReplyMarkup({ reply_markup: categoryClone });
} 