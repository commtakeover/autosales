import { Context, InlineKeyboard } from "grammy";
import { generateMockData } from "../../mockup_db";

export const editMessage = async (ctx: Context, message: string, entities?: any[], reply_markup?: any) => {
    try {
        if (entities && reply_markup) {
            await ctx.editMessageText(message, { entities: entities, reply_markup: reply_markup });
        } else if (entities) {
            await ctx.editMessageText(message, { entities: entities });
        } else if (reply_markup) {
            await ctx.editMessageText(message, { reply_markup: reply_markup });
        } else {
            await ctx.editMessageText(message);
        }
    } catch (error: any) {
        console.log("[editMessage error] - ", error.message);
        if (error.message.includes("specified new message content and reply markup are exactly the same as a current content and reply markup of the message")) {
            return
        }
    }
};