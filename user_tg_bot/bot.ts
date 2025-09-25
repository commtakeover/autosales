import 'reflect-metadata';
import { Client } from "pg";
import { initial } from "./initial";
import { PsqlAdapter } from "@grammyjs/storage-psql";
import { MainMenuKeyboard } from "./keyboards/MainMenuKeyboard";
import { Bot, session } from "grammy";
import { type ConversationFlavor, conversations, createConversation } from "@grammyjs/conversations";
import {
  type MyContext,
} from "./Context";
import { AppDataSource } from "../db/data-source";
import { accessControl } from "./middleware/AccessControl";
import { ProfileMenuHandler } from "./handlers/ProfileMenuHandler";
import { UserMenuInlineKeyboard } from "./keyboards/UserMenuKeyboard";
import { checkIfUserExistsAndCreate } from "./utils/checkIfUserExistsAndCreate";
import { BuyMenuHandler } from "./handlers/BuyMenuHandler";
import { BuyMenuInlineKeyboard } from "./keyboards/BuyMenuKeyboard";
import { FaqMenuHandler } from "./handlers/FaqMenuHandler";
import { ReviewsMenuHandler } from "./handlers/ReviewsMenuHandler";
import { SupportMenuHandler } from "./handlers/SupportMenuHandler";
import { TaplinkMenuHandler } from "./handlers/TaplinkMenuHandler";
import { leaveReviewComment, leaveReviewMenuKeyboard, leaveReviewRating, reviewsMenuKeyboard } from './keyboards/ReviewsMenuKeyboard';
import { hydrate } from '@grammyjs/hydrate';


// async function main() {
  // Initialize TypeORM Data Source
  console.log("AppDataSource.isInitialized", AppDataSource.isInitialized)
  try {
    await AppDataSource.initialize()
    console.log("Data Source has been initialized!")
  } catch (error) {
    console.error("Error during Data Source initialization:", error)
    process.exit(1)
  
  }

  const client = new Client({
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      database: process.env.DATABASE_NAME,
  })
  await client.connect()

  export const bot = new Bot<ConversationFlavor<MyContext>>(process.env.TG_USER_BOT_TOKEN ?? "");

  // Configure session middleware with PostgreSQL storage
  bot.use(session({
      initial,
      getSessionKey: (ctx) => `user_${ctx.from?.id.toString()}`,
      storage: await PsqlAdapter.create({ tableName: 'sessions', client }),
  }));

  bot.use(conversations());
  bot.use(createConversation(leaveReviewRating, { plugins: [hydrate()] }))
  bot.use(createConversation(leaveReviewComment, { plugins: [hydrate()] }))

  bot.use(accessControl);

  bot.use(UserMenuInlineKeyboard);
  bot.use(BuyMenuInlineKeyboard);
  bot.use(reviewsMenuKeyboard);
  bot.use(leaveReviewMenuKeyboard);

  bot.command("start", async (ctx) => {
      await ctx.reply("Welcome to Vireon! 🤖\n", { reply_markup: MainMenuKeyboard });
      console.log("/start");
      try {
        const user = await checkIfUserExistsAndCreate(ctx.from!.id)
        // console.log("[bot.command] user:", user)
      } catch (error) {
        console.log("[bot.command /start] error checking if user exists and creating user:", error)
      }
  });

  // bot.command("test", async (ctx) => {
  //     // const addresses = await listSubscribedEvents ()
  //     await isAddressSubscribed("tb1qtm44m6xmuasy4sc7nl7thvuxcerau2dfvkkgsc")
  // })

  // bot.command("faq", faqHandler);

  bot.hears("👤 Профиль", ProfileMenuHandler);
  bot.hears("🛍️ Купить", BuyMenuHandler);
  bot.hears("💬 Поддержка", SupportMenuHandler);
  // bot.hears("❓ FAQ", FaqMenuHandler);
  // bot.hears("⭐️ Отзывы", ReviewsMenuHandler);
  // bot.hears("🌐 Taplink", TaplinkMenuHandler);

  console.log("🤖 Bot started");
  bot.start();

  // - - - - - - - - - - - - - - - GRACEFULL SHUTDOWN - - - - - - - - - - - - - - -
  // Add error handler
  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof Error) {
      console.error("Error:", e.message);
      console.error("Stack:", e.stack);
    } else {
      console.error("Error:", e);
    }
  });

  async function shutdown(signal: string) {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);

    try {
      await bot.api.sendMessage('6396462251', 'Bot stopped x_X')
      await bot.stop();
      console.log("🤖❌🤖 Telegram bot stopped.")
      
      // Close database connections
      await client.end();
      console.log("PostgreSQL client connection closed.")
      await AppDataSource.destroy();
      console.log("TypeORM Data Source connection closed.")
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
    } finally {
      process.exit(0);
    }
  }

  ['SIGINT', 'SIGTERM'].forEach(signal => {
    process.once(signal, () => shutdown(signal));
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    shutdown('uncaughtException');
  });
// }

// // Start the application
// main().catch(console.error);