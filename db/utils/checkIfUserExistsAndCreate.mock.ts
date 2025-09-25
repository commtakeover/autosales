import { UserRepository } from "../repositories/UserRepository"
import { CryptoApisDerivedWalletDataRepository } from "../repositories/cryptoApisDerivedWalletDataRepository";

/**
 * Generates a random Litecoin address starting with 'ltc1'
 */
function generateMockLtcAddress(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let address = 'ltc1q';
    for (let i = 0; i < 35; i++) {
        address += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return address;
}

/**
 * Generates a random 8-digit Telegram ID
 */
function generateMockTgId(): number {
    return Math.floor(10000000 + Math.random() * 90000000);
}

/**
 * Generates a mock UUID-style reference ID
 */
function generateMockReferenceId(): string {
    const chars = '0123456789abcdef';
    const segments = [8, 4, 4, 4, 12];
    return segments.map(len => {
        let segment = '';
        for (let i = 0; i < len; i++) {
            segment += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return segment;
    }).join('-');
}

/**
 * Mock version of getNextWalletData that reads from CryptoApisDerivedWalletDataRepository
 * and returns mock wallet data with ltc1 addresses
 */
export async function mockGetNextWalletData(): Promise<{ address: string, index: number }> {
    try {
        const currentIndex = await CryptoApisDerivedWalletDataRepository.iterateIndex();
        console.log("[mockGetNextWalletData] currentIndex:", currentIndex);
        
        const generatedAddress = generateMockLtcAddress();
        console.log("[mockGetNextWalletData] generatedAddress:", generatedAddress);
        
        return { address: generatedAddress, index: currentIndex };
    } catch (error) {
        await CryptoApisDerivedWalletDataRepository.decrementIndex();
        throw new Error("Error getting next mock address");
    }
}

/**
 * Mock version of registerUsersWallet that returns mock subscription data
 */
async function mockRegisterUsersWallet(address: string): Promise<{ reference_id: string, is_subscribed: boolean }> {
    console.log("[mockRegisterUsersWallet] registering address:", address);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
        reference_id: generateMockReferenceId(),
        is_subscribed: true
    };
}

/**
 * Mock version of isAddressSynced that always returns true
 */
async function mockIsAddressSynced(address: string): Promise<boolean> {
    console.log("[mockIsAddressSynced] checking sync status for:", address);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));
    return true;
}

/**
 * Mock version of syncAddress that simulates address syncing
 */
async function mockSyncAddress(address: string): Promise<boolean> {
    console.log("[mockSyncAddress] syncing address:", address);
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 200));
    return true;
}

/**
 * Mock version of checkIfUserExistsAndCreate function
 * Uses random mock data instead of real address generation, registration, and syncing
 */
export async function mockCheckIfUserExistsAndCreate(tgId?: number) {
    let incremented = true;
    
    // Use provided tgId or generate a random one
    const actualTgId = tgId || generateMockTgId();
    
    try {
        const userCheck = await UserRepository.findByTgId(actualTgId.toString());
        let newWalletData: { address: string, index: number } | null = null;
        
        if (userCheck && userCheck.reference_id) {
            console.log("[mockCheckIfUserExistsAndCreate] user found!");
            return userCheck;
        }
        
        newWalletData = await mockGetNextWalletData();
        incremented = true;

        if (!newWalletData) {
            throw new Error("Error getting next mock wallet data. addressAtIndex not found.");
        }
        
        const { reference_id, is_subscribed } = await mockRegisterUsersWallet(newWalletData.address);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!reference_id) {
            throw new Error("Error registering mock user wallet. reference_id not found.");
        }
        
        let isSynced = await mockIsAddressSynced(newWalletData.address);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!isSynced) {
            console.log("[mockCheckIfUserExistsAndCreate] address not synced, syncing...");
            await mockSyncAddress(newWalletData.address);
            await new Promise(resolve => setTimeout(resolve, 100));
            isSynced = await mockIsAddressSynced(newWalletData.address);
            console.log("[mockCheckIfUserExistsAndCreate] postSyncing:", isSynced);
        }
        
        console.log("[mockCheckIfUserExistsAndCreate] Saving user...");
        const user = await UserRepository.createAndSave(
            actualTgId.toString(), 
            newWalletData.address, 
            newWalletData.index, 
            reference_id, 
            is_subscribed, 
            isSynced
        );
        
        return user;
    } catch (error) {
        if (incremented) await CryptoApisDerivedWalletDataRepository.decrementIndex();
        console.log("[mockCheckIfUserExistsAndCreate] error:\n- - - - - - - - - - - - - - - - -\n", error);
        throw new Error("Error checking if user exists and creating mock user");
    }
}
