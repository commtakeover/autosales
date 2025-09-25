import { AppDataSource } from "../data-source";
import { Link, LinkStatus } from "../entities/link.entity";

export const LinkRepository = AppDataSource.getRepository(Link).extend({
    async findById(id: number): Promise<Link | null> {
        return await this.findOne({
            where: { id },
            relations: ['category', 'place', 'subplace', 'inventory_restock']
        });
    },

    async createLink(data: Partial<Link>): Promise<Link> {
        const link = this.create(data);
        return await this.save(link);
    },

    async updateLink(id: number, data: Partial<Link>): Promise<Link> {
        // First check if entity exists
        const existingLink = await this.findOne({
            where: { id },
            relations: ['category', 'place', 'subplace', 'inventory_restock', 'purchase']
        });
        if (!existingLink) {
            throw new Error("Link not found");
        }

        // Create update query
        await this.update(id, data);
        
        // Fetch and return updated entity
        const updatedLink = await this.findOne({
            where: { id },
            relations: ['category', 'place', 'subplace', 'inventory_restock', 'purchase'] 
        });
        if (!updatedLink) {
            throw new Error("Failed to fetch updated link");
        }
        
        return updatedLink;
    },

    async deleteLink(id: number): Promise<void> {
        const result = await this.delete(id);
        if (result.affected === 0) {
            throw new Error("Link not found");
        }
    },

    async findAllLinksWithStatusByRestockId(restockId: number): Promise<Link[]> {
        return await this.find({
            where: { inventory_restock: { id: restockId } },
            relations: ['category', 'place', 'subplace', 'inventory_restock']
        });
    },

    async findAllLinksWithStatus(status: LinkStatus): Promise<Link[]> {
        try {
            return await this.find({
                where: { link_status: status },
                relations: ['category', 'place', 'subplace', 'inventory_restock']
            });
        } catch (error) {
            console.error("Error in findAllLinksWithStatus:", error);
            return [];
        }
    },

    async findAllLinks(): Promise<Link[]> {
        return await this.find({
            relations: ['category', 'place', 'subplace', 'inventory_restock']
        });
    },

    async findByCategoryId(categoryId: number): Promise<Link[]> {
        return await this.find({
            where: { category: { id: categoryId } },
            relations: ['category', 'place', 'subplace', 'inventory_restock']
        });
    },

    async findWithPurchase(id: number): Promise<Link | null> {
        return await this.findOne({
            where: { id },
            relations: ['purchase', 'category', 'place', 'subplace', 'inventory_restock']
        });
    },

    async countLinks(): Promise<number> {
        return await this.count();
    },
    
    async countLinksByStatus(status: LinkStatus): Promise<number> {
        return await this.count({ where: { link_status: status } });
    },

    async getAllUserPurchasedLinks(userId: number): Promise<Link[]> {
        return await this.find({
            where: { purchase: { user: { id: userId } } },
            relations: ['category', 'place', 'subplace', 'inventory_restock', 'purchase']
        });
    },

    // this function must take category, place, subplace from session and return all links with this category, place, subplace
    // arguments must be configurable
    // category must be provided
    // place can be ommited
    // subplace can be ommited
    async findAllActiveLinksByCategoryPlaceSubplace(category: string, place?: string, subplace?: string): Promise<Link[]> {
        const query = this.createQueryBuilder('link')
            .leftJoinAndSelect('link.category', 'category')
            .leftJoinAndSelect('link.place', 'place')
            .leftJoinAndSelect('link.subplace', 'subplace')
            .leftJoinAndSelect('link.inventory_restock', 'inventory_restock')
            .leftJoinAndSelect('link.purchase', 'purchase')
            .where('category.name = :category', { category })
            .andWhere('link.link_status = :status', { status: LinkStatus.ACTIVE });

        if (place) {
            query.andWhere('place.name = :place', { place });
        }
        if (subplace) {
            query.andWhere('subplace.name = :subplace', { subplace });
        }
        return await query.getMany();
    },

    async isLinkActive(linkId: number): Promise<{isActive: boolean, link: Link | null}> {  
        const link = await this.findOne({
            where: { id: linkId, link_status: LinkStatus.ACTIVE }
        });
        return {
            isActive: link !== null,
            link: link
        }
    },

    async findLinkWithStatusWithStats(status: LinkStatus, stats: {
        category: string,
        place: string,
        subplace: string,
        name: string,
        quantity: number,
        unit_of_measure: string,
        price_usd: number,
    }): Promise<Link | null> {
        const link = await this.createQueryBuilder('link')
            .leftJoinAndSelect('link.category', 'category')
            .leftJoinAndSelect('link.place', 'place') 
            .leftJoinAndSelect('link.subplace', 'subplace')
            .leftJoinAndSelect('link.inventory_restock', 'inventory_restock')
            .where('link.quantity = :quantity', { quantity: stats.quantity })
            .andWhere('link.unit_of_measure = :unit_of_measure', { unit_of_measure: stats.unit_of_measure })
            .andWhere('link.price_usd = :price_usd', { price_usd: stats.price_usd })    
            .where('link.name = :name', { name: stats.name })
            .andWhere('link.link_status = :status', { status })
            .andWhere('category.name = :category', { category: stats.category })
            .andWhere('place.name = :place', { place: stats.place })
            .andWhere('subplace.name = :subplace', { subplace: stats.subplace })
            .getOne();
        return link;
    },

    async findOneLinkWithStatusByRestockId(restockId: number): Promise<Link | null> {
        return await this.findOne({ 
            where: { inventory_restock: { id: restockId } },
            relations: ['category', 'place', 'subplace', 'inventory_restock']
        });
    },

}); 