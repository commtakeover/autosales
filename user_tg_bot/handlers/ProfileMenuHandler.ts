import { type MyContext } from "../Context.ts";
import { UserMenuInlineKeyboard } from "../keyboards/UserMenuKeyboard.ts";
import { getProfileMenuText } from "../textGetters/ProfileMenuText.ts";

export async function ProfileMenuHandler(ctx: MyContext) {
    await ctx.reply(await getProfileMenuText(ctx), { reply_markup: UserMenuInlineKeyboard });
}