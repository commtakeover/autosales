import { type MyContext } from "../Context.ts";

export async function FaqMenuHandler(ctx: MyContext) {
    await ctx.reply("FAQ");
}