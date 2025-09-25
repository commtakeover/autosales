import { type MyContext } from "../Context.ts";
import { UserRepository } from "../../db/repositories/UserRepository.ts";
import { FormattedString } from "@grammyjs/parse-mode";

export async function getTopUpText(ctx: MyContext, tgId: number): Promise<{ text: string, entities: any[] }> {
    const user = await UserRepository.findByTgId(tgId.toString())
    if (!user) { return { text: "Что то пошло не так, юзер не найден", entities: [] } }
    const formattedString = new FormattedString("🪙 Пополнение баланса (Litecoin)\n➖➖➖➖➖➖➖​➖➖➖\n💳 Ваш личный адрес: ").code(user.address_hash).plain("\n\n1️⃣ Отправьте любую сумму на указанный кошелёк\n2️⃣ Платёж автоматически зачислится после 3-х подтверждений\n❕ Пополняйте на 1-3$ больше из за скачков курса")
    return {
        text: formattedString.text,
        entities: formattedString.entities
    }
}