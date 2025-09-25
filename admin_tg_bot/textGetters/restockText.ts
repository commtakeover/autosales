import { type MyContext } from "../Context.ts";
import { LinkCategoryRepository } from "../../db/repositories/LinkCategoryRepository.ts";
import { LinkPlaceRepository } from "../../db/repositories/LinkPlaceRepository.ts";
import { LinkSubplaceRepository } from "../../db/repositories/LinkSubplaceRepository.ts";
import { LinkRepository } from "../../db/repositories/LinkRepository.ts";
import { InventoryRestockRepository } from "../../db/repositories/InventoryRestockRepository.ts";

export async function restockText(ctx: MyContext) {
    const categories = await LinkCategoryRepository.findAllCategories();
    return `Пополнение товаров:\n-----------------------------\nСуществующие категории:\n${categories.map(category => `- ${category.name}`).join("\n")}`
}