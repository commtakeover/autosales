import { Menu } from "@grammyjs/menu";
import { type MyContext } from "../Context.ts";

export const UsersMenuInlineKeyboard = new Menu<MyContext>("users_menu")
    .submenu("Все пользователи", "all").row()
    .submenu("Сортировать по:", "sort").row()
    .submenu("Покупкам", "sort_by_purchase")
    .submenu("Сумме", "sort_by_sum")
    .submenu("Регистрации", "sort_by_registration")
    .submenu("Поиск", "search")


// 🔴 🟢