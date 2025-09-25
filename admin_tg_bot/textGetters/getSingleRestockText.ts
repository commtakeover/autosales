import { InventoryRestockRepository } from "../../db/repositories/InventoryRestockRepository.ts";
import { LinkStatus } from "../../db/entities/link.entity";

export async function getSingleRestockText(restockId: number, status: LinkStatus) {
    const restock = await InventoryRestockRepository.findOneByIdWithLinksByStatus(restockId, status)
    return `ID: ${restock?.id}\nLinks amount: ${restock?.links.length}`
}