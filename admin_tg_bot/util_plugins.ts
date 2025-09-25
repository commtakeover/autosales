import type { Context, NextFunction } from "grammy";

// Measures the response time of the bot, and logs it to `console`
export async function responseTime(
    ctx: Context,
    next: NextFunction,
  ): Promise<void> {
    const before = Date.now() / 1000;
    await next(); // make sure to `await`!
    const after = Date.now() / 1000;
    console.log(`⏲️  Response time: ${after - before} ms ⏲️`);
  }