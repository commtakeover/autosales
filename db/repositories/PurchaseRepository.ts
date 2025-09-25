import { AppDataSource } from "../data-source";
// import { Purchase, PurchaseStatus } from "../entities/purchase.entity";
import { Purchase } from "../entities/purchase.entity";
import { User } from "../entities/user.entity";

export const PurchaseRepository = AppDataSource.getRepository(Purchase).extend({
    async findById(id: number): Promise<Purchase | null> {
        // also return link
        return await this.findOne({ where: { id }, relations: ['link'] });
    },

    async findAllPurchases(): Promise<Purchase[]> {
        return await this.find();
    },

    async findAllPurchasesWithRelations(user: boolean = false, link: boolean = false, purchase_review: boolean = false): Promise<Purchase[]> {
        const relations = [];
        if (user) relations.push('user');
        if (link) relations.push('link');
        if (purchase_review) relations.push('purchase_review');
        return await this.find({
            relations: relations
        });
    },

    async getFourHollySalesStatistics(): Promise<{ today: number, this_week: number, this_month: number, all_time: number }> {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const today = await this.createQueryBuilder('purchase')
            .select('COUNT(purchase.id)', 'count')
            .where('purchase.created_at >= :today', { today: todayStart })
            .getRawOne();

        const thisWeek = await this.createQueryBuilder('purchase')
            .select('COUNT(purchase.id)', 'count')
            .where('purchase.created_at >= :thisWeek', { thisWeek: weekStart })
            .getRawOne();

        const thisMonth = await this.createQueryBuilder('purchase')
            .select('COUNT(purchase.id)', 'count')
            .where('purchase.created_at >= :thisMonth', { thisMonth: monthStart })
            .getRawOne();

        const allTime = await this.createQueryBuilder('purchase')
            .select('COUNT(purchase.id)', 'count')
            .getRawOne();

        return { today: parseInt(today.count) || 0, this_week: parseInt(thisWeek.count) || 0, this_month: parseInt(thisMonth.count) || 0, all_time: parseInt(allTime.count) || 0 }
    },

    async findAllPurchasesWithLinks(userTgId: string): Promise<Purchase[]> {
        return await this.find({
            where: { user: { telegram_id_hash: userTgId } },
            relations: ['link']
        });
    },

    async findByUser(userId: number): Promise<Purchase[]> {
        return await this.find({
            where: { user: { id: userId } },
            relations: ['user', 'user.purchases', 'user.wallet_transactions', 'user.purchase_reviews', 'user.user_reviews', 'user.reviews_received', 'link']
        });
    },

    async findAllPurchasesWithLinksByUserTgId(userTgId: string): Promise<Purchase[]> {
        return await this.find({
            where: { user: { telegram_id_hash: userTgId } },
            relations: ['link']
        });
    },

    async findWithReview(id: number): Promise<Purchase | null> {
        return await this.findOne({
            where: { id },
            relations: ['purchase_review']
        });
    },

    async createPurchase(user: User, data: Partial<Purchase>): Promise<Purchase> {
        const purchase = this.create({
            user,
            ...data
        });
        return await this.save(purchase);
    },

    async updatePurchase(id: number, data: Partial<Purchase>): Promise<Purchase> {
        const purchase = await this.findOne({ where: { id }, relations: ['purchase_review'] });
        if (!purchase) throw new Error("Purchase not found");
        return await this.save({ ...purchase, ...data });
    },

    async deletePurchase(id: number): Promise<void> {
        const result = await this.delete(id);
        if (result.affected === 0) {
            throw new Error("Purchase not found");
        }
    },

    async getDailySalesStatistics(): Promise<any[]> {
        return await this.createQueryBuilder('purchase')
            .select([
                'DATE(purchase.created_at) AS day',
                'COUNT(*) AS count',
                'SUM(purchase.purchase_price) AS sum'
            ])
            .groupBy('DATE(purchase.created_at)')
            .orderBy('day', 'DESC')
            .limit(30)
            .getRawMany();
    }
}); 