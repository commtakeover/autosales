import { AppDataSource } from "../data-source";
import { IdempotencyKeys } from "../entities/idempotencyKeys.entity";

export const IdempotencyRepository = AppDataSource.getRepository(IdempotencyKeys).extend({
    async addIdempotencyKey(idempotencyKey: string): Promise<IdempotencyKeys> {
        console.log("[addIdempotencyKey] idempotencyKey:", idempotencyKey)
        try {
            const idempotency = this.create({ 
                idempotencyKey, 
                createdAt: new Date() 
            });
            return await this.save(idempotency);
        } catch (error) {
            console.error("Error adding idempotency key:", error);
            throw new Error("Error adding idempotency key");
        }
    },

    /**
     * Checks if an idempotency key already exists in the database
     * @param idempotencyKey - The idempotency key to check
     * @returns Promise<boolean> - True if key exists, false otherwise
     */
    async checkIfIdempotencyKeyExists(idempotencyKey: string): Promise<boolean> {
        try {
            const idempotency = await this.findOne({ where: { idempotencyKey } });
            console.log("[checkIfIdempotencyKeyExists] idempotency:", idempotency)
            if (idempotency && idempotency.idempotencyKey === idempotencyKey) {
                // console.log("[checkIfIdempotencyKeyExists] Found existing idempotency key:", idempotencyKey);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error checking if idempotency key exists:", error);
            return false;
        }
    }
});

