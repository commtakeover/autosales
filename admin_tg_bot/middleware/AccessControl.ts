import { type MyContext  } from "../Context.ts";

export const accessControl = async (ctx: MyContext, next: () => Promise<void>) => {
    const allowedUsers = JSON.parse(process.env.ALLOWED_USERS ?? "[]");
    const userTgId = ctx.from?.id.toString();
    if (!userTgId) {
      console.error("No user ID found in context");
      return;
    }
    if (!allowedUsers?.includes(userTgId)) {
      console.log("User not found in allowed users");
      return;
    }
    await next();
}