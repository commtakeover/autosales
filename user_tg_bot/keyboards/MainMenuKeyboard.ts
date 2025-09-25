import { Keyboard } from "grammy";

export const MainMenuKeyboard = new Keyboard()
    .text("🛍️ Купить")
    .text("👤 Профиль")
    .text("💬 Поддержка")
    .row()
    // .text("❓ FAQ")
    // .text("⭐️ Отзывы")
    // .text("🌐 Taplink")
    // .row()
    .resized()
    .persistent()