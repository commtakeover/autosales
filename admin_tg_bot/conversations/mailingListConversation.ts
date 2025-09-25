import { Bot } from "grammy";
import { bot } from "../bot.ts";
import { type MyContext } from "../Context.ts";
import { sendMessageToAllUsers } from "../utils/utils_mailing_list.ts";

/**
 * Handles the mailing list conversation to collect and send messages
 */
export async function mailingListConversation(conversation: any, ctx: MyContext) {
    const checkpoint = conversation.checkpoint();

    const msg = await ctx.reply("Введите текст рассылки");
    const text = await conversation.form.text({
        action: async (ctx: any) => {
            const msgToDelete = await conversation.external((ctx: MyContext) => { 
                return ctx.session.msgToDelete; 
            });
            
            if (msgToDelete.from === "mailingListConversation") {
                try { 
                    await bot.api.deleteMessage(msgToDelete.chat_id, msgToDelete.message_id) 
                } catch (error) { 
                    console.log("couldn't delete message:", error) 
                }
            }
            
            try {
                await bot.api.deleteMessage(msg.chat.id, msg.message_id);
                await bot.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
            } catch (error) { 
                console.log("couldn't delete message:", error) 
            }
            
            if (!ctx.message.text || ctx.message.text.trim().length === 0) {
                const msg1 = await ctx.reply("Текст рассылки не может быть пустым");
                await conversation.external((ctx: MyContext) => {
                    ctx.session.msgToDelete.from = "mailingListConversation";
                    ctx.session.msgToDelete.chat_id = msg1.chat.id;
                    ctx.session.msgToDelete.message_id = msg1.message_id;
                });
                return conversation.rewind(checkpoint);
            }
            
            if (ctx.message.text.length > 4096) {
                const msg1 = await ctx.reply("Текст рассылки не может быть длиннее 4096 символов");
                await conversation.external((ctx: MyContext) => {
                    ctx.session.msgToDelete.from = "mailingListConversation";
                    ctx.session.msgToDelete.chat_id = msg1.chat.id;
                    ctx.session.msgToDelete.message_id = msg1.message_id;
                });
                return conversation.rewind(checkpoint);
            }
        },
        otherwise: async (ctx: any) => {
            const msg1 = await ctx.reply("Пожалуйста, отправьте текстовое сообщение");
            await conversation.external((ctx: MyContext) => {
                ctx.session.msgToDelete.from = "mailingListConversation";
                ctx.session.msgToDelete.chat_id = msg1.chat.id;
                ctx.session.msgToDelete.message_id = msg1.message_id;
            });
            return conversation.rewind(checkpoint);
        }
    });

    try {
        // Send message to the specified chat ID
        await sendMessageToAllUsers(text);
        const serverBot = new Bot<MyContext>(process.env.TG_NOTIFICATION_BOT_TOKEN!);
        await serverBot.api.sendMessage(process.env.TG_NOTIFICATION_CHANNEL_ID!, `📮 Завершилась рассылка всем пользователям:\n📝 Текст: ${text}`);
        await ctx.reply("✅ Рассылка всем пользователям завершена ✅");
    } catch (error) {
        console.error("Error sending message:", error);
        await ctx.reply("❌ Ошибка при отправке сообщения");
    }
}