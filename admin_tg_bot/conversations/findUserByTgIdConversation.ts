import { Bot } from "grammy";
import { bot } from "../bot.ts";
import { type MyContext } from "../Context.ts";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import { PurchaseRepository } from "../../db/repositories/PurchaseRepository.js";

/**
 * Handles the conversation to find a user by their Telegram ID
 */
export async function findUserByTgIdConversation(conversation: any, ctx: MyContext) {
    const checkpoint = conversation.checkpoint();

    const msg = await ctx.reply("Введите Telegram ID пользователя:");
    const telegramId = await conversation.form.text({
        action: async (ctx: any) => {
            const msgToDelete = await conversation.external((ctx: MyContext) => { 
                return ctx.session.msgToDelete; 
            });
            
            if (msgToDelete.from === "find_user_by_tg_id_conversation") {
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
                const msg1 = await ctx.reply("Telegram ID не может быть пустым");
                await conversation.external((ctx: MyContext) => {
                    ctx.session.msgToDelete.from = "find_user_by_tg_id_conversation";
                    ctx.session.msgToDelete.chat_id = msg1.chat.id;
                    ctx.session.msgToDelete.message_id = msg1.message_id;
                });
                return conversation.rewind(checkpoint);
            }
            
            // Validate that the input is a number
            const tgId = ctx.message.text.trim();
            if (isNaN(Number(tgId))) {
                const msg1 = await ctx.reply("Telegram ID должен быть числом");
                await conversation.external((ctx: MyContext) => {
                    ctx.session.msgToDelete.from = "find_user_by_tg_id_conversation";
                    ctx.session.msgToDelete.chat_id = msg1.chat.id;
                    ctx.session.msgToDelete.message_id = msg1.message_id;
                });
                return conversation.rewind(checkpoint);
            }
        },
        otherwise: async (ctx: any) => {
            const msg1 = await ctx.reply("Пожалуйста, отправьте числовое значение Telegram ID");
            await conversation.external((ctx: MyContext) => {
                ctx.session.msgToDelete.from = "find_user_by_tg_id_conversation";
                ctx.session.msgToDelete.chat_id = msg1.chat.id;
                ctx.session.msgToDelete.message_id = msg1.message_id;
            });
            return conversation.rewind(checkpoint);
        }
    });

    try {
        const tgId = telegramId.trim();
        const user = await UserRepository.findByTgId(tgId);
        
        if (!user) {
            await ctx.reply(`❌ Пользователь с Telegram ID ${tgId} не найден`);
            return;
        }
        
        // Format user information
        let userInfo = `👤 Информация о пользователе:\n🆔 ID: ${user.id}\n📱 Telegram ID: ${user.telegram_id_hash}\n💰 Баланс USD: ${user.balance_usd}$\n🏠 Адрес: ${user.address_hash}\n🎫 Скидка: ${user.discount}%\n📅 Дата создания: ${user.created_at ? new Date(user.created_at).toLocaleString() : 'Не указана'}`;

        if (user.purchases.length > 0) {
            userInfo += "\n\n🛒 Покупки:\n"
        }
        for (const purchase of user.purchases) {
            const purchaseData = await PurchaseRepository.findById(purchase.id)
            // console.log(purchaseData)
            userInfo += `\t\t💰 Сумма: ${purchase.purchase_price}\n🔗 Ссылка: ${purchaseData!.link.link}\n📅 Дата покупки: ${purchase.created_at ? new Date(purchase.created_at).toLocaleString() : 'Не указана'}\n`
        }

        await ctx.reply(userInfo);
        
    } catch (error) {
        console.error("Error finding user:", error);
        await ctx.reply("❌ Ошибка при поиске пользователя");
    }
} 