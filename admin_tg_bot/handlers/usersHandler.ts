import { type MyContext } from "../Context.ts";
import { UsersMainKeyboard } from "../keyboards/users/UsersMainKeyboard.ts";
import { UserRepository } from "../../db/repositories/UserRepository.ts";
import { usersMainMenu } from "../textGetters/usersMainMenuText.ts";

// Всего зарегестрированных пользователей: ${countAll}
// - - - - - - - - - - - - - - - - - - - - - -
// Пользователь #1:
//   Телеграм ID: ${tg_id} 
//   Адрес: ${address}
//   Баланс: ${balance}
//   Роль: ${role}
//   Дата регистрации: ${created_at}
// - - - - - - - - - - - - - - - - - - - - - -

export async function usersHandler(ctx: MyContext) {
    await ctx.reply("Выберите действие:", { reply_markup: UsersMainKeyboard });
}