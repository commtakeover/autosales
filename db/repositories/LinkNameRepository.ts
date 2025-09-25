import { AppDataSource } from "../data-source";
import { LinkName } from "../entities/link-name.entity";

export const LinkNameRepository = AppDataSource.getRepository(LinkName).extend({
    async findById(id: number): Promise<LinkName | null> {
        return await this.findOneBy({ id });
    },

    async findByName(name: string): Promise<LinkName | null> {
        return await this.findOneBy({ name });
    },

    async findAllNames(): Promise<LinkName[]> {
        return await this.find();
    },

    async createName(name: string): Promise<LinkName> {
        const linkName = this.create({ name });
        return await this.save(linkName);
    },

    async findOrCreate(name: string): Promise<LinkName> {
        let linkName = await this.findByName(name);
        if (!linkName) {
            linkName = await this.createName(name);
        }
        return linkName;
    }
});
