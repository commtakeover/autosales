import { Menu } from "@grammyjs/menu";
import { type MyContext } from "../../Context.ts";
import { MailingListKeyboard } from "./MailingListKeyboard.ts";

/**
 * Main shop keyboard with mailing list submenu
 */
export const ShopMainKeyboard = new Menu<MyContext>("shop_menu")
    .submenu("📢 Рассылка 📢", "mailing_list")
    .row()
    // .text("📊 Статистика", async (ctx: MyContext) => {
    //     await ctx.reply("📊 Статистика магазина\n\nФункция в разработке...");
    // })
    // .row()
    // .text("⚙️ Настройки", async (ctx: MyContext) => {
    //     await ctx.reply("⚙️ Настройки магазина\n\nФункция в разработке...");
    // }); 

ShopMainKeyboard.register(MailingListKeyboard);