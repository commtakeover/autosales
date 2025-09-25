import * as ecc from 'tiny-secp256k1';
import { type ECPairInterface, ECPairFactory } from 'ecpair';
import * as bitcoin from 'bitcoinjs-lib';
import { randomBytes } from 'crypto';
import LITECOIN from './litecoin';

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

