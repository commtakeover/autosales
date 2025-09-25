import { AppDataSource } from "../data-source";
import { LinkSubplace } from "../entities/link-subplace.entity";
import { LinkPlace } from "../entities/link-place.entity";

export const LinkSubplaceRepository = AppDataSource.getRepository(LinkSubplace).extend({
    async findById(id: number): Promise<LinkSubplace | null> {
        return await this.findOneBy({ id });
    },

    async findByName(name: string): Promise<LinkSubplace | null> {
        return await this.findOneBy({ name });
    },

    async findAllSubplaces(): Promise<LinkSubplace[]> {
        return await this.find({
            relations: ['place']
        });
    },

    async findByPlaceId(placeId: number): Promise<LinkSubplace[]> {
        return await this.find({
            where: { place: { id: placeId } },
            relations: ['place']
        });
    },

    async createSubplace(data: Partial<LinkSubplace>): Promise<LinkSubplace> {
        const subplace = this.create(data);
        return await this.save(subplace);
    },

    async findAll(): Promise<LinkSubplace[]> {
        return await this.find();
    },

    async updateSubplace(id: number, name: string, place?: LinkPlace): Promise<LinkSubplace> {
        const subplace = await this.findOneBy({ id });
        if (!subplace) {
            throw new Error("Subplace not found");
        }
        
        subplace.name = name;
        if (place) {
            subplace.place = place;
        }
        return await this.save(subplace);
    },

    async deleteSubplace(id: number): Promise<void> {
        const result = await this.delete({ id });
        if (result.affected === 0) {
            throw new Error("Subplace not found");
        }
    },

    async countSubplaces(): Promise<number> {
        return await this.count();
    },

    async findOrCreate(name: string, placeId: number): Promise<LinkSubplace> {
        let subplace = await this.findByName(name);
        if (!subplace) {
            const place = await this.manager.findOneBy('LinkPlace', { id: placeId });
            if (!place) {
                throw new Error('Place not found');
            }
            subplace = await this.createSubplace({ name, place: place as any });
        }
        return subplace;
    }
});
