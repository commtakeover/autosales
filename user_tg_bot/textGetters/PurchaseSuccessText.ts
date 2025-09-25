import { FormattedString } from "@grammyjs/parse-mode";
import { LinkRepository } from "../../db/repositories/LinkRepository.ts";

export async function getPurchaseSuccessText(linkId: number, linkText: string) {
    const link = await LinkRepository.findById(linkId);
    const formattedText = new FormattedString("✅ Вы успешно купили товар:\n➖➖➖➖➖➖➖➖➖➖\n🏷️ Название: ").code(linkText).plain("\nСсылка: ").code(link!.link).plain("\nДата покупки: ").code(new Date().toLocaleString())
    return {
        text: formattedText.text,
        entities: formattedText.entities
    }
}