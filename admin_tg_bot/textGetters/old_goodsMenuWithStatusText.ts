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

export async function goodsMenuWithStatusText(status: string, groupBy: string = "category") {
    let statusEnum: LinkStatus;
    if (status == "active") statusEnum = LinkStatus.ACTIVE;
    else if (status == "stash") statusEnum = LinkStatus.STASHED;
    else if (status == "sold") statusEnum = LinkStatus.SOLD;
    else statusEnum = LinkStatus.STASHED;
    const restocksAndLinks: any = {}
    const links = await LinkRepository.findAllLinksWithStatus(statusEnum);
    // create links object with restock id as key and array of links as value
    for (const link of links) {
        if (!restocksAndLinks[link.inventory_restock?.id]) {
            restocksAndLinks[link.inventory_restock?.id] = [];
        }
        restocksAndLinks[link.inventory_restock?.id].push(link);
    }
    // console.log('restocksAndLinks', restocksAndLinks)
    if (Object.keys(restocksAndLinks).length == 0) {
        console.log('[goodsWithStatusText] - Пополнений нет')
        const finalText = FormattedString.b("").plain("В стеше нет позиций 🤷‍♂️")
        return {
            text: finalText.text,
            entities: finalText.entities
        }
    }
    // create final text that has restock ids as headings and all link data as expandable blockquotes
    let introText: string;
    if (statusEnum == LinkStatus.STASHED) {
        introText = `Всего пополнений в стэше: ${Object.keys(restocksAndLinks).length}\nВсего позиций в стэше: ${links.length}\n- - - - - - - - - - - - - - - - - - - - -\n`
    } else if (statusEnum == LinkStatus.SOLD) {
        introText = `Всего пополнений проданно: ${Object.keys(restocksAndLinks).length}\nВсего позиций проданно: ${links.length}\n- - - - - - - - - - - - - - - - - - - - -\n`
    } else {
        introText = `Всего пополнений активно: ${Object.keys(restocksAndLinks).length}\nВсего позиций активно: ${links.length}\n- - - - - - - - - - - - - - - - - - - - -\n`
    }
    
    let restockInfo: string[] = [];
    for (const restockId in restocksAndLinks) {
        restockInfo.push(`Пополнение #: ${restockId}\n`)
        let restockLinks: string = "";
        const linksArray = restocksAndLinks[restockId];
        for (const link of linksArray) {
            restockLinks += "\t\t" + link.name + "\n";
        }
        if (linksArray.length > 0) {
            const firstLink = linksArray[0];
            restockInfo.push(`🔢 Категория: ${firstLink.category.name}\n🏙️ Город: ${firstLink.place.name}\n🏘️ Район: ${firstLink.subplace.name}\n⚖️ Ед. измерения: ${firstLink.unit_of_measure}\n🧮 Количество (шт/гр в 1 ссылке): ${firstLink.quantity}\n🔖 Название: ${firstLink.name}\n💰 Цена: ${firstLink.price_usd}\n🔗 Ссылки:\n${restockLinks}\n🏭 Производитель: ${firstLink.domain || "Не указан"}\n🚚 Доставщик: ${firstLink.deliverer || "Не указан"}\n`)
        }
    }
    let finalText: FormattedString = new FormattedString("")
    finalText = finalText.plain(introText)
    // for every first item in restockInfo, add it as bold
    // for every other item, add it as expandable blockquote
    for (const restockInfoItem of restockInfo) {
        if (restockInfo.indexOf(restockInfoItem) % 2 == 0) {
            finalText = finalText.b(restockInfoItem)
        } else {
            finalText = finalText.expandableBlockquote(restockInfoItem)
        }
    }

    if (finalText.text == "") {
        finalText.plain("В стеше нет позиций 🤷‍♂️")
    }

    return {
        text: finalText.text,
        entities: finalText.entities
    };

}
