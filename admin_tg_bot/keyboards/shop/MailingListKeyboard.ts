import { Menu } from "@grammyjs/menu";
import { type MyContext } from "../../Context.ts";

/**
 * Mailing list keyboard for shop functionality
 */
export const MailingListKeyboard = new Menu<MyContext>("mailing_list")
    .text("📢 Отправить всем 📢", async (ctx: MyContext) => {
        await ctx.conversation.enter("mailingListConversation");
    })
    .row()
    .back("◀️ Назад"); 