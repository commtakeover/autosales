/**
 * Returns the main shop menu text
 */
export async function shopMenuText(): Promise<string> {
    return "🏪 Меню магазина\n\nВыберите действие:";
}

/**
 * Returns the mailing list menu text
 */
export async function mailingListMenuText(): Promise<string> {
    return "📢 Рассылка\n\nОтправьте сообщение всем пользователям:";
} 