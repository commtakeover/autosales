import { Keyboard } from "grammy";
import { UsersMenuInlineKeyboard } from "./UserMenuKeyboard";

export const MainMenuKeyboard = new Keyboard()
    // .text("🪝 Акции")
    // .text("🔖 Скидки") //🏷️
    .text("💰 Кошельки")
    .text("🛒 Товары")
    .text("🏪 Магазин")
    .row()
    // .text("🏭 Производители")
    // // .text("")
    // .text("🧑🏿‍🏭 Доставка")
    // .text("⚙️ Настройи")
    // .row()
    .resized()
    .persistent()