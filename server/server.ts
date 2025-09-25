import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import https from "https";
import { Bot, Context } from "grammy";
import authRouter from "./routes/auth";
import secureRouter from "./routes/secure";
import inventoryRouter from "./routes/inventory";
import cookieParser from "cookie-parser";
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
import { PurchaseRepository } from "../db/repositories/PurchaseRepository";

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
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:4200,http://localhost:5173,http://localhost:80').split(','),
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(logRequests);

// // Security headers for HTTPS
// app.use((req, res, next) => {
//   // Only set secure headers in production or when HTTPS is enabled
//   if (process.env.NODE_ENV === 'production' || process.env.ENABLE_HTTPS === 'true') {
//     res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
//     res.setHeader('X-Content-Type-Options', 'nosniff');
//     res.setHeader('X-Frame-Options', 'DENY');
//     res.setHeader('X-XSS-Protection', '1; mode=block');
//     res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
//   }
//   next();
// });


app.use('/auth', authRouter);
app.use('/secure', secureRouter);
app.use('/secure/inventory', inventoryRouter);

// Optional: Handle 3rd-party webhooks
app.post("/", async (req: Request, res: Response) => {
  res.status(200).send('OK');
  const data = req.body;
  if (!data.data.item.amount) { return }
  if (data.data.item.direction !== 'incoming') { return }
  const isIdempotencyKeyExists = await IdempotencyRepository.checkIfIdempotencyKeyExists(data.idempotencyKey)
  if (isIdempotencyKeyExists) { return }
  try {
    const user = await UserRepository.findByAddressHash(data.data.item.address);
    if (user) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const ltcPrice = await getLtcPrice();
      await new Promise(resolve => setTimeout(resolve, 1000))
      const amount = Number(data.data.item.amount) * ltcPrice;
      await UserRepository.increaseBalanceBy(user.telegram_id_hash.toString(), Number(amount));
      try {
        const userBot = new Bot<Context>(process.env.TG_USER_BOT_TOKEN!);
        await userBot.api.sendMessage(user.telegram_id_hash, `💰 Ваш баланс пополнен на ${amount.toFixed(2)}$`)
      } catch (error) { console.error("ERROR NOTIFYING USER OF HIS BALANCE INCREASE:\n", error); }
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // // ACTIVATE FOR PROD
      // const sweepResult = await sweepWallet(user.telegram_id_hash)
      // // ACTIVATE FOR PROD

      // ACTIVATE FOR DEV
      const sweepResult = {
        shop_share: 1111,
        tax_share: 8889,
        tx: "1234567890"
      }
      // ACTIVATE FOR DEV

      await IdempotencyRepository.addIdempotencyKey(data.idempotencyKey)
      console.log(`ADD TX DATA: user.id: ${user.id}`)
      console.log(`ADD TX DATA: user.telegram_id_hash: ${user.telegram_id_hash}`)
      console.log(`ADD TX DATA: data.data.item.address: ${data.data.item.address}`)
      console.log(`ADD TX DATA: Number(data.data.item.amount): ${Number(data.data.item.amount)}`)
      console.log(`ADD TX DATA: Number(amount): ${Number(amount)}`)
      console.log(`ADD TX DATA: data.data.item.tx: ${data.data.item.transactionId}`)
      await IncomingWalletTransactionRepository.createTransaction(user.id, user.telegram_id_hash, data.data.item.address, Number(data.data.item.amount), Number(amount), data.data.item.transactionId)
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

app.get('/api/statistics', async (req, res) => {
  const finStatistics = await IncomingWalletTransactionRepository.getFourHollyFinStatistics()
  const shopStatistics = await PurchaseRepository.getFourHollySalesStatistics()
  // console.log("🏦 finStatistics:", finStatistics)
  // console.log("🏦 shopStatistics:", shopStatistics)
  res.json({ finStatistics, shopStatistics })
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

app.get('/health', (req, res) => {
  res.send('OK');
});

// Temporary endpoint to create test dashboard user
app.post('/create-test-user', async (req, res) => {
  try {
    const { DashboardUserRepository } = await import('../db/repositories/DashboardUserRepository.js');
    
    // Check if user already exists
    const existingUser = await DashboardUserRepository.getUserByLogin('admin');
    if (existingUser) {
      res.json({ message: 'Test user already exists', user: { login: 'admin' } });
      return;
    }
    
    // Create test user
    const user = await DashboardUserRepository.createUser('admin', 'admin123');
    res.json({ message: 'Test user created successfully', user: { id: user.id, login: user.login } });
  } catch (error) {
    console.error('Error creating test user:', error);
    res.status(500).json({ error: 'Failed to create test user' });
  }
});


app.use((err: any, _req: any, res: any, next: any) => {
  console.error('🚨 Server error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
}); 

// Start server
const PORT = process.env.SERVER_PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3001;

// Initialize database and start server
async function startServer() {
  await initializeDatabase();
  
  // HTTP Server (for development or redirect to HTTPS)
  app.listen(PORT, () => {
    console.log(`🏦 LTC payment server running on port ${PORT}`);
    console.log(`ENV CHECK:`)
    console.log(`-- PORT: ${process.env.SERVER_PORT}`)
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
