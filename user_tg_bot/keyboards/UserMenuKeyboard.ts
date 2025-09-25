import { Menu } from "@grammyjs/menu";
import { type MyContext } from "../Context";
import { getTopUpText } from "../textGetters/TopUpText";
import { getProfileMenuText } from "../textGetters/ProfileMenuText";
import { getUserPurchasesText } from "../textGetters/MyPurchasesText";
import { UserRepository } from "../../db/repositories/UserRepository";
import { isAddressSynced, syncAddress, activateSyncedAddress } from "../litecoin-module/walletFunctions";
import { deleteSubscribedEvent, listSubscribedEvents } from "../litecoin-module/cryptoapis/eventSubscription";
import { sendLtc, sweepWallet } from "../litecoin-module/sweepWallet";

import { pause } from "../utils/pause";

export const UserMenuInlineKeyboard = new Menu<MyContext>("user_menu")
    .submenu("💰 Пополнить", "top_up", async (ctx) => {
        const { text, entities } = await getTopUpText(ctx, ctx.from!.id)
        // await checkUserCallbackAndActivate(ctx.from!.id)
        await ctx.editMessageText(text, { entities: entities })
    })
    .row()
    .submenu("🛒 Мои покупки", "my_purchases", async (ctx) => {
        const { text, entities, totalPages } = await getUserPurchasesText(ctx, ctx.from!.id.toString())
        ctx.session.purchases.currentPage = 1
        ctx.session.purchases.totalPages = totalPages
        await ctx.editMessageText(text, { entities: entities })
    })
    .row()
    // .text("💬 Оставить отзыв 💬", async (ctx) => {
    //     await ctx.reply("💬 Оставить отзыв", { reply_markup: ReviewMenuInlineKeyboard })
    // })
    .dynamic(async (ctx, range) => {
        if (ctx.from?.id != process.env.SUPER_OWNER_ID) return range;
        return range
            // .text("+ 10,000$", async (ctx) => {
            //     await UserRepository.updateUser(ctx.from!.id.toString(), {balance_usd: 10000})
            // })
            // .row()
            .text("Все ивенты", async (ctx) => {
                const activeLinks = await listSubscribedEvents()
                console.log("[Чек ивент] activeLinks:", activeLinks)
            })
            .row()
            .text("Удалить ивенты", async (ctx) => {
                await pause(1000)
                const activeLinks = await listSubscribedEvents()
                for (const link of activeLinks!.data.items) {
                    console.log("[Удалить ивенты] Удаляем ивент:", link.referenceId)
                    await deleteSubscribedEvent(link.referenceId)
                    await pause(2000)
                    console.log("[Удалить ивенты] Удален ивент:", link.referenceId)
                }
            })
            .row()
            // .text("isSynced", async (ctx) => {
            //     console.log("[isSynced] looking for user:", ctx.from.id)
            //     const user = await UserRepository.findByTgId(ctx.from.id.toString())
            //     if (!user) {
            //         console.log("[isSynced] user not found")
            //         return
            //     }
            //     const isSynced = await isAddressSynced(user.address_hash)
            //     console.log("[isSynced] isSynced:", isSynced)
            // })
            // .row()
            // .text("User data", async (ctx) => {
            //     console.log("[User data] looking for user:", ctx.from.id)
            //     // const user = await UserRepository.findUserWalletDataByTgId(ctx.from.id.toString())
            //     const user = await UserRepository.findByTgId(ctx.from.id.toString())
            //     console.log("[User data] user:", user)
                
            // })
            // .row()
            // .text("Derive xPub", async (ctx) => {
            //     const seed = bip39.mnemonicToSeedSync("trigger laptop artefact hundred snap border hunt convince black mountain place wave")
            //     const node = BIP32Factory(ecc).fromSeed(seed, LITECOIN)
            //     const path = "m/44'/60'/0'/0/0"
            //     const child = node.derivePath(path)
            //     const xPriv = child.toBase58();
            //     const xPub = child.neutered().toBase58();
            //     console.log("[Derive xPub] xPub:", xPub)
            //     console.log("[Derive xPub] xPriv:", xPriv)
            //     // console.log("[Derive xPub] Deriving xPub from:", )
            // })
            // .row()
            .text("Sweep wallet", async (ctx) => {
                await sweepWallet(ctx.from.id.toString())
            })
            // .text("Send LTC", async (ctx) => {
            //     await sendLtc()
            // })
            .row()
            // .text("Check xPub", async (ctx) => {
            //     const xPub = "xpub661MyMwAqRbcEotdQaQtfeZsd2RKwh2ZqdNCqu3mAV47yCywyGwgmiTRR6ECJop4BStkpwiVjaUwQWBKcpy5zUNQE5Fu4KRirTHBLjrBfDw"
            //     const xPubFound = await checkXPub(xPub)
            //     console.log("[Check xPub] xPubFound:", xPubFound)
            // })
            // .row()
            // .text("Change address", async (ctx) => {
            //     await changeUserAddress(ctx.from.id)
            // })
            // .row()
            // = = = = = = = = = [ SYNCING ADDRESS ] BELOW = = = = = = = = =
            // .text("isSncd", async (ctx) => {
            //     const user = await UserRepository.findByTgId(ctx.from.id.toString())
            //     if (!user) {
            //         console.log("[isAddressSynced] user not found")
            //         return
            //     }
            //     const isSynced = await isAddressSynced(user.address_hash)
            //     console.log("[isAddressSynced] isSynced:", isSynced)
            // })
            // .text("sync", async (ctx) => {
            //     const user = await UserRepository.findByTgId(ctx.from.id.toString())
            //     if (!user) {
            //         console.log("[syncAddress] user not found")
            //         return
            //     }
            //     const isSynced = await syncAddress(user.address_hash)
            //     // console.log("[syncAddress] isSynced:", isSynced)
            // })
            // .text("activate", async (ctx) => {
            //     const user = await UserRepository.findByTgId(ctx.from.id.toString())
            //     if (!user) {
            //         console.log("[activateSyncedAddress] user not found")
            //         return
            //     }
            //     const { is_active, sync_status } = await activateSyncedAddress(user.address_hash)
            //     console.log("[activateSyncedAddress] is_active:", is_active)
            //     console.log("[activateSyncedAddress] sync_status:", sync_status)
            // })
            // = = = = = = = = = [ SYNCING ADDRESS ] ABOVE = = = = = = = = =
            // = = = = = = = = = [ ADDRESS GENERATION ] BELOW = = = = = = = = =
            // .text("get address from wif", async (ctx) => {
            //     const wif = "T6Cym5M9HD1bJ8HktdtSFNAT9P9G6jo5fDM3x7Ki8UiumiTgrmiY"
            //     const address = wifToAddress(wif, "p2wpkh");
            //     console.log("Address:", address);
            // })
            // .row()
            // .text("seed to address", async (ctx) => {
            //     const mnemonic = "iron buffalo space kitten leg funny guide expect brain fever street visual"
            //     const seed = bip39.mnemonicToSeedSync(mnemonic);
            //     // console.log("Seed (hex):", seed.toString('hex'));
            //     const root = BIP32Factory(ecc).fromSeed(seed, LITECOIN);
            //     const path = "m/84'/0'/0'/0/0";
            //     const child = root.derivePath(path);
            //     const { address } = bitcoin.payments.p2wpkh({
            //         pubkey: Buffer.from(child.publicKey),
            //         network: LITECOIN,
            //     });
            //     console.log("Address:", address);
            // })
            // = = = = = = = = = [ ADDRESS GENERATION ] ABOVE = = = = = = = = =
    })
    .row()


export const TopUpMenuInlineKeyboard = new Menu<MyContext>("top_up")
    // .text("🔄 Проверить пополнение", async (ctx) => {
    //     await ctx.reply("Проверить пополнение...")
    // })
    .back("⬅️ Назад", async (ctx) => {
        await ctx.editMessageText(await getProfileMenuText(ctx))
    })

export const MyPurchasesMenuInlineKeyboard = new Menu<MyContext>("my_purchases")
    .dynamic(async (ctx, range) => {
        const { totalPages } = await getUserPurchasesText(ctx, ctx.from!.id.toString())
        
        // Add navigation buttons if there are multiple pages
        if (totalPages > 1) {
            range.text("⬅️", async (ctx) => {
                ctx.session.purchases.currentPage--
                const { text, entities } = await getUserPurchasesText(ctx, ctx.from!.id.toString())
                ctx.session.purchases.totalPages = totalPages
                await ctx.editMessageText(text, { entities: entities })
            })
            range.text(`${ctx.session.purchases.currentPage}/${totalPages}`)
            range.text("➡️", async (ctx) => {
                    ctx.session.purchases.currentPage++
                    const { text, entities } = await getUserPurchasesText(ctx, ctx.from!.id.toString())
                    ctx.session.purchases.totalPages = totalPages
                    await ctx.editMessageText(text, { entities: entities })
            })
        }
    })
    .row()
    .back("⬅️ Назад", async (ctx) => {
        await ctx.editMessageText(await getProfileMenuText(ctx))
    })

UserMenuInlineKeyboard.register(TopUpMenuInlineKeyboard);
UserMenuInlineKeyboard.register(MyPurchasesMenuInlineKeyboard);