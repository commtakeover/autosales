import dotenv from "dotenv";
import { Bot, Context } from "grammy";
import { getLtcPrice } from "./walletUtils/utils";
import { AppDataSource } from "../db/data-source";
import { logRequests } from "./middleware/myLogger";
import { LinkStatus } from "../db/entities/link.entity";
import { sweepWallet } from "./walletUtils/sweepWallets";
import express, { type Request, type Response } from "express";
import { UserRepository } from "../db/repositories/UserRepository";
import { LinkRepository } from "../db/repositories/LinkRepository";
import { IdempotencyRepository } from "../db/repositories/idempotencyRepository";
import { IncomingWalletTransactionRepository } from "../db/repositories/IncomingWalletTransactionRepository";

export const bot = new Bot<Context>(process.env.TG_NOTIFICATION_BOT_TOKEN ?? "");

dotenv.config();

// Initialize database connection first
async function initializeDatabase() {
  try {
    console.log("AppDataSource.isInitialized", AppDataSource.isInitialized);
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Data Source has been initialized!");
    }
  } catch (error) {
    console.error("Error during Data Source initialization:", error);
    process.exit(1);
  }
}

const app = express();
app.use(express.json());
app.use(logRequests);

// Optional: Handle 3rd-party webhooks
app.post("/", async (req: Request, res: Response) => {
  res.status(200).send('OK');
  // console.log("📩 External webhook received. route - '/' POST")
  const data = req.body;
  // console.log("🏦 data:", data)
  if (!data.data.item.amount) { return }
  if (data.data.item.direction !== 'incoming') { return }
  // console.log("Idempotency key:", data.idempotencyKey)
  const isIdempotencyKeyExists = await IdempotencyRepository.checkIfIdempotencyKeyExists(data.idempotencyKey)
  // console.log("🏦 isIdempotencyKeyExists:", isIdempotencyKeyExists)
  if (isIdempotencyKeyExists) { return }
  // increase user balance
  try {
    const user = await UserRepository.findByAddressHash(data.data.item.address);
    if (user) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const ltcPrice = await getLtcPrice();
      await new Promise(resolve => setTimeout(resolve, 1000))
      const amount = Number(data.data.item.amount) * ltcPrice;
      // if (typeof amount !== 'number') {
      //   console.log("🏦 amount is not a number")
      //   return
      // }
      await UserRepository.increaseBalanceBy(user.telegram_id_hash.toString(), Number(amount));
      // console.log(`📩 User ${user.id} incoming payment:\n🏦 LTC amount received: ${data.data.item.amount}\nUSD amount received: ${amount.toFixed(2)}`)
      // notify
      // const balancenotification = `🙋‍♂️ Пользователь ${user.id} пополнил баланс 💰\n💸 Сумма USD: ${amount.toFixed(2)}$\n🪙 Сумма LTC: ${data.data.item.amount} LTC\n🔗 Адрес: ${user.address_hash}`
      // await bot.api.sendMessage(process.env.TG_NOTIFICATION_CHANNEL_ID!, balancenotification)
      try {
        const userBot = new Bot<Context>(process.env.TG_USER_BOT_TOKEN!);
        await userBot.api.sendMessage(user.telegram_id_hash, `💰 Ваш баланс пополнен на ${amount.toFixed(2)}$`)
      } catch (error) { console.error("Error processing home request:", error); }
      await new Promise(resolve => setTimeout(resolve, 2000))
      const sweepResult = await sweepWallet(user.telegram_id_hash)
      // console.log("[server.ts] idempotency_key  :", data.idempotencyKey)
      await IdempotencyRepository.addIdempotencyKey(data.idempotencyKey)
      await IncomingWalletTransactionRepository.createTransaction(user.id, Number(user.telegram_id_hash), data.data.item.address, Number(data.data.item.amount), Number(amount), data.data.item.tx)
      // notify
      const allLinks = await LinkRepository.findAllLinksWithStatus(LinkStatus.ACTIVE);
      const sweepNotification = `🙋‍♂️ Пользователь пополнил баланс 💰\nID: ${user.id}\nТГ ID: ${user.telegram_id_hash}\n💸 Сумма USD: ${amount.toFixed(2)}$\n🪙 Сумма LTC: ${data.data.item.amount} LTC\n📤 Полученные средства распределены:\nДоля магазина: ${sweepResult?.shop_share! / 100000000} LTC\nДоля бота: ${sweepResult?.tax_share! / 100000000} LTC\n🔗 Адрес: ${user.address_hash}\n🔗 Транзакция: ${sweepResult?.tx}`
      await bot.api.sendMessage(process.env.TG_NOTIFICATION_CHANNEL_ID!, sweepNotification)
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
  }
});

app.post("/notifications/new-restock", async (req: Request, res: Response) => {
  console.log("📩 External webhook received. route - '/notification/new-restock' POST")
  const data = req.body;
  try {

    await bot.api.sendMessage(process.env.TG_NOTIFICATION_CHANNEL_ID!, data.text.toString(), {entities: data.entities})
  }
  catch (error) { console.error("[notifications/new-restock] Error sending message:", error); }
  res.status(200).json({ status: 'ok' });
})

// Home
app.get('/', async (req, res) => {
  // console.log("📩 External webhook received. route - '/' GET")
  // try {
  //   await sweepWallet('6396462251')
  // } catch (error) {
  //   console.error("Error processing home request:", error);
  // }

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Home</title>
      </head>
      <body>
        <h1>🏦 LTC payment service:</h1>
        <p>Payment server is up!</p>
      </body>
    </html>
  `);
});

// Start server
const PORT = process.env.SERVER_PORT || 3000;

// Initialize database and start server
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🏦 LTC payment server running on port ${PORT}`);
    console.log(`ENV CHECK:`)
    console.log(`-- PORT: ${process.env.SERVER_PORT}`)
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
