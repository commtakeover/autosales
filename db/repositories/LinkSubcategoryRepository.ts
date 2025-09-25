import { AppDataSource } from "../data-source";
import { LinkSubcategory } from "../entities/link-subcategory.entity";

export const LinkSubcategoryRepository = AppDataSource.getRepository(LinkSubcategory).extend({
    async findById(id: number): Promise<LinkSubcategory | null> {
        return await this.findOneBy({ id });
    },

    async findByName(name: string): Promise<LinkSubcategory | null> {
        return await this.findOneBy({ name });
    },

    async findAllSubcategories(): Promise<LinkSubcategory[]> {
        return await this.find({
            relations: ['category']
        });
    },

    async findByCategoryId(categoryId: number): Promise<LinkSubcategory[]> {
        return await this.find({
            where: { category: { id: categoryId } },
            relations: ['category']
        });
    },

    async createSubcategory(data: Partial<LinkSubcategory>): Promise<LinkSubcategory> {
        const subcategory = this.create(data);
        return await this.save(subcategory);
    },

    async findAll(): Promise<LinkSubcategory[]> {
        return await this.find();
    },

    async updateSubcategory(id: number, name: string): Promise<LinkSubcategory> {
        const subcategory = await this.findOneBy({ id });
        if (!subcategory) {
            throw new Error("Subcategory not found");
        }
        
        subcategory.name = name;
        return await this.save(subcategory);
    },

    async deleteSubcategory(id: number): Promise<void> {
        const result = await this.delete({ id });
        if (result.affected === 0) {
            throw new Error("Subcategory not found");
        }
    },

    async countSubcategories(): Promise<number> {
        return await this.count();
    },

    async findOrCreate(name: string, categoryId: number): Promise<LinkSubcategory> {
        let subcategory = await this.findByName(name);
        if (!subcategory) {
            const category = await this.manager.getRepository('LinkCategory').findOneBy({ id: categoryId });
            if (!category) {
                throw new Error('Category not found');
            }
            subcategory = await this.createSubcategory({ name, category: category as any });
        }
        return subcategory;
    }
});
