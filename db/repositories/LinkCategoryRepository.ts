import { AppDataSource } from "../data-source";
import { LinkCategory } from "../entities/link-category.entity";

export const LinkCategoryRepository = AppDataSource.getRepository(LinkCategory).extend({
    async findById(id: number): Promise<LinkCategory | null> {
        return await this.findOneBy({ id });
    },

    async findByName(name: string): Promise<LinkCategory | null> {
        return await this.findOneBy({ name });
    },

    async findAllCategories(): Promise<LinkCategory[]> {
        // return await this.findAll();
        return await this.find();
    },

    async createCategory(data: Partial<LinkCategory>): Promise<LinkCategory> {
        console.log("createCategory: data:", data)
        const category = this.create(data);
        return await this.save(category);
    },

    async findAll(): Promise<LinkCategory[]> {
        return await this.find();
    },

    async updateCategory(id: number, name: string): Promise<LinkCategory> {
        const category = await this.findOneBy({ id });
        if (!category) {
            throw new Error("Category not found");
        }
        
        category.name = name;
        return await this.save(category);
    },

    async deleteCategory(id: number): Promise<void> {
        const result = await this.delete(id);
        if (result.affected === 0) {
            throw new Error("Category not found");
        }
    },

    async countCategories(): Promise<number> {
        return await this.count();
    },

    async findOrCreate(name: string): Promise<LinkCategory> {
        let category = await this.findByName(name);
        if (!category) {
            category = await this.createCategory({ name });
        }
        return category;
    }
}); 