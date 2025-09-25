import * as bip39 from 'bip39';
import * as ecc from 'tiny-secp256k1';
import BIP32Factory from 'bip32';
import { LITECOIN } from './litecoin';
import { CryptoApisDerivedWalletDataRepository } from "../../db/repositories/cryptoApisDerivedWalletDataRepository";
import * as bitcoin from 'bitcoinjs-lib';

const bip32 = BIP32Factory(ecc);


export async function getNextWalletData(): Promise<{ address: string, index: number }> {
    try {
        const currentIndex = await CryptoApisDerivedWalletDataRepository.iterateIndex()
        console.log("[getNextAddress] currentIndex:", currentIndex)
        
        console.log("🔐 Deriving private key from mnemonic...");
        const seed = bip39.mnemonicToSeedSync(process.env.MNEMONIC!);
        console.log("🔑 Seed:", seed.toString('hex'));
        const root = bip32.fromSeed(seed, LITECOIN);

        // m/44'/60'/0'/0/0 - deposit
        // m/44'/60'/0'/1/0 - change
        const path = `m/44'/60'/0'/0/${currentIndex}`;
        console.log("🛣️ Using derivation path:", path);
        const child = root.derivePath(path);

        const childPubkey = child.publicKey;
        const childPrivkey = child.privateKey;
        // console.log("🔑 public key:", childPubkey?.toString())
        // console.log("🔑 private key:", childPrivkey?.toString())

        const payment = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(childPubkey), network: LITECOIN });
        const generatedAddress = payment.address;
        console.log("🔑 generatedAddress:", generatedAddress)
        return { address: generatedAddress!, index: currentIndex! }
    } catch (error) {
        await CryptoApisDerivedWalletDataRepository.decrementIndex()
        throw new Error("Error getting next address")
    }
}