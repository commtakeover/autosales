import { bot } from "../bot.ts";
import { Menu } from "@grammyjs/menu";
import { type MyContext } from "../Context.ts";
import { createCategoryText } from "../textGetters/createCategoryText.ts";
import { editMessage } from "../keyboards/keyboardUtils/KeyboardUtils.ts";
import { createCategoryClone } from "../conversations/menuClones.ts/createCategoryClone.ts";
import { UserRepository } from "../../db/repositories/UserRepository.ts";
import { ShopMainKeyboard } from "../keyboards/shop/ShopMainKeyboard.ts";
import { MailingListKeyboard } from "../keyboards/shop/MailingListKeyboard.ts";
import { shopMenuText } from "../textGetters/shopMenuText.ts";

export async function shopHandler(ctx: MyContext) {
    try {
        const shopText = await shopMenuText();
        await ctx.reply(shopText, { reply_markup: ShopMainKeyboard });
    } catch (error) {
        console.error("Error in shopHandler:", error);
        await ctx.reply("❌ Ошибка при загрузке меню магазина");
    }
}