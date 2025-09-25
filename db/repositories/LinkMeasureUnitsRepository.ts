import { AppDataSource } from "../data-source";
import { LinkMeasureUnits } from "../entities/link-measure-units.entity";

export const LinkMeasureUnitsRepository = AppDataSource.getRepository(LinkMeasureUnits).extend({
    async findById(id: number): Promise<LinkMeasureUnits | null> {
        return await this.findOneBy({ id });
    },

    async findByUnit(unit_of_measure: string): Promise<LinkMeasureUnits | null> {
        return await this.findOneBy({ unit_of_measure });
    },

    async findAllUnits(): Promise<LinkMeasureUnits[]> {
        return await this.find();
    },

    async createUnit(unit_of_measure: string): Promise<LinkMeasureUnits> {
        const linkMeasureUnits = this.create({ unit_of_measure });
        return await this.save(linkMeasureUnits);
    },

    async findOrCreate(unit_of_measure: string): Promise<LinkMeasureUnits> {
        let linkMeasureUnits = await this.findByUnit(unit_of_measure);
        if (!linkMeasureUnits) {
            linkMeasureUnits = await this.createUnit(unit_of_measure);
        }
        return linkMeasureUnits;
    }
});
