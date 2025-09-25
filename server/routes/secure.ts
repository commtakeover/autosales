import { Bot } from 'grammy';
import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../auth/requireAuth.js';
import { LinkRepository } from '../../db/repositories/LinkRepository.js';
import { UserRepository } from '../../db/repositories/UserRepository.js';
import { LinkCategoryRepository } from '../../db/repositories/LinkCategoryRepository.js';
import { LinkPlaceRepository } from '../../db/repositories/LinkPlaceRepository.js';
import { LinkSubplaceRepository } from '../../db/repositories/LinkSubplaceRepository.js';
import { InventoryRestockRepository } from '../../db/repositories/InventoryRestockRepository.js';
import { PurchaseRepository } from '../../db/repositories/PurchaseRepository.js';
import { LinkStatus } from '../../db/entities/link.entity.js';
import { MailingRepository } from '../../db/repositories/MailingRepository.js';
import { MailingStatus } from '../../db/entities/mailing.entity.js';

const router = Router();
const notificationBot = new Bot(process.env.TG_NOTIFICATION_BOT_TOKEN ?? '');
const userBot = new Bot(process.env.TG_USER_BOT_TOKEN ?? '');

router.get('/profile', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.status(200).json({ message: 'Authenticated', user });
  return;
});

// Note: Inventory management endpoints moved to dedicated inventory router

router.patch('/inventory/:id/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(LinkStatus).includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const updatedLink = await LinkRepository.updateLink(Number(id), { link_status: status });
    res.json(updatedLink);
  } catch (error) {
    console.error('Error updating link status:', error);
    res.status(500).json({ error: 'Failed to update link status' });
  }
});

// User management endpoints
router.get('/users', requireAuth, async (req: Request, res: Response) => {
  try {
    const users = await UserRepository.findAll(true);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/users/:id/balance', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, operation } = req.body; // operation: 'increase' | 'decrease'

    if (!amount || !operation || (operation !== 'increase' && operation !== 'decrease')) {
      res.status(400).json({ error: 'Invalid balance operation' });
      return;
    }

    const user = await UserRepository.findById(Number(id));
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (operation === 'increase') {
      await UserRepository.increaseBalanceBy(user.telegram_id_hash, Number(amount));
    } else {
      await UserRepository.decreaseBalanceBy(user.telegram_id_hash, Number(amount));
    }

    // Send notification to user
    try {
      const operationText = operation === 'increase' ? 'пополнен на' : 'уменьшен на';
      await userBot.api.sendMessage(user.telegram_id_hash, `💰 Ваш баланс ${operationText} ${amount}$`);
    } catch (notifyError) {
      console.error('Failed to notify user:', notifyError);
    }

    // Send admin notification
    try {
      const operationText = operation === 'increase' ? 'увеличил' : 'уменьшил';
      const notificationText = `👨‍💻 Админ ${operationText} баланс пользователя ${user.id} на ${amount} USD\n🔗 Адрес: ${user.address_hash}`;
      await notificationBot.api.sendMessage(process.env.TG_NOTIFICATION_CHANNEL_ID!, notificationText);
    } catch (notifyError) {
      console.error('Failed to send admin notification:', notifyError);
    }

    const updatedUser = await UserRepository.findById(Number(id));
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user balance:', error);
    res.status(500).json({ error: 'Failed to update user balance' });
  }
});

// Statistics endpoints
router.get('/statistics/sales', requireAuth, async (req: Request, res: Response) => {
  try {
    const salesStats = await PurchaseRepository.getDailySalesStatistics();
    res.json(salesStats);
  } catch (error) {
    console.error('Error fetching sales statistics:', error);
    res.status(500).json({ error: 'Failed to fetch sales statistics' });
  }
});

// Financial summary endpoints
router.get('/statistics/ltc-received', requireAuth, async (req: Request, res: Response) => {
  try {
    // In a real implementation, this would aggregate from IncomingWalletTransaction
    // For now, return mock data that would come from the database
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Mock calculation - in reality, you'd query IncomingWalletTransaction
    const ltcSummary = {
      today: 1250.75,    // Today's LTC received in USD
      week: 8420.30,     // This week's LTC received in USD
      month: 28750.90,   // This month's LTC received in USD
      allTime: 156890.45 // All time LTC received in USD
    };

    res.json(ltcSummary);
  } catch (error) {
    console.error('Error fetching LTC statistics:', error);
    res.status(500).json({ error: 'Failed to fetch LTC statistics' });
  }
});

router.get('/statistics/sales-amounts', requireAuth, async (req: Request, res: Response) => {
  try {
    // In a real implementation, this would aggregate from Purchase table
    // For now, return mock data that would come from the database
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Mock calculation - in reality, you'd query Purchase table
    const salesSummary = {
      today: 2100.50,    // Today's sales in USD
      week: 14630.25,    // This week's sales in USD
      month: 52840.80,   // This month's sales in USD
      allTime: 234560.15 // All time sales in USD
    };

    res.json(salesSummary);
  } catch (error) {
    console.error('Error fetching sales amount statistics:', error);
    res.status(500).json({ error: 'Failed to fetch sales amount statistics' });
  }
});

// Mailing endpoints
router.post('/mailing/broadcast', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      res.status(400).json({ error: 'Message cannot be empty' });
      return;
    }

    if (message.length > 4096) {
      res.status(400).json({ error: 'Message too long (max 4096 characters)' });
      return;
    }

    // Get all user telegram IDs
    const userIds = await UserRepository.findAllUserTelegramIds();
    
    // Create mailing record in database
    const mailing = await MailingRepository.createMailing(message, userIds.length);
    
    let successCount = 0;
    let failureCount = 0;

    // Send to all users
    for (const userId of userIds) {
      try {
        await userBot.api.sendMessage(userId, message);
        successCount++;
        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.error(`Failed to send message to user ${userId}:`, error);
        failureCount++;
      }
    }

    // Update mailing status in database
    const finalStatus = failureCount === 0 ? MailingStatus.SENT : 
                       successCount === 0 ? MailingStatus.FAILED : MailingStatus.SENT;
    
    await MailingRepository.updateMailingStatus(mailing.id, successCount, failureCount, finalStatus);

    // Send completion notification
    try {
      const notificationText = `📮 Рассылка завершена:\n✅ Успешно: ${successCount}\n❌ Ошибок: ${failureCount}\n📝 Текст: ${message}`;
      await notificationBot.api.sendMessage(process.env.TG_NOTIFICATION_CHANNEL_ID!, notificationText);
    } catch (notifyError) {
      console.error('Failed to send completion notification:', notifyError);
    }

    res.json({ 
      success: true, 
      sent: successCount, 
      failed: failureCount,
      total: userIds.length 
    });
  } catch (error) {
    console.error('Error sending broadcast:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

router.get('/mailing/history', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const mailings = await MailingRepository.getAllMailings(50);
    
    // Transform to match frontend interface
    const transformedMailings = mailings.map(mailing => ({
      id: mailing.id,
      text: mailing.message,
      sentAt: mailing.created_at,
      status: mailing.status
    }));

    res.json(transformedMailings);
  } catch (error) {
    console.error('Error fetching mailing history:', error);
    res.status(500).json({ error: 'Failed to fetch mailing history' });
  }
});

export default router;
