import { type MyContext } from "../Context.ts";

export async function TaplinkMenuHandler(ctx: MyContext) {
    await ctx.reply(process.env.TAPLINK ?? "Таплинк не установлен");
}