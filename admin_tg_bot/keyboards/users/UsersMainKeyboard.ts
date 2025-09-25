import { Menu } from "@grammyjs/menu";
import { type MyContext } from "../../Context.js";
import { UserRepository } from "../../../db/repositories/UserRepository.js";
import { getAddressBalance } from "../../litecoin-module/walletFunctions.js";
import { sweepWallet } from "../../litecoin-module/sweepWallets.js";
import { activateExistingEventSubscription, deleteSubscribedEvent, getAllAddressesSyncData, isAddressSubscribed, listSubscribedEvents, listSyncedAddresses, registerUsersWallet, syncAddress } from "../../litecoin-module/cryptoapis.js";
import { User } from "../../../db/entities/user.entity.js";
import { mockCheckIfUserExistsAndCreate } from "../../../db/utils/checkIfUserExistsAndCreate.mock.js";
import { simulatePaymentWebhook } from "../../utils/simulatePaymentWebhook.js";

export const UsersMainKeyboard = new Menu<MyContext>("users_main_menu")
    // .submenu("👥 Все пользователи 👥", "users_list", async (ctx) => {
    //     await ctx.editMessageText("Выберите пользователя:")
    // })
    // .row()
    .text("👤 Найти по ТГ айди 👤", async (ctx) => {
        await ctx.conversation.enter("findUserByTgIdConversation")
        // await ctx.editMessageText("Введите ТГ айди:")
    })
    .row()
    .dynamic(async (ctx, range) => {
        console.log("[UsersMainKeyboard] ctx.from?.id:", ctx.from?.id !== process.env.SUPER_OWNER_ID)
        if (ctx.from?.id != process.env.SUPER_OWNER_ID) return range;
        return range
            // .text("👥 Все пользователи", async (ctx) => {
            //     const allAddresses = await UserRepository.findAllUsers()
            //     console.log("[Все пользователи] allUsers:", allAddresses)
            // })
            // .row()
            // .text("🪙 Все LTC балансы", async (ctx) => {
            //     const allUsers = await UserRepository.findAllUsers()
            //     let allBalances = ''  // id: balance
            //     for (const user of allUsers) {
            //         const balance = await getAddressBalance(user.address_hash)
            //         await new Promise(resolve => setTimeout(resolve, 1500))
            //         if (balance && balance > 0.0005) {
            //             await sweepWallet(user.telegram_id_hash)
            //             allBalances += `${user.telegram_id_hash} | ${user.address_hash} - ${balance}\n`
            //         }
            //     }
            //     console.log(`[Все LTC балансы] allBalances:\n${allBalances}`)
            //     await ctx.reply(allBalances)
            // })
            .row()
            .text("🔄 Синхронизировать все адреса", async (ctx) => {
                const allUsers = await UserRepository.findAllUsers()
                let nonSyncedAddresses = ``
                let nonActiveAddresses = ``
                let nonActiveAndNonSyncedAddresses = ``

                const allAddressesSyncData = await getAllAddressesSyncData()

                if (allAddressesSyncData) {
                    for (const address of allAddressesSyncData) {
                        if (!address.isActive && address.syncStatus == "synced") {
                            nonActiveAddresses += `${address.address} - ${address.isActive}\n`
                        } else if (address.isActive && address.syncStatus !== "synced") {
                            nonSyncedAddresses += `${address.address} - ${address.syncStatus}\n`
                            // const user = await UserRepository.findByAddressHash(address.address)
                            // await deleteSubscribedEvent(user!.reference_id)
                            // console.log(`[Удалили подписку на адрес] ${address.address}`)
                            // await registerUsersWallet(address.address)
                            // console.log(`[Зарегистрировали подписку на адрес] ${address.address}`)
                            // return;
                        } else if (!address.isActive && address.syncStatus !== "synced") {
                            nonActiveAndNonSyncedAddresses += `${address.address} - not active and not synced\n`
                        }
                    }
                }

                console.log(`[Не синхронизированные адреса] nonSyncedAddresses:\n${nonSyncedAddresses}`)
                console.log(`[Не активные адреса] nonActiveAddresses:\n${nonActiveAddresses}`)
                console.log(`[Не активные и не синхронизированные адреса] nonActiveAndNonSyncedAddresses:\n${nonActiveAndNonSyncedAddresses}`)
            })
            .row()
            .text("💰 Все USD балансы", async (ctx) => {
                const allUsers = await UserRepository.findAllUsers()
                let totalUsdAmount = 0
                let usersWithBalanceOver7 = 0
                
                // Calculate totals for all users
                for (const user of allUsers) {
                    const balanceUsd = Number(user.balance_usd) || 0
                    totalUsdAmount += balanceUsd
                    
                    if (balanceUsd > 7) {
                        usersWithBalanceOver7++
                    }
                }
                
                // Sort users by balance and get top 25
                const topUsers = allUsers
                    .map(user => ({
                        ...user,
                        balanceUsd: Number(user.balance_usd) || 0
                    }))
                    .sort((a, b) => b.balanceUsd - a.balanceUsd)
                    .slice(0, 25)
                
                let usersData = ''
                for (const user of topUsers) {
                    usersData += `${user.telegram_id_hash} | ${user.address_hash} - ${user.balanceUsd} USD\n`
                }
                
                const summary = `💰 Сводка USD балансов:\n` +
                    `💵 Общая сумма: ${totalUsdAmount.toFixed(2)} USD\n` +
                    `👥 Пользователей с балансом > 7$: ${usersWithBalanceOver7}\n` +
                    `📊 Всего пользователей: ${allUsers.length}\n\n` +
                    `🏆 Топ 25 пользователей по балансу:\n${usersData}`
                
                console.log(`[Все USD балансы] summary:\n${summary}`)
                await ctx.reply(summary)
            })
            .row()
            .text("🎭 Добавить 700 мок пользователей", async (ctx) => {
                let createdUsers = 0;
                let errors = 0;
                
                await ctx.reply("🔄 Создание мок пользователей началось...");
                
                for (let i = 0; i < 700; i++) {
                    try {
                        const mockUser = await mockCheckIfUserExistsAndCreate();
                        console.log(`[Создали мок пользователя ${i + 1}/25] user:`, {
                            id: mockUser.id,
                            telegram_id_hash: mockUser.telegram_id_hash,
                            address_hash: mockUser.address_hash,
                            reference_id: mockUser.reference_id
                        });
                        createdUsers++;
                    } catch (error) {
                        console.log(`[Ошибка создания мок пользователя ${i + 1}/25]`, error);
                        errors++;
                    }
                }
                
                const summary = `✅ Создание мок пользователей завершено!\n` +
                    `👥 Создано: ${createdUsers}\n` +
                    `❌ Ошибок: ${errors}\n` +
                    `📊 Всего попыток: 25`;
                
                console.log(`[Мок пользователи созданы] summary:\n${summary}`);
                await ctx.reply(summary);
            })
            .row()
            .text("🔄 Симуляция пополнения баланса пользователей", async (ctx) => {
                await ctx.reply("🔄 Запускаю симуляцию пополнения баланса...");
                
                const result = await simulatePaymentWebhook();
                
                if (result.success) {
                    await ctx.reply(result.message);
                } else {
                    await ctx.reply(result.message);
                }
            })

    })

export const UsersListKeyboard = new Menu<MyContext>("users_list")
    .text("Все пользователи", async (ctx) => {
        const allAddresses = await UserRepository.findAllUsers()
        console.log("[Все пользователи] allUsers:", allAddresses)
    })
    .text("Все LTC балансы", async (ctx) => {
        const allUsers = await UserRepository.findAllUsers()
        let allBalances = ''  // id: balance
    })
    .row()
    .back("Назад", async (ctx) => {
        await ctx.editMessageText("Выберите пользователя:")
    })