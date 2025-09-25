import { AppDataSource } from "../data-source";
import { LinkQuantity } from "../entities/link-quantity.entity";

export const LinkQuantityRepository = AppDataSource.getRepository(LinkQuantity).extend({
    async findById(id: number): Promise<LinkQuantity | null> {
        return await this.findOneBy({ id });
    },

    async findByQuantity(quantity: number): Promise<LinkQuantity | null> {
        return await this.findOneBy({ quantity });
    },

    async findAllQuantities(): Promise<LinkQuantity[]> {
        return await this.find();
    },

    async createQuantity(quantity: number): Promise<LinkQuantity> {
        const linkQuantity = this.create({ quantity });
        return await this.save(linkQuantity);
    },

    async findOrCreate(quantity: number): Promise<LinkQuantity> {
        let linkQuantity = await this.findByQuantity(quantity);
        if (!linkQuantity) {
            linkQuantity = await this.createQuantity(quantity);
        }
        return linkQuantity;
    }
});
