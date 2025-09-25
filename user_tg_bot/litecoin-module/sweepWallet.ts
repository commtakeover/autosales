import * as bip39 from 'bip39';
import * as ecc from 'tiny-secp256k1';
import { LITECOIN } from './litecoin'; 
import * as bitcoin from 'bitcoinjs-lib';
import {getFee, getUtxos } from './walletFunctions';
import BIP32Factory from 'bip32';
import { UserRepository } from '../../db/repositories/UserRepository';
import { randomBytes } from 'crypto';
import ECPairFactory from 'ecpair';
import type { Signer } from 'bitcoinjs-lib';
import axios from 'axios';
import mempoolJS from "@mempool/mempool.js";


export async function sweepWallet(tgId: string) {
    try {
        // console.log("🏦 Sweeping wallets...")
        const user = await UserRepository.findByTgId(tgId)
        if (!user) {
            console.log("🏦 User not found")
            return
        }
        console.log("🏦 User found. Wallet index:", user.address_index)
        const wallet = getWallet(user.address_index)
        const walletAddress = bitcoin.payments.p2wpkh({
            pubkey: Buffer.from(wallet.publicKey), network: LITECOIN
        }).address
        console.log("🏦 Wallet:", walletAddress)
        const walletUtxo = await getUtxos(user.address_hash)
        // console.log("🏦 Wallet UTXO:", walletUtxo)
        await new Promise(resolve => setTimeout(resolve, 500))
        const fee = await getFee()
        // console.log("🏦 Fee:", fee)
        await new Promise(resolve => setTimeout(resolve, 500))
        let inputCount = 0
        let psbt = new bitcoin.Psbt({ network: LITECOIN });
        let balance = 0
        let inputs: any[] = []
        for (const utxo of walletUtxo!) {
            await new Promise(resolve => setTimeout(resolve, 500))
            const txHex = await retrieveTx(utxo.transactionId)
            console.log("Transaction:", txHex)

            inputs.push({
                hash: utxo.transactionId,
                index: utxo.index,
                nonWitnessUtxo: Buffer.from(txHex, 'hex')
            })
            inputCount++
            balance += Number((Number(utxo.value.amount) * 100000000).toFixed(0))
        }
        // console.log("🏦 Inputs:", inputs)
        psbt = psbt.addInputs(inputs)
        console.log("🏦 Balance:", balance)
        if (!balance) { console.log("🏦 No balance to sweep"); return }
        const B_SHARE = Math.floor(balance / 1000 * Number(process.env.B_SHARE!)) - Math.ceil(fee / 2)
        const TAX_SHARE = Math.floor(balance / 1000 * Number(process.env.TAX_SHARE!)) - Math.ceil(fee / 2)
        const totalFee = estimateTransactionSize(inputCount, 1) * fee
        // console.log("🏦 Total fee:", totalFee)
        // console.log("🏦 Sending amount:", balance - fee)
        console.log("🏦 PSBT inputs:", psbt.txInputs)
        psbt = psbt.addOutput({
            address: process.env.WITHDRAW_ADDRESS_B!,
            value: B_SHARE
        })
        psbt = psbt.addOutput({
            address: process.env.WITHDRAW_ADDRESS_TAX!,
            value: TAX_SHARE
        })
        // console.log("🏦 PSBT outputs:", psbt.txOutputs) 

        // psbt.signAllInputs(wallet as unknown as Signer)
        psbt.signAllInputs(wallet)
        psbt.finalizeAllInputs()
        
        const tx = psbt.extractTransaction()
        console.log("🏦 TX:", tx.toHex())
        try {
            const response = await broadcastTx(tx.toHex())
            // console.log("🏦 Response:", response)
        } catch (error) {
            console.log("[sweepWallet] error:", error)
            throw new Error("Error broadcasting transaction")
        }
    } catch (error) {
        console.log("[sweepWallet] error:", error)
        throw new Error("Error sweeping wallet")
    }
}

export async function sendLtc() {
    const bip32 = BIP32Factory(ecc);
    const seed = bip39.mnemonicToSeedSync(process.env.MNEMONIC!)
    const root = bip32.fromSeed(seed, LITECOIN)
    // const path = `m/44'/60'/0'/0/${index}`
    const child = root.derive(0)
    const wallet = bitcoin.ECPair.fromPrivateKey(Buffer.from(child.privateKey!), {
        network: LITECOIN
    })
    const walletAddress = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(wallet.publicKey), network: LITECOIN
    }).address
    console.log("🏦 Wallet:", walletAddress)
    // = = = get utxo from litecoinspace = = = 
    const { bitcoin: { addresses } } = mempoolJS({
        hostname: 'litecoinspace.org'
    });

    const address = 'ltc1qaygflvzk9fqjrgnv47g2j658pz7fjvztzkpk5w';
    const addressTxsUtxo = await addresses.getAddressTxsUtxo({ address });
    console.log(addressTxsUtxo);
    // = = = get utxo from litecoinspace = = = 
    return
    
}

function getWallet(index: number): Signer {
    const bip32 = BIP32Factory(ecc);
    const seed = bip39.mnemonicToSeedSync(process.env.MNEMONIC!)
    const root = bip32.fromSeed(seed, LITECOIN)
    const path = `m/44'/60'/0'/0/${index}`
    const child = root.derivePath(path)
    const wallet = bitcoin.ECPair.fromPrivateKey(Buffer.from(child.privateKey!), {
        network: LITECOIN
    })
    return wallet
    
}

function estimateTransactionSize(numInputs: number, numOutputs: number) {
    const inputSize = 148; // bytes per input
    const outputSize = 34; // bytes per output
    const overhead = 10;   // bytes
    return numInputs * inputSize + numOutputs * outputSize + overhead;
}


const rng = (size?: number): Uint8Array => {
    if (size === undefined) throw new Error('Size is required');
    return new Uint8Array(randomBytes(size));
};

function getECPair() {
    let ECPair;
    try {
        ECPair = ECPairFactory(ecc);
    } catch (error) {
        console.log("[walletFunctions] error creating ECPair:", error)
        throw new Error("Error creating ECPair")
    }
    return ECPair
}

async function broadcastTx(tx: string) {
    try {
        const url = `https://rest.cryptoapis.io/broadcast-transactions/litecoin/${process.env.CRYPTOAPIS_NETWORK_MODE}?context=yourExampleString`;
        const response = await axios.post(url, {
            context: "yourExampleString",
            data: {
                item: {
                    callbackSecretKey: process.env.CRYPTOAPIS_CALLBACK_SECRET_KEY!,
                    callbackUrl: process.env.CRYPTOAPIS_CALLBACK_URL!,
                    signedTransactionHex: tx
                }
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CRYPTOAPIS_API_KEY!
            }
        });
        return response.data;   
    } catch (error) {
        console.log("[broadcastTx] error:", error)
        throw new Error("Error broadcasting transaction")
    }
}

async function retrieveTx(tx: string) {
    try {
        const url = `https://rest.cryptoapis.io/transactions/utxo/litecoin/${process.env.CRYPTOAPIS_NETWORK_MODE}/${tx}/raw-data?context=yourExampleString`;
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CRYPTOAPIS_API_KEY!
            }
        })
        return response.data.data.item.transactionHex;
    } catch (error) {
        console.log("[retrieveTx] error:", error)
        throw new Error("Error retrieving transaction")
    }
}