import { type MyContext } from "../Context.ts";

export async function createCategoryText(ctx: MyContext, newCategoryObject: any) {
    return `Создайте категорию 🔠
    -----------------------------
    Вводите значения по порядку:
    ${newCategoryObject.category == "" ? "1️⃣ Категория ⚠️" : `1️⃣ ✅ Категория: ${newCategoryObject.category}`}
    ${newCategoryObject.place == "" ? "2️⃣ Город ⚠️" : `2️⃣ ✅ Город: ${newCategoryObject.place}`}
    ${newCategoryObject.subplace == "" ? "3️⃣ Район ⚠️" : `3️⃣ ✅ Район: ${newCategoryObject.subplace}`}
    ${newCategoryObject.unit_of_measure == "" ? "4️⃣ Ед. измерения ⚠️" : `4️⃣ ✅ Ед. измерения: ${newCategoryObject.unit_of_measure}`}
    ${newCategoryObject.quantity == "" ? "5️⃣ Количество (шт/гр в 1 ссылке): ⚠️" : `5️⃣ ✅ Количество (шт/гр в 1 ссылке): ${newCategoryObject.quantity}`}
    ${newCategoryObject.name == "" ? "6️⃣ Название ⚠️" : `6️⃣ ✅ Название: ${newCategoryObject.name}`}
    ${newCategoryObject.price_usd == "" ? "7️⃣ Цена ⚠️" : `7️⃣ ✅ Цена: ${newCategoryObject.price_usd}`}
    ${newCategoryObject.links == "" ? "8️⃣ Ссылки ⚠️" : `8️⃣ ✅ Ссылки:\n${newCategoryObject.links.join("\n")}`}
    ${newCategoryObject.domain == "" ? "9️⃣ Производитель ☁️" : `9️⃣ ✅ Производитель: ${newCategoryObject.domain}`}
    ${newCategoryObject.deliverer == "" ? "1️⃣0️⃣ Доставщик ☁️" : `10️⃣ ✅ Доставщик: ${newCategoryObject.deliverer}`}
    -----------------------------
    Обязательные поля - ⚠️
    Не обязательные поля - ☁️
    -----------------------------`
}   