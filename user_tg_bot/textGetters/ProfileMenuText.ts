import { type MyContext } from "../Context.ts";
import { UserRepository } from "../../db/repositories/UserRepository.ts";

export async function getProfileMenuText(ctx: MyContext): Promise<string> {
    const user = await UserRepository.findByTgId(ctx.from?.id.toString() ?? "")
    if (!user) { return `Что то пошло не так, юзер не найден` }
    // console.log("user", user)
    const formatRegisteredTime = (created_at: Date) => {
        const diffTime = Math.abs(Date.now() - created_at.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const formattedDate = new Date(created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `${formattedDate} (${diffDays} ${diffDays === 1 ? "день" : diffDays < 5 ? "дня" : "дней"})`
    }
    const profileText = `👤 Ваш профиль:\n➖➖➖➖➖➖➖➖➖➖\n🆔 TG ID: ${user.telegram_id_hash}\n💰 Баланс: ${user.balance_usd}$\n\n🎟 Скидка: ${user.discount}%\n🎁 Куплено товаров: ${user.purchases?.length ?? 0} шт\n\n🕰 Регистрация: ${formatRegisteredTime(user.created_at)}`
    return profileText
}