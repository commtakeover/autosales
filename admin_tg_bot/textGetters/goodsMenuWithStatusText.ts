import { FormattedString, link } from "@grammyjs/parse-mode";
import { Link, LinkStatus } from "../../db/entities/link.entity.ts";
import { LinkRepository } from "../../db/repositories/LinkRepository.ts";

// ${newCategoryObject.category == "" ? "1️⃣ Категория ⚠️" : `1️⃣ ✅ Категория: ${newCategoryObject.category}`}
// ${newCategoryObject.place == "" ? "2️⃣ Город ⚠️" : `2️⃣ ✅ Город: ${newCategoryObject.place}`}
// ${newCategoryObject.subplace == "" ? "3️⃣ Район ⚠️" : `3️⃣ ✅ Район: ${newCategoryObject.subplace}`}
// ${newCategoryObject.unit_of_measure == "" ? "4️⃣ Ед. измерения ⚠️" : `4️⃣ ✅ Ед. измерения: ${newCategoryObject.unit_of_measure}`}
// ${newCategoryObject.quantity == "" ? "5️⃣ Количество (шт/гр в 1 ссылке): ⚠️" : `5️⃣ ✅ Количество (шт/гр в 1 ссылке): ${newCategoryObject.quantity}`}
// ${newCategoryObject.name == "" ? "6️⃣ Название ⚠️" : `6️⃣ ✅ Название: ${newCategoryObject.name}`}
// ${newCategoryObject.price_usd == "" ? "7️⃣ Цена ⚠️" : `7️⃣ ✅ Цена: ${newCategoryObject.price_usd}`}
// ${newCategoryObject.links == "" ? "8️⃣ Ссылки ⚠️" : `8️⃣ ✅ Ссылки:\n${newCategoryObject.links.join("\n")}`}
// ${newCategoryObject.domain == "" ? "9️⃣ Производитель ☁️" : `9️⃣ ✅ Производитель: ${newCategoryObject.domain}`}
// ${newCategoryObject.deliverer == "" ? "1️⃣0️⃣ Доставщик ☁️" : `10️⃣ ✅ Доставщик: ${newCategoryObject.deliverer}`}

const TELEGRAM_MAX_LENGTH = 4096;

// MAP STATUS TO ENUM
function mapStatusToEnum(status: string): LinkStatus {
    switch (status) {
        case "active":
            return LinkStatus.ACTIVE;
        case "stash":
            return LinkStatus.STASHED;
        case "sold":
            return LinkStatus.SOLD;
        default:
            return LinkStatus.STASHED;
    }
}

// GROUP LINKS BY RESTOCK ID
export function groupLinksByRestockId(links: Link[]): Record<string, Link[]> {
    const restocksAndLinks: Record<string, Link[]> = {};
    
    for (const link of links) {
        const restockId = link.inventory_restock?.id;
        if (restockId) {
            if (!restocksAndLinks[restockId]) {
                restocksAndLinks[restockId] = [];
            }
            restocksAndLinks[restockId].push(link);
        }
    }
    
    return restocksAndLinks;
}

// EMPTY STATE RESPONSE
function createEmptyStateResponse(): { text: string; entities: any[]; totalPages: number; currentPage: number; restockIdsByPage: Record<number, number[]> } {
    console.log('[goodsWithStatusText] - Пополнений нет');
    const finalText = FormattedString.b("").plain("В стеше нет позиций 🤷‍♂️");
    return {
        text: finalText.text,
        entities: finalText.entities,
        totalPages: 0,
        currentPage: 0,
        restockIdsByPage: {}
    };
}

// GENERATE INTRO TEXT BASED ON STATUS WITH PAGINATION INFO
function generateIntroText(statusEnum: LinkStatus, totalRestockCount: number, totalLinkCount: number, currentPage: number, totalPages: number): string {
    const statusTexts = {
        [LinkStatus.STASHED]: `Всего пополнений в стэше: ${totalRestockCount}\nВсего позиций в стэше: ${totalLinkCount}\n`,
        [LinkStatus.SOLD]: `Всего пополнений проданно: ${totalRestockCount}\nВсего позиций проданно: ${totalLinkCount}\n`,
        [LinkStatus.ACTIVE]: `Всего пополнений активно: ${totalRestockCount}\nВсего позиций активно: ${totalLinkCount}\n`
    };
    
    const baseText = statusTexts[statusEnum] || statusTexts[LinkStatus.STASHED];
    const paginationText = totalPages > 1 ? `- - - - - - - - - - - - - - - - - - - - -\n📄 Страница ${currentPage + 1} из ${totalPages}\n` : '';
    
    return baseText + paginationText + '- - - - - - - - - - - - - - - - - - - - -\n';
}

// GENERATE INTRO TEXT BASED ON STATUS WITH PAGINATION INFO FOR MANIPULATE
function generateIntroText_manipulate(statusEnum: LinkStatus, totalRestockCount: number, totalLinkCount: number, currentPage: number, totalPages: number): string {
    const statusTexts = {
        [LinkStatus.STASHED]: `Выберите пополнение которое хотите активировать:\n`,
        [LinkStatus.SOLD]: `Выберите пополнение которое хотите удалить:\n`,
        [LinkStatus.ACTIVE]: `Выберите пополнение которое хотите убрать в стэш:\n`
    };
    const baseText = statusTexts[statusEnum] || statusTexts[LinkStatus.STASHED];
    const paginationText = totalPages > 1 ? `- - - - - - - - - - - - - - - - - - - - -\n📄 Страница ${currentPage + 1} из ${totalPages}\n` : '';
    
    return baseText + paginationText + '- - - - - - - - - - - - - - - - - - - - -\n';
}

// FORMAT LINKS FOR A RESTOCK
function formatRestockLinks(linksArray: Link[]): string {
    let restockLinks = "";
    for (const link of linksArray) {
        restockLinks += "\t\t" + link.link + "\n";
    }
    return restockLinks;
}

// CREATE DETAILED RESTOCK INFORMATION TEXT
function createRestockDetails(firstLink: Link, restockLinks: string): string {
    return `🔢 Категория: ${firstLink.category.name}\n🏙️ Город: ${firstLink.place.name}\n🏘️ Район: ${firstLink.subplace.name}\n⚖️ Ед. измерения: ${firstLink.unit_of_measure}\n🧮 Количество (шт/гр в 1 ссылке): ${firstLink.quantity}\n🔖 Название: ${firstLink.name}\n💰 Цена: ${firstLink.price_usd}\n🔗 Ссылки:\n${restockLinks}\n🏭 Производитель: ${firstLink.manufacturer || "Не указан"}\n🚚 Доставщик: ${firstLink.deliverer || "Не указан"}\n`;
}

// BUILD RESTOCK INFORMATION ARRAY FOR A SPECIFIC PAGE
function buildRestockInfoArrayForPage(restocksAndLinks: Record<string, Link[]>, page: number, itemsPerPage: number): string[] {
    const restockIds = Object.keys(restocksAndLinks);
    const startIndex = page * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageRestockIds = restockIds.slice(startIndex, endIndex);
    
    const restockInfo: string[] = [];
    
    for (const restockId of pageRestockIds) {
        restockInfo.push(`Пополнение #: ${restockId}\n`);
        
        const linksArray = restocksAndLinks[restockId];
        if (linksArray && linksArray.length > 0) {
            const firstLink = linksArray[0];
            if (firstLink) {
                const restockLinks = formatRestockLinks(linksArray);
                const restockDetails = createRestockDetails(firstLink, restockLinks);
                restockInfo.push(restockDetails);
            }
        }
    }
    
    return restockInfo;
}

// CALCULATE HOW MANY RESTOCKS FIT WITHIN CHARACTER LIMIT
function calculateFittingRestocks(introText: string, restocksAndLinks: Record<string, Link[]>): number {
    const restockIds = Object.keys(restocksAndLinks).sort((a, b) => parseInt(a) - parseInt(b));
    let currentLength = introText.length;
    let fittingCount = 0;
    for (const restockId of restockIds) {
        const restockHeader = `Пополнение #: ${restockId}\n`;
        const linksArray = restocksAndLinks[restockId];
        if (linksArray && linksArray.length > 0) {
            const firstLink = linksArray[0];
            if (firstLink) {
                const restockLinks = formatRestockLinks(linksArray);
                const restockDetails = createRestockDetails(firstLink, restockLinks);
                const totalRestockLength = restockHeader.length + restockDetails.length;
                // Check if adding this restock would exceed the limit
                if (currentLength + totalRestockLength <= TELEGRAM_MAX_LENGTH) {
                    currentLength += totalRestockLength;
                    fittingCount++;
                } else {
                    break; // Stop at first restock that doesn't fit
                }
            }
        }
    }
    return fittingCount;
}

// FORMAT TEXT WITH BOLD AND BLOCKQUOTE STYLING
function formatTextWithStyling(introText: string, restockInfo: string[]): FormattedString {
    let finalText: FormattedString = new FormattedString("");
    finalText = finalText.plain(introText);
    
    for (const restockInfoItem of restockInfo) {
        if (restockInfo.indexOf(restockInfoItem) % 2 == 0) {
            finalText = finalText.b(restockInfoItem);
        } else {
            finalText = finalText.expandableBlockquote(restockInfoItem);
        }
    }
    
    if (finalText.text == "") {
        finalText = finalText.plain("В стеше нет позиций 🤷‍♂️");
    }
    
    return finalText;
}

// Main function - orchestrates the workflow with pagination
export async function goodsMenuWithStatusText(status: string, page: number = 0, groupBy: string = "category") {
    const statusEnum = mapStatusToEnum(status);
    const links = await LinkRepository.findAllLinksWithStatus(statusEnum);
    const restocksAndLinks = groupLinksByRestockId(links);
    if (Object.keys(restocksAndLinks).length == 0) {
        return createEmptyStateResponse();
    }
    const totalRestockCount = Object.keys(restocksAndLinks).length;
    const totalLinkCount = links.length;
    // Calculate how many restocks fit per page based on character limit
    const introText = generateIntroText(statusEnum, totalRestockCount, totalLinkCount, page, 1); // Temporary intro for calculation
    const itemsPerPage = calculateFittingRestocks(introText, restocksAndLinks);
    if (itemsPerPage === 0) {
        return createEmptyStateResponse();
    }
    const totalPages = Math.ceil(totalRestockCount / itemsPerPage);
    // Ensure page is within valid range
    const validPage = Math.max(0, Math.min(page, totalPages - 1));
    // Generate final intro text with correct pagination info
    const finalIntroText = generateIntroText(statusEnum, totalRestockCount, totalLinkCount, validPage, totalPages);
    // Build restock info for the current page
    const restockInfo = buildRestockInfoArrayForPage(restocksAndLinks, validPage, itemsPerPage);
    const finalText = formatTextWithStyling(finalIntroText, restockInfo);
    
    return {
        text: finalText.text,
        entities: finalText.entities,
        totalPages,
        currentPage: validPage
    };
}

export async function goodsMenuWithStatusText_manipulate(status: string, page: number = 0, groupBy: string = "category"): Promise<{ text: string, entities: any[], totalPages: number, currentPage: number, restockIdsByPage: Record<number, number[]> }> {
    const statusEnum = mapStatusToEnum(status);
    const links = await LinkRepository.findAllLinksWithStatus(statusEnum);
    const restocksAndLinks = groupLinksByRestockId(links);
    
    if (Object.keys(restocksAndLinks).length == 0) { return createEmptyStateResponse() }
    
    const totalRestockCount = Object.keys(restocksAndLinks).length;
    const totalLinkCount = links.length;
    const introText = generateIntroText_manipulate(statusEnum, totalRestockCount, totalLinkCount, page, 1);
    const itemsPerPage = calculateFittingRestocks(introText, restocksAndLinks);
    
    if (itemsPerPage === 0) { return createEmptyStateResponse() }
    
    const totalPages = Math.ceil(totalRestockCount / itemsPerPage);
    const validPage = Math.max(0, Math.min(page, totalPages - 1));
    
    // Calculate restock IDs for each page
    const restockIdsByPage: Record<number, number[]> = {};
    const restockIds = Object.keys(restocksAndLinks).map(Number);
    
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        const startIdx = pageNum * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, restockIds.length);
        restockIdsByPage[pageNum] = restockIds.slice(startIdx, endIdx);
    }

    // Generate text for current page
    const finalIntroText = generateIntroText_manipulate(statusEnum, totalRestockCount, totalLinkCount, validPage, totalPages);
    const restockInfo = buildRestockInfoArrayForPage(restocksAndLinks, validPage, itemsPerPage);
    const finalText = formatTextWithStyling(finalIntroText, restockInfo);

    return {
        text: finalText.text,
        entities: finalText.entities,
        totalPages,
        currentPage: validPage,
        restockIdsByPage
    };
}