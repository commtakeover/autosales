import { AppDataSource } from "../data-source";  // Your TypeORM DataSource
import { CryptoApisDerivedWalletData } from "../entities/cryptoApisDerivedWalletData.entity";

export const CryptoApisDerivedWalletDataRepository = AppDataSource.getRepository(CryptoApisDerivedWalletData).extend({
    async iterateIndex(): Promise<number> {
        // console.log("[iterateIndex] starting", await this.find())
        let indexRow = await this.findOneBy({ id: 1 });
        // console.log("[iterateIndex] indexRow:", indexRow)
        if (!indexRow) {
            console.log("[iterateIndex] indexRow not found, creating new one")
            indexRow = this.create({
                lastUsedId: 1,  // Default starting index
            });
            // console.log("[iterateIndex] indexRow created:", indexRow)
            await this.save(indexRow);
            // console.log("[iterateIndex] indexRow saved:", indexRow)
            return 0;
        }

        const currentIndex = indexRow.lastUsedId;
        indexRow.lastUsedId++;
        // console.log("[iterateIndex] indexRow:", indexRow)
        await this.save(indexRow);
        return currentIndex;
    },

    async getIndex(): Promise<number> {
        let indexRow = await this.findOneBy({ id: 1 });
        return indexRow?.lastUsedId ?? 0;
    },
    async decrementIndex(): Promise<number> {
        let indexRow = await this.findOneBy({ id: 1 });
        if (!indexRow) {
            console.log("[decrementIndex] indexRow not found, creating new one")
            indexRow = this.create({
                lastUsedId: 0,  // Default starting index
            });
        }
        return indexRow!.lastUsedId;
    }
});
