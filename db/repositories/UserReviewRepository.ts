import { AppDataSource } from "../data-source";
import { UserReview } from "../entities/user-review.entity";
import { User } from "../entities/user.entity";

export const UserReviewRepository = AppDataSource.getRepository(UserReview).extend({
    async createReview(reviewer: User, targetUser: User, rating: number, comment: string): Promise<UserReview> {
        const review = this.create({
            reviewer,
            target_user: targetUser,
            rating,
            comment
        });
        return await this.save(review);
    },
    
    async updateReview(id: number, data: Partial<UserReview>): Promise<UserReview> {
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
    },

    async findById(id: number): Promise<UserReview | null> {
        return await this.findOneBy({ id });
    },

    async findAllReviews(): Promise<UserReview[]> {
        return await this.find();
    },

    async findByReviewer(reviewerId: number): Promise<UserReview[]> {
        return await this.find({
            where: { reviewer: { id: reviewerId } },
            relations: ['reviewer', 'reviewer.roles', 'reviewer.purchases', 'reviewer.wallet_transactions', 'reviewer.purchase_reviews', 'reviewer.user_reviews', 'reviewer.reviews_received', 'target_user', 'target_user.roles', 'target_user.purchases', 'target_user.wallet_transactions', 'target_user.purchase_reviews', 'target_user.user_reviews', 'target_user.reviews_received']
        });
    },

    async findByTargetAndRating(targetUserId: number, rating: number): Promise<UserReview[]> {
        return await this.find({
            where: { target_user: { id: targetUserId }, rating },
            relations: ['reviewer', 'reviewer.roles', 'reviewer.purchases', 'reviewer.wallet_transactions', 'reviewer.purchase_reviews', 'reviewer.user_reviews', 'reviewer.reviews_received', 'target_user', 'target_user.roles', 'target_user.purchases', 'target_user.wallet_transactions', 'target_user.purchase_reviews', 'target_user.user_reviews', 'target_user.reviews_received']
        });
    }
});