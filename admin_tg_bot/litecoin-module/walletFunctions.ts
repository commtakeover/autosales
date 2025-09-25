import * as ecc from 'tiny-secp256k1';
import { type ECPairInterface, ECPairFactory } from 'ecpair';
import * as bitcoin from 'bitcoinjs-lib';
import { randomBytes } from 'crypto';
import LITECOIN from './litecoin';
import axios, { AxiosError } from 'axios';

const network = LITECOIN

const rng = (size?: number): Uint8Array => {
    if (size === undefined) throw new Error('Size is required');
    return new Uint8Array(randomBytes(size));
};

const ECPair = ECPairFactory(ecc);

export function createWif() {
    try {
        const keyPair = ECPair.makeRandom({ network, rng })
        return keyPair.toWIF();
    } catch (error) {
        console.log("[createWif] error:\n- - - - - - - - - - - - - - - - -\n", error)
        return undefined
    }
}

export function wifToAddress(wif: string, addressType: string = 'p2wpkh'): string | undefined {
    try {
        const keyPair = ECPair.fromWIF(wif, network);
        const pubKeyBuffer = Buffer.from(keyPair.publicKey);
    
    if (!(addressType in bitcoin.payments)) {
        throw new Error(`Invalid address type: ${addressType}`);
    }
    const { address } = (bitcoin.payments as any)[addressType]({
        pubkey: pubKeyBuffer,
        network,
    });

    return address;
    } catch (error) {
        console.log("[wifToAddress] error:\n- - - - - - - - - - - - - - - - -\n", error)
        return undefined
    }
}

export async function getAddressBalance(address: string, context: string = "yourExampleString") {
    try {
        const baseUrl = 'https://rest.cryptoapis.io/addresses-historical/utxo/litecoin';
        const url = `${baseUrl}/${process.env.CRYPTOAPIS_NETWORK_MODE}/${address}/balance?context=${context}`;
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CRYPTOAPIS_API_KEY!
            }
        })
        // console.log("[getAddressBalance] response.data:", response.data)
        return response.data.data.item.confirmedBalance.amount;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.log("[getAddressBalance] error - AXIOS:\n- - - - - - - - - - - - - - - - -\n", error.response?.data)
        } else if (error instanceof Error && 'message' in error) {
            console.log("[getAddressBalance] error message:\n- - - - - - - - - - - - - - - - -\n", error.message)
        }
        return undefined
    }
}

export async function getUtxos(address: string, limit: number = 50, offset: number = 0, context: string = "yourExampleString") {
    try {
        let allUtxos: any[] = [];
        let hasMore = true;
        let currentOffset = 0;

        while (hasMore) {
            try {
                const url = `https://rest.cryptoapis.io/addresses-historical/utxo/litecoin/${process.env.CRYPTOAPIS_NETWORK_MODE}/${address}/unspent-outputs?context=${context}`;
                const response = await axios.get(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': process.env.CRYPTOAPIS_API_KEY!
                    },
                    params: {
                        limit: limit,
                        offset: currentOffset
                    }
                });
                const { data } = response.data;
                allUtxos = allUtxos.concat(data.items);

                // Check if we've received all items
                if (data.items.length < limit || currentOffset + data.items.length >= data.total) {
                    hasMore = false;
                } else {
                    currentOffset += limit;
                    await new Promise(resolve => setTimeout(resolve, 250));
                }
            } catch (error) {
                console.error('[getUtxos] error:', error);
                return undefined;
            }
        }

        return allUtxos;
    } catch (error: any) {
        // console.error('[getUtxos] Error getting utxos:', error.code, error.message);
        console.error('[getUtxos] error:', error);
        return undefined;
    }
}

export async function getFee(context: string = "yourExampleString", confirmationTarget: number = 3, estimateMode: string = "economical") {
    const url = 'https://rest.cryptoapis.io/blockchain-fees/utxo/litecoin/mainnet/smart';
    const response = await axios.get(url, {
        params: {
            context: context,
            confirmationTarget: confirmationTarget,
            estimateMode: estimateMode
        },
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.CRYPTOAPIS_API_KEY!
        }
    })
    return Number(response.data.data.item.feeRate) * 100000000;
}

function estimateTransactionSize(numInputs: number, numOutputs: number) {
    const inputSize = 148; // bytes per input
    const outputSize = 34; // bytes per output
    const overhead = 10;   // bytes
    return numInputs * inputSize + numOutputs * outputSize + overhead;
}

function stringLtcToLitoshi(amount: string) {
    return Number(amount) * 100000000;
}