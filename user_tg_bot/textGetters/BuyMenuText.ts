import { LinkRepository } from "../../db/repositories/LinkRepository.js";
import { LinkStatus } from "../../db/entities/link.entity.js";
import type { Link } from "../../db/entities/link.entity.js";
import { FormattedString } from "@grammyjs/parse-mode";

export interface BuyMenuData {
    text: string;
    entities: Array<{
        type: 'text_link';
        offset: number;
        length: number;
        url: string;
    }>;
    links: Link[];
}

export async function getBuyMenuText(status: LinkStatus = LinkStatus.ACTIVE) {
    const availableLinks = await LinkRepository.findAllLinksWithStatus(status);
    const buyMenuText = new FormattedString("Выберите категорию:")
    const uniqueCategories = new Set<string>();

    for (const link of availableLinks) {
        uniqueCategories.add(link.category.name);
    }

    // for (const category of uniqueCategories) {
    //     buyMenuText.
    // }

    return buyMenuText.toString()
}