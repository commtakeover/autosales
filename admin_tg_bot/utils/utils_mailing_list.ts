import { Bot, Context } from "grammy";
import { UserRepository } from "../../db/repositories/UserRepository.ts";

export async function sendMessageToAllUsers(message: string) {
    console.log("Sending message to all users");
    if (!message) {
        console.log("Message is empty");
        return;
    }

    const userIds = await UserRepository.findAllUserTelegramIds();
    console.log('Users ids', userIds);
    const bot = new Bot<Context>(process.env.TG_USER_BOT_TOKEN ?? "");
    for (const userId of userIds) {
        console.log('Sending message to user', userId);
        try {
            await bot.api.sendMessage(userId, message);
            await new Promise(resolve => setTimeout(resolve, 40));
        } catch (error) {
            console.error('Error sending message to user', userId, error);
        }
    }
}