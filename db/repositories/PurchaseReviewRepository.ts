import { AppDataSource } from "../data-source";
import { PurchaseReview } from "../entities/purchase-review.entity";
import { Purchase } from "../entities/purchase.entity";
import { User } from "../entities/user.entity";

export const PurchaseReviewRepository = AppDataSource.getRepository(PurchaseReview).extend({
    async findById(id: number): Promise<PurchaseReview | null> {
        return await this.findOneBy({ id });
    },

    async findAllReviews(): Promise<PurchaseReview[]> {
        return await this.find();
    },

    async findByReviewer(reviewerTgId: string): Promise<PurchaseReview[]> {
        return await this.find({
            where: { reviewer: { telegram_id_hash: reviewerTgId } },
            relations: ['reviewer']
        });
    },

    async findAllPurchasesByTgId(reviewerTgId: string): Promise<PurchaseReview[]> {
        return await this.find({
            where: { reviewer: { telegram_id_hash: reviewerTgId } },
            relations: ['purchase', 'purchase.link', 'purchase.user']
        });
    },

    async createReview(reviewer: User, purchase: Purchase, data: Partial<PurchaseReview>): Promise<PurchaseReview> {
        const review = this.create({
            reviewer,
            purchase,
            ...data
        });
        return await this.save(review);
    },

    async updateReview(id: number, data: Partial<PurchaseReview>): Promise<PurchaseReview> {
        const review = await this.findOneBy({ id });
        if (!review) {
            throw new Error("Review not found");
        }
        
        Object.assign(review, data);
        return await this.save(review);
    },

    async deleteReview(id: number): Promise<void> {
        const result = await this.delete(id);
        if (result.affected === 0) {
            throw new Error("Review not found");
        }
    }
}); 