import { type MyContext  } from "../Context.ts";

export const accessControl = async (ctx: MyContext, next: () => Promise<void>) => {
    if (process.env.DEV_MODE == "true") {

        const allowedUsers = JSON.parse(process.env.ALLOWED_USERS ?? "[]");
        const userTgId = ctx.from?.id.toString();
        if (!userTgId) {
        console.error("No user ID found in context");
        return;
        }
        if (!allowedUsers?.includes(userTgId)) { return ctx.reply("❌ Ведутся технические работы ❌"); }
        await next();
    } else await next();
}