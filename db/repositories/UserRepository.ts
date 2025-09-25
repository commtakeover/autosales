import { hashString } from "../utils/hashing";
import { encrypt } from "../utils/encryption";
import { AppDataSource } from "../data-source";
import { User } from "../entities/user.entity";
import type { Purchase } from "../entities/purchase.entity";
import type { UserReview } from "../entities/user-review.entity";
import type { PurchaseReview } from "../entities/purchase-review.entity";

export const UserRepository = AppDataSource.getRepository(User).extend({
    
    async createAndSave(telegram_id_hash: string, address: string, address_index: number, reference_id: string, is_subscribed: boolean, is_synced: boolean): Promise<User> {
        const user = this.create({ telegram_id_hash, address_hash: address, address_index, reference_id, is_subscribed, is_synced});
        console.log("[createAndSave] created")
        return await this.save(user);
    },

    async findById(id: number): Promise<User | null> {
        return await this.findOne({
            where: { id },
            relations: ['roles', 'purchases', 'wallet_transactions', 'purchase_reviews', 'user_reviews', 'reviews_received']
        });
    },

    // CHECK HOW IT WORKS
    async updateUser(id: string, updateData: Partial<User>): Promise<User> {
        const user = await this.findOne({ where: { telegram_id_hash: id } });
        if (!user) { throw new Error("User not found") }
        Object.assign(user, updateData);
        return await this.save(user);
    },

    async deleteUser(id: number): Promise<void> {
        const result = await this.delete(id);
        if (result.affected === 0) {
            throw new Error("User not found");
        }
    },

    async findByTgId(tg_id: string): Promise<User | null> {
        return await this.findOne({
            where: { telegram_id_hash: tg_id },
            relations: ['roles', 'purchases', 'purchase_reviews', 'user_reviews', 'reviews_received']
        });
        // return await this.findOneBy({ tg_id });
    },

    async findUserWalletDataByTgId(telegram_id_hash: string): Promise<User | null> {
        // console.log("[findUserWalletDataByTgId] looking...")
        const user = await this.findOne({
            where: { telegram_id_hash },
            // relations: ['encrypted_wif', 'address_hash', 'is_subscribed', 'mnemonic', 'seed', 'public_key']
        });
        console.log("[findUserWalletDataByTgId] found:", user)
        return user;
    },
    
    async getUserReferenceId(address_hash: string): Promise<string | null> {
        const user = await this.findOne({
            where: { address_hash },
        });
        return user?.reference_id || null;
    },

    async getUserAddressIndex(address: string): Promise<number> {
        const user = await this.findOne({
            where: { address_hash: address },
        });
        if (!user) {
            throw new Error("User not found");
        }
        return user.address_index;
    },

    async getUserWalletDataByTgId(telegram_id_hash: string): Promise<{ public_key: string, address_hash: string, address_index: number, is_subscribed: boolean, is_synced: boolean }> {
        const user = await this.findOne({
            where: { telegram_id_hash },
        });
        if (!user) {
            throw new Error("User not found");
        }
        return {
            public_key: user.public_key,
            address_hash: user.address_hash,
            address_index: user.address_index,
            is_subscribed: user.is_subscribed,
            is_synced: user.is_synced,
        };
    },

    async findByTgHash(telegram_id_hash: string): Promise<User | null> {
        return await this.findOne({
            where: { telegram_id_hash },
            relations: ['roles', 'purchases', 'wallet_transactions', 'purchase_reviews', 'user_reviews', 'reviews_received']
        });
    },

    // async findByEncryptedWif(encrypted_wif: string): Promise<User | null> {
    //     return await this.findOne({
    //         where: { encrypted_wif },
    //         relations: ['roles', 'purchases', 'wallet_transactions', 'purchase_reviews', 'user_reviews', 'reviews_received']
    //     });
    // },

    async findByAddressHash(address_hash: string): Promise<User | null> {
        return await this.findOne({
            where: { address_hash },
            relations: ['roles', 'purchases', 'wallet_transactions', 'purchase_reviews', 'user_reviews', 'reviews_received']
        });
    },

    async getUserBalanceByTgHash(telegram_id_hash: string): Promise<number> {
        const user = await this.findOne({
            where: { telegram_id_hash },
            relations: ['roles', 'purchases', 'wallet_transactions', 'purchase_reviews', 'user_reviews', 'reviews_received']
        });
        if (!user) {
            throw new Error("User not found");
        }
        return user.balance_usd;
    },

    async getUserBalanceByAddressHash(address_hash: string): Promise<number> {
        const user = await this.findOne({
            where: { address_hash },
            relations: ['roles', 'purchases', 'wallet_transactions', 'purchase_reviews', 'user_reviews', 'reviews_received']
        });
        if (!user) {
            throw new Error("User not found");
        }
        return user.balance_usd;
    },

    // async getUserBalanceByEncryptedWif(encrypted_wif: string): Promise<number> {
    //     const user = await this.findOne({
    //         where: { encrypted_wif },
    //         relations: ['roles', 'purchases', 'wallet_transactions', 'purchase_reviews', 'user_reviews', 'reviews_received']
    //     });
    //     if (!user) {
    //         throw new Error("User not found");
    //     }
    //     return user.balance_usd;
    // },

    async getUserBalanceByTgId(tgId: string): Promise<number> {
        const user = await this.findOne({
            where: { telegram_id_hash: tgId },
            relations: ['roles', 'purchases', 'wallet_transactions', 'purchase_reviews', 'user_reviews', 'reviews_received']
        });
        if (!user) {
            throw new Error("User not found");
        }
        return user.balance_usd;
    },

    async increaseBalanceBy(tgId: string, amount: number) {
        const user = await this.findOneBy({ telegram_id_hash: tgId });
        if (!user) {
            throw new Error("User not found");
        }
        // console.log("[increaseBalanceBy] user.balance_usd", user.balance_usd, typeof user.balance_usd)
        const userBalance = Number(user.balance_usd);
        const amountToIncrease = Number(amount.toFixed(2));
        user.balance_usd = Number((userBalance + amountToIncrease).toFixed(2));
        return await this.save(user);
    },
    
    async decreaseBalanceBy(tgId: string, amount: number) {
        const user = await this.findOneBy({ telegram_id_hash: tgId });
        if (!user) {
            throw new Error("User not found");
        }
        if (user.balance_usd < amount) {
            throw new Error("Insufficient balance");
        }
        const userBalance = Number(user.balance_usd);
        const amountToDecrease = Number(amount.toFixed(2));
        user.balance_usd = Number((userBalance - amountToDecrease).toFixed(2));
        return await this.save(user);
    },

    async getUserDiscountByTgHash(telegram_id_hash: string): Promise<number> {
        const user = await this.findOne({
            where: { telegram_id_hash },
            relations: ['roles', 'purchases', 'wallet_transactions', 'purchase_reviews', 'user_reviews', 'reviews_received']
        });
        if (!user) {
            throw new Error("User not found");
        }
        return user.discount;
    },

    async findAll(fullData: boolean = false): Promise<User[]> {
        return await this.find({
            relations: fullData ? [
                'roles', 
                'purchases', 
                'purchases.link', 
                'wallet_transactions', 
                'purchase_reviews', 
                'user_reviews', 
                'reviews_received'
            ] : ['roles']
        });
    },

    // create a function that returnes all user's telegram ids
    async findAllUserTelegramIds(): Promise<string[]> {
        const users = await this.find();
        return users.map(user => user.telegram_id_hash);
    },

    async findAllUsers(): Promise<User[]> {
        return await this.find();
    },

    async countAll(): Promise<number> {
        return await this.count();
    },

    async getTotalBalance(): Promise<{ users: User[], totalBalance: number }> {
        const users = await this.findAll();
        return {
            users: users,
            totalBalance: users.reduce((acc, user) => {
                console.log("[getTotalBalance] user balance", user.balance_usd, typeof user.balance_usd)
                return acc + Number(user.balance_usd)
            }, 0),
        }
    },

    async findUsersWithRole(role: string): Promise<User[]> {
        return this.createQueryBuilder('user')
            .leftJoinAndSelect('user.roles', 'role')
            .leftJoinAndSelect('user.purchases', 'purchases')
            .leftJoinAndSelect('user.wallet_transactions', 'wallet_transactions')
            .leftJoinAndSelect('user.purchase_reviews', 'purchase_reviews')
            .leftJoinAndSelect('user.user_reviews', 'user_reviews')
            .leftJoinAndSelect('user.reviews_received', 'reviews_received')
            .where('role.name = :roleName', { roleName: role })
            .getMany();
    },

    async findAllUsersRolesByTgId(tg_id: string): Promise<string[]> {
        const user = await this.findOne({
            where: { telegram_id_hash: tg_id },
            relations: ['roles', 'purchases', 'wallet_transactions', 'purchase_reviews', 'user_reviews', 'reviews_received']
        });
        if (!user) {
            throw new Error("User not found");
        }
        return user.roles.map(role => role.name);
    },

    async findAllUserPurchases(telegram_id_hash: string): Promise<Purchase[] | null> {
        const user = await this.findOne({
            where: { telegram_id_hash },
            relations: ['purchases']
        });
        
        if (!user) {
            throw new Error("User not found");
        }
        
        return user.purchases;
    },
    
    async findAllUserPurchaseReviews(telegram_id_hash: string): Promise<PurchaseReview[] | null> {
        const user = await this.findOne({
            where: { telegram_id_hash },
            relations: ['purchase_reviews']
        });

        if (!user) {
            throw new Error("User not found");
        }

        return user.purchase_reviews;
    },

    async findAllUserUserReviews(telegram_id_hash: string): Promise<UserReview[] | null> {
        const user = await this.findOne({
            where: { telegram_id_hash },
            relations: ['user_reviews']
        });
        
        if (!user) {
            throw new Error("User not found");
        }

        return user.user_reviews;
    },

    async findAllUserReviewsReceived(telegram_id_hash: string): Promise<UserReview[] | null> {
        const user = await this.findOne({
            where: { telegram_id_hash },
            relations: ['reviews_received']
        }); 

        if (!user) {
            throw new Error("User not found");
        }

        return user.reviews_received;
    },
})

        