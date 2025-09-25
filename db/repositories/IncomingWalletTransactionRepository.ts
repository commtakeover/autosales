import { AppDataSource } from "../data-source";
import { IncomingWalletTransaction } from "../entities/incoming-wallet-transaction.entity";
import { UserRepository } from "./UserRepository";

export const IncomingWalletTransactionRepository = AppDataSource.getRepository(IncomingWalletTransaction).extend({
    async findById(id: number): Promise<IncomingWalletTransaction | null> {
        return await this.findOneBy({ id });
    },

    async findAllTransactions(): Promise<IncomingWalletTransaction[]> {
        return await this.find();
    },

    async findByUserId(userId: number): Promise<IncomingWalletTransaction[]> {
        return await this.find({ where: { user: { id: userId } } });
    },

    async getFourHollyFinStatistics(): Promise<{ today: number, this_week: number, this_month: number, all_time: number }> {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const today = await this.createQueryBuilder('transaction')
            .select('SUM(transaction.usd_amount)', 'sum')
            .where('transaction.created_at >= :today', { today: todayStart })
            .andWhere('transaction.usd_amount > 0')
            .getRawOne();

        const thisWeek = await this.createQueryBuilder('transaction')
            .select('SUM(transaction.usd_amount)', 'sum')
            .where('transaction.created_at >= :thisWeek', { thisWeek: weekStart })
            .andWhere('transaction.usd_amount > 0')
            .getRawOne();

        const thisMonth = await this.createQueryBuilder('transaction')
            .select('SUM(transaction.usd_amount)', 'sum')
            .where('transaction.created_at >= :thisMonth', { thisMonth: monthStart })
            .andWhere('transaction.usd_amount > 0')
            .getRawOne();

        const allTime = await this.createQueryBuilder('transaction')
            .select('SUM(transaction.usd_amount)', 'sum')
            .where('transaction.usd_amount > 0')
            .getRawOne();

        return { 
            today: parseFloat(today.sum) || 0, 
            this_week: parseFloat(thisWeek.sum) || 0, 
            this_month: parseFloat(thisMonth.sum) || 0, 
            all_time: parseFloat(allTime.sum) || 0 
        };
    },
    
    // make sure all fields are filled
    async createTransaction(userId: number, telegramId: string, address: string, ltcAmount: number, usdAmount: number, transactionHash: string) {
        console.log(`createTransaction: userId: ${userId}`)
        console.log(`createTransaction: telegramId: ${telegramId}`)
        console.log(`createTransaction: address: ${address}`)
        console.log(`createTransaction: ltcAmount: ${ltcAmount}`)
        console.log(`createTransaction: usdAmount: ${usdAmount}`)
        console.log(`createTransaction: transactionHash: ${transactionHash}`)
        const user = await UserRepository.findOneBy({ id: userId });
        if (!user) {
            throw new Error("User not found");
        }
        const transaction = this.create({
            user,
            telegram_id: telegramId,
            address: address,
            ltc_amount: ltcAmount,
            usd_amount: usdAmount,
            transaction_hash: transactionHash
        });
        return await this.save(transaction);
    },

    async updateTransaction(id: number, data: Partial<IncomingWalletTransaction>): Promise<IncomingWalletTransaction> {
        const transaction = await this.findOneBy({ id });
        if (!transaction) {
            throw new Error("Transaction not found");
        }
        
        Object.assign(transaction, data);
        return await this.save(transaction);
    },

    async deleteTransaction(id: number): Promise<void> {
        const result = await this.delete(id);
        if (result.affected === 0) {
            throw new Error("Transaction not found");
        }
    }
}); 