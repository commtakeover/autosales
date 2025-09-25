import { UserRepository } from "../../db/repositories/UserRepository"
import { getNextWalletData } from "../litecoin-module/walletModule";
import { registerUsersWallet } from "../litecoin-module/cryptoapis/eventSubscription"
import { CryptoApisDerivedWalletDataRepository } from "../../db/repositories/cryptoApisDerivedWalletDataRepository";
import { isAddressSynced, syncAddress } from "../litecoin-module/walletFunctions";


export async function checkIfUserExistsAndCreate(tgId: number) {
    let incremented = true
    try {
        const userCheck = await UserRepository.findByTgId(tgId.toString())
        let newWalletData: { address: string, index: number } | null = null;
        if (userCheck && userCheck.reference_id) {
            console.log("[checkIfUserExistsAndCreate] user found!")
            return userCheck
        }
        newWalletData = await getNextWalletData();
        incremented = true;

        if (!newWalletData) {
            console.log("[checkIfUserExistsAndCreate] addressAtIndex not found")
            // if (incremented) await CryptoApisDerivedWalletDataRepository.decrementIndex()
            throw new Error("Error getting next wallet data")
        }
        const { reference_id, is_subscribed } = await registerUsersWallet(newWalletData.address)
        // console.log(newWalletData.address, reference_id, is_subscribed)
        await new Promise(resolve => setTimeout(resolve, 500))
        if (!reference_id) {
            console.log("[checkIfUserExistsAndCreate] reference_id not found")
            // if (incremented) await CryptoApisDerivedWalletDataRepository.decrementIndex()
            throw new Error("Error registering user wallet")
        }
        let isSynced = await isAddressSynced(newWalletData.address)
        await new Promise(resolve => setTimeout(resolve, 500))
        if (!isSynced) {
            console.log("[checkIfUserExistsAndCreate] address not synced, syncing...")
            const postSyncing = await syncAddress(newWalletData.address)
            await new Promise(resolve => setTimeout(resolve, 500))
            console.log("[checkIfUserExistsAndCreate] postSyncing:", postSyncing)
            isSynced = await isAddressSynced(newWalletData.address)
        }
        console.log("[checkIfUserExistsAndCreate] Saving user...")
        const user = await UserRepository.createAndSave(tgId.toString(), newWalletData.address, newWalletData.index, reference_id, is_subscribed, isSynced!)
        return user
    } catch (error) {
        if (incremented) await CryptoApisDerivedWalletDataRepository.decrementIndex()
        console.log("[checkIfUserExistsAndCreate] error:\n- - - - - - - - - - - - - - - - -\n", error)
        throw new Error("Error checking if user exists and creating user")
    }
}