import { AppDataSource } from "../data-source";
import { LinkPlace } from "../entities/link-place.entity";

export const LinkPlaceRepository = AppDataSource.getRepository(LinkPlace).extend({
    async findById(id: number): Promise<LinkPlace | null> {
        return await this.findOneBy({ id });
    },

    async findByName(name: string): Promise<LinkPlace | null> {
        return await this.findOneBy({ name });
    },

    async findAllPlaces(): Promise<LinkPlace[]> {
        return await this.find({
            relations: ['subplaces']
        });
    },

    async createPlace(data: Partial<LinkPlace>): Promise<LinkPlace> {
        const place = this.create(data);
        return await this.save(place);
    },

    async findAll(): Promise<LinkPlace[]> {
        return await this.find();
    },

    async updatePlace(id: number, name: string): Promise<LinkPlace> {
        const place = await this.findOneBy({ id });
        if (!place) {
            throw new Error("Place not found");
        }
        
        place.name = name;
        return await this.save(place);
    },

    async deletePlace(id: number): Promise<void> {
        const result = await this.delete({ id });
        if (result.affected === 0) {
            throw new Error("Place not found");
        }
    },

    async countPlaces(): Promise<number> {
        return await this.count();
    },

    async findOrCreate(name: string): Promise<LinkPlace> {
        let place = await this.findByName(name);
        if (!place) {
            place = await this.createPlace({ name });
        }
        return place;
    }
}); 