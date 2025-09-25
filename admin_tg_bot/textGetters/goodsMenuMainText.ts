import { LinkStatus } from "../../db/entities/link.entity";
import { InventoryRestockRepository } from "../../db/repositories/InventoryRestockRepository";
import { LinkCategoryRepository } from "../../db/repositories/LinkCategoryRepository";
import { LinkPlaceRepository } from "../../db/repositories/LinkPlaceRepository";
import { LinkRepository } from "../../db/repositories/LinkRepository";
import { LinkSubplaceRepository } from "../../db/repositories/LinkSubplaceRepository";

export async function goodsMenuMainText() {
    // const totalLinks = await LinkRepository.countLinks();
    const totalActiveLinks = await LinkRepository.countLinksByStatus(LinkStatus.ACTIVE);
    const totalStashLinks = await LinkRepository.countLinksByStatus(LinkStatus.STASHED);
    const totalSoldLinks = await LinkRepository.countLinksByStatus(LinkStatus.SOLD);

    return `🍬 Активных позиций: ${totalActiveLinks}\n✅ Проданных позиций: ${totalSoldLinks}\n\nВсего: ${totalActiveLinks + totalSoldLinks}`;
}