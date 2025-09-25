import { AppDataSource } from "../data-source";
import { InventoryRestock } from "../entities/inventory-restock.entity";
import type { LinkStatus } from "../entities/link.entity";

export const InventoryRestockRepository = AppDataSource.getRepository(InventoryRestock).extend({
    async findById(id: number): Promise<InventoryRestock | null> {
        return await this.findOneBy({ id });
    },

    async findAllRestocks(): Promise<InventoryRestock[]> {
        return await this.find();
    },

    async createRestock(data: Partial<InventoryRestock>): Promise<InventoryRestock> {
        const restock = this.create(data);
        return await this.save(restock);
    },

    async updateRestock(id: number, data: Partial<InventoryRestock>): Promise<InventoryRestock> {
        const restock = await this.findOneBy({ id });
        if (!restock) {
            throw new Error("Inventory restock not found");
        }
        
        Object.assign(restock, data);
        return await this.save(restock);
    },

    async deleteRestock(id: number): Promise<void> {
        const result = await this.delete(id);
        if (result.affected === 0) {
            throw new Error("Inventory restock not found");
        }
    },

    async countRestocks(): Promise<number> {
        return await this.count();
    },

    async getAllRestocksWithLinks(): Promise<InventoryRestock[]> {
        return await this.find({ relations: { links: true } });
    },

    async getAllRestocksWithLinksByStatus(status: LinkStatus): Promise<InventoryRestock[]> {
        return await this.createQueryBuilder('restock')
            .leftJoinAndSelect('restock.links', 'links')
            .where('links.link_status = :status', { status })
            .getMany();
    },  

    async findOneByIdWithLinksByStatus(id: number, status: LinkStatus): Promise<InventoryRestock | null> {
        return await this.createQueryBuilder('restock')
            .leftJoinAndSelect('restock.links', 'links', 'links.link_status = :status', { status })
            .where('restock.id = :id', { id })
            .getOne();
    },
    
    async findLastXRestocks(x: number): Promise<InventoryRestock[]> {
        console.log('findLastXRestocks',1);
        return await this.createQueryBuilder('restock')
            .orderBy('restock.created_at', 'DESC')
            .limit(x)
            .getMany();
    }
}); 