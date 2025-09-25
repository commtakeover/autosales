import { Client } from "pg";
import { Bot, session } from "grammy";
import { initial } from "./initial.ts";
import { hydrate } from "@grammyjs/hydrate";
import { type MyContext  } from "./Context.ts";
import { PsqlAdapter } from "@grammyjs/storage-psql";
import { AppDataSource } from "../db/data-source.ts";
import { shopHandler } from "./handlers/shopHandler.ts";
import { usersHandler } from "./handlers/usersHandler.ts";
import { accessControl } from "./middleware/AccessControl.ts";
import { goodsMenuHandler } from "./handlers/goodsMenuHandler.ts";
import { MainMenuKeyboard } from "./keyboards/MainMenuKeyboard.ts";
import { UserRepository } from "../db/repositories/UserRepository.ts";
import { UsersMainKeyboard } from "./keyboards/users/UsersMainKeyboard.ts";
import { GoodsMenuInlineKeyboard } from "./keyboards/goods/GoodsMenuKeyboard.ts";
import { ShopMainKeyboard } from "./keyboards/shop/ShopMainKeyboard.ts";
import { MailingListKeyboard } from "./keyboards/shop/MailingListKeyboard.ts";
import { nameConversation } from "./conversations/restockConversations/name.conversation.ts";
import { placeConversation } from "./conversations/restockConversations/place.conversation.ts";
import { priceConversation } from "./conversations/restockConversations/price.conversation.ts";
import { linksConversation } from "./conversations/restockConversations/links.conversation.ts";
import { type ConversationFlavor, conversations, createConversation } from "@grammyjs/conversations";
import { subplaceConversation } from "./conversations/restockConversations/subplace.conversation.ts";
import { categoryConversation } from "./conversations/restockConversations/category.conversation.ts";
import { quantityConversation } from "./conversations/restockConversations/quantity.conversation.ts";
import { delivererConversation } from "./conversations/restockConversations/deliverer.conversation.ts";
import { domainConversation } from "./conversations/restockConversations/manufacturer.conversation.ts";
import { subdomainConversation } from "./conversations/restockConversations/subcategory.conversation.ts";
import { unit_of_measureConversation } from "./conversations/restockConversations/unit_of_measure.conversation.ts";
import { activateLinkConversation } from "./conversations/linkStatusChange/activateLinkConversation.ts";
import { moveLinkToStashConversation } from "./conversations/linkStatusChange/moveLinkToStashConversation.ts";
import { mailingListConversation } from "./conversations/mailingListConversation.ts";
import { findUserByTgIdConversation } from "./conversations/findUserByTgIdConversation.ts";
import { LinkRepository } from "../db/repositories/LinkRepository.ts";
import { LinkStatus } from "../db/entities/link.entity.ts";
import { InventoryRestockRepository } from "../db/repositories/InventoryRestockRepository.ts";

// Initialize TypeORM Data Source
await AppDataSource.initialize()
  .then(async () => {
    console.log("Data Source has been initialized!")
    // console.log(await UserRepository.findByTgId("6396462251"));
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err)
    process.exit(1)
  })

const client = new Client({
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    database: process.env.DATABASE_NAME,
})
await client.connect()

export const bot = new Bot<ConversationFlavor<MyContext>>(process.env.TG_ADMIN_BOT_TOKEN ?? "");

// Configure session middleware with PostgreSQL storage
bot.use(session({
    initial,
    getSessionKey: (ctx) => `admin_${ctx.from?.id.toString()}`,
    storage: await PsqlAdapter.create({ tableName: 'sessions', client }),
}));

bot.use(conversations());
bot.use(createConversation(priceConversation, { plugins: [hydrate()] }))
bot.use(createConversation(nameConversation, { plugins: [hydrate()] }))
bot.use(createConversation(placeConversation, { plugins: [hydrate()] }))
bot.use(createConversation(subplaceConversation, { plugins: [hydrate()] }))
bot.use(createConversation(categoryConversation, { plugins: [hydrate()] }))
bot.use(createConversation(quantityConversation, { plugins: [hydrate()] }))
bot.use(createConversation(unit_of_measureConversation, { plugins: [hydrate()] }))
bot.use(createConversation(delivererConversation, { plugins: [hydrate()] }))
bot.use(createConversation(domainConversation, { plugins: [hydrate()] }))
bot.use(createConversation(subdomainConversation, { plugins: [hydrate()] }))
bot.use(createConversation(linksConversation, { plugins: [hydrate()] }))
bot.use(createConversation(activateLinkConversation, { plugins: [hydrate()] }))
bot.use(createConversation(moveLinkToStashConversation, { plugins: [hydrate()] }))
bot.use(createConversation(mailingListConversation, { plugins: [hydrate()] }))
bot.use(createConversation(findUserByTgIdConversation, { plugins: [hydrate()] }))

bot.use(accessControl);

bot.use(GoodsMenuInlineKeyboard);
bot.use(UsersMainKeyboard);
bot.use(ShopMainKeyboard);
bot.use(MailingListKeyboard);


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

bot.command("start", async (ctx) => {
    await ctx.reply("MAIN MENU", { reply_markup: MainMenuKeyboard });
    console.log("/start");
    
    // console.log(await UserRepository.findByTgId(ctx.from?.id.toString() ?? ""));
});

bot.command("balance", async (ctx) => {
  console.log("/balance");
  const serverBot = new Bot<MyContext>(process.env.TG_NOTIFICATION_BOT_TOKEN!);
  const keys = ctx.message!.text.split(" ");
  if (keys[1] == "increase" && typeof keys[2] == "string" && Number(keys[3])) {
    const user = await UserRepository.findByTgId(keys[2]!);
    if (user) {
      await UserRepository.increaseBalanceBy(user.telegram_id_hash.toString(), Number(keys[3]));
      await ctx.reply(`👨‍💻 Баланс пользователя ${user.id} увеличен на ${keys[3]} USD`);
      await serverBot.api.sendMessage(process.env.TG_NOTIFICATION_CHANNEL_ID!, `👨‍💻 Админ увеличил баланс пользователя ${user.id} на ${keys[3]} USD\n🔗 Адрес: ${user.address_hash}`);
    } else {
      await ctx.reply("🔍 Пользователь не найден");
    }
  } else if (keys[1] == "decrease") {
    const user = await UserRepository.findByTgId(keys[2]!);
    if (user) {
      await UserRepository.decreaseBalanceBy(user.telegram_id_hash.toString(), Number(keys[3]));
      await ctx.reply(`👨‍💻 Баланс пользователя ${user.id} уменьшен на ${keys[3]} USD`);
      await serverBot.api.sendMessage(process.env.TG_NOTIFICATION_CHANNEL_ID!, `👨‍💻 Админ уменьшил баланс пользователя ${user.id} на ${keys[3]} USD\n🔗 Адрес: ${user.address_hash}`);
    } else {
      await ctx.reply("🔍 Пользователь не найден");
    }
  } else ctx.reply(`❌ Неверная команда ❌`);
})

bot.command("restock", async (ctx) => {
  console.log("/restock");
  const serverBot = new Bot<MyContext>(process.env.TG_NOTIFICATION_BOT_TOKEN!);
  const keys = ctx.message!.text.split(" ");
  if (keys[1] == "activate" && Number(keys[2])) {
    try {
      const links = await LinkRepository.findAllLinksWithStatusByRestockId(Number(keys[2]))
      for (const link of links) {
          await LinkRepository.updateLink(link.id, { link_status: LinkStatus.ACTIVE })
      }
      await ctx.reply(`👨‍💻 Ссылки из пополнения #${keys[2]} активированы`);
      await serverBot.api.sendMessage(process.env.TG_NOTIFICATION_CHANNEL_ID!, `👨‍💻 Админ активировал ссылки из пополнения #${keys[2]}`);
    } catch (error) {
      await ctx.reply(`❌ Ошибка при активации ссылок из пополнения #${keys[2]} ❌`);
    }
  } else if (keys[1] == "stash" && Number(keys[2])) {
    try {
      const links = await LinkRepository.findAllLinksWithStatusByRestockId(Number(keys[2]))
      for (const link of links) {
          await LinkRepository.updateLink(link.id, { link_status: LinkStatus.STASHED })
      }
      await ctx.reply(`👨‍💻 Ссылки из пополнения #${keys[2]} перемещены в стэш`);
      await serverBot.api.sendMessage(process.env.TG_NOTIFICATION_CHANNEL_ID!, `👨‍💻 Админ переместил ссылки из пополнения #${keys[2]} в стэш`);
    } catch (error) {
      await ctx.reply(`❌ Ошибка при перемещении ссылок из пополнения #${keys[2]} в стэш ❌`);
    }
  } else if (keys[1] == "show") {
    try {
      const restocks = await InventoryRestockRepository.findLastXRestocks(2)
      const lastTwoRestocks = restocks.slice(-2)
      for (const restock of lastTwoRestocks) {
        const aLink = await LinkRepository.findOneLinkWithStatusByRestockId(restock.id)
        await ctx.reply(`👨‍💻 Пополнение #${restock.id}\n- - - - - - - - - -\n📦 Название: ${aLink?.name} | ${restock.quantity}${aLink?.unit_of_measure} | ${aLink?.price_usd}\n📍 Город: ${aLink?.place?.name} | Район: ${aLink?.subplace?.name}\n📁 Категория: ${aLink?.category?.name}\n📅 Дата: ${restock.created_at}`);
      }
    } catch (error) {
      await ctx.reply(`❌ Ошибка при отображении последних двух пополнений ❌`);
    }
  } else ctx.reply(`❌ Неверная команда ❌`);
})

// bot.command("faq", faqHandler);

bot.hears("🛒 Товары", goodsMenuHandler);
bot.hears("💰 Кошельки", usersHandler);
bot.hears("🏪 Магазин", shopHandler);


// bot.hears("🛒 Товары", async (ctx) => {
//     const goodsReview = await getGoodsAndStringify("active", 20, "delivery", `Активных позиций: 61\nСтэш: 129\n\nПозиции:`)
//     await ctx.reply(goodsReview, { reply_markup: GoodsMenuInlineKeyboard });
// });

console.log("🤖 Bot started");
bot.start();

// - - - - - - - - - - - - - - - GRACEFULL SHUTDOWN - - - - - - - - - - - - - - -
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