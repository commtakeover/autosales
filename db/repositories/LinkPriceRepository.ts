import { AppDataSource } from "../data-source";
import { LinkPrice } from "../entities/link-price.entity";

export const LinkPriceRepository = AppDataSource.getRepository(LinkPrice).extend({
    async findById(id: number): Promise<LinkPrice | null> {
        return await this.findOneBy({ id });
    },

    async findByPrice(price_usd: number): Promise<LinkPrice | null> {
        return await this.findOneBy({ price_usd });
    },

    async findAllPrices(): Promise<LinkPrice[]> {
        return await this.find();
    },

    async createPrice(price_usd: number): Promise<LinkPrice> {
        const linkPrice = this.create({ price_usd });
        return await this.save(linkPrice);
    },

    async findOrCreate(price_usd: number): Promise<LinkPrice> {
        let linkPrice = await this.findByPrice(price_usd);
        if (!linkPrice) {
            linkPrice = await this.createPrice(price_usd);
        }
        return linkPrice;
    }
});
