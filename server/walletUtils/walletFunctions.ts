import { randomBytes } from 'crypto';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import axios, { AxiosError } from 'axios';
import ECPairFactory from 'ecpair';
import { UserRepository } from '../../db/repositories/UserRepository';
import * as bip39 from 'bip39';

import { LITECOIN } from './litecoin';
import BIP32Factory from 'bip32';

const network = LITECOIN

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

export async function wtfag() {
    const mnemonic: string = bip39.generateMnemonic(128);
    const seed: Buffer = bip39.mnemonicToSeedSync(mnemonic);
    const root = BIP32Factory(ecc).fromSeed(seed, network);
    const path = "m/84'/0'/0'/0/0";
    const child = root.derivePath(path);
    const { address } = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(child.publicKey),
        network: network,
    });
    // console.log("[generateCredentials] - Mnemonic:", mnemonic);
    // console.log("[generateCredentials] - Seed (hex):", seed.toString('hex'));
    // console.log("[generateCredentials] - P2WPKH address (bech32):", address);
    // console.log("[generateCredentials] - Derivation path:", path);
    // console.log("[generateCredentials] - Public Key:", Buffer.from(child.publicKey).toString('hex'));
    // console.log("[generateCredentials] - Private Key (WIF):", child.toWIF());
    return {
        mnemonic,
        seed: seed.toString('hex'),
        address,
        path,
        publicKey: Buffer.from(child.publicKey).toString('hex'),
        wif: child.toWIF(),
    }
}

// export async function sweepWallet_FAILED_ATTEMPT(senderAddress: string, privateKeyWIF: string, receiverAddress: string, litoshiAmountToSend: number = 0, chain: string = "mainnet") {
//     try {
//         let totalBalance = litoshiAmountToSend == 0 ? await getAddressBalance(senderAddress) : litoshiAmountToSend;
//         totalBalance = stringLtcToLitoshi(totalBalance);
//         // console.log('[sweepWallet] totalBalance:', totalBalance);
//         const NETWORK = LITECOIN
//         const ECPair = getECPair()
//         const keyPair = ECPair.fromWIF(privateKeyWIF, NETWORK);
//         // if (!keyPair.compressed) throw new Error('Private key must be compressed for SegWit');
//         // console.log('keyPair.publicKey:', bitcoin.payments.p2wpkh({ pubkey: Buffer.from(keyPair.publicKey), network: NETWORK }).output);

//         const utxos = await getUtxos(senderAddress)
//         await new Promise(resolve => setTimeout(resolve, 1000));
//         if (!utxos) {
//             console.log('No utxos found')
//             return false;
//         }
//         // console.log('cryptoapis.com UTXOs:', utxos);
//         const fastFee = await getFee()
//         // console.log('Fast fee:', fastFee);
//         // Sort UTXOs by value (descending)
//         utxos.sort((a: any, b: any) => stringLtcToLitoshi(b.value.amount) - stringLtcToLitoshi(a.value.amount));
//         // Calculate the total input value and add inputs to the transaction
//         const inputs: any[] = []
//         const txb = new bitcoin.Psbt({ network: NETWORK });
//         let totalInput = 0;
//         let inputCount = 0;
//         let fee = 0;
//         console.log(1)
//         for (const utxo of utxos) {
//             totalInput += stringLtcToLitoshi(utxo.value.amount);
//             inputCount++;
//             const txSize = estimateTransactionSize(inputCount, 2); // 2 outputs: one for the receiver and one for change
//             fee = fastFee * txSize;
//             inputs.push({
//                 hash: utxo.transactionId,
//                 index: utxo.index,
//                 witnessUtxo: {
//                     script: bitcoin.payments.p2wpkh({ pubkey: Buffer.from(keyPair.publicKey, 'hex'), network: NETWORK }).output!,  // ← locking script
//                     value: stringLtcToLitoshi(utxo.value.amount),  // ← satoshis (integer)
//                 }
//             });
//             if (totalInput >= totalBalance + fee) break;
//         }
//         txb.addInputs(inputs);
//         console.log(2)
//         let outputAmount = totalInput - fee;
//         txb.addOutput({
//             address: receiverAddress,
//             value: outputAmount
//         });
//         // txb.signAllInputs(keyPair);
//         txb.signInput(0, keyPair);
//         console.log('Inputs signed...');
//         const finalizedTx = txb.finalizeAllInputs()
//         console.log('Inputs finalized...');
//         const extractedTx = finalizedTx.extractTransaction();
//         const txHex = extractedTx.toHex(); 
//         console.log('Transaction hex extracted...');
//         console.log('Signed transaction hex:', txHex);
//         return { txid: txHex };
//         // const txHex = txb.build().toHex();
//         // console.log('Signed transaction hex:', txHex);
//         // return { txid: txHex };
//     } catch (error: any) {
//         if (error instanceof AxiosError) {
//             console.error('[sweepWallet] Error creating transaction - AXIOS:', error.response?.data.error.code, error.response?.data.error.message);
//             // await bot.api.sendMessage(process.env.SUPER_OWNER_ID!, `[sweepWallet] CRYPTOAPIS ERROR:\n${error.response?.data.error.code}\n${error.response?.data.error.message}`);
//         } else if (error instanceof Error && 'message' in error) {
//             console.error('[sweepWallet] Error creating transaction - GENERAL:\n- - - - - - - - - - - - - - - - -\n', error);
//         }
//         return false;
//     }
// }

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

export async function getAddressConfirmedTransactions(address: string, context: string = "yourExampleString") {
    try {
        const baseUrl = 'https://rest.cryptoapis.io/addresses-historical/utxo/litecoin';
        const url = `${baseUrl}/${process.env.CRYPTOAPIS_NETWORK_MODE}/${address}/balance?context=${context}`;
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CRYPTOAPIS_API_KEY!
            }
        })
        console.log("[getAddressConfirmedTransactions] response.data:\n- - - - - - - - - - - - - - - - -\n", response.data)
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.log("[getAddressConfirmedTransactions] error - AXIOS:\n- - - - - - - - - - - - - - - - -\n", error.response?.data)
        } else if (error instanceof Error && 'message' in error) {
            console.log("[getAddressConfirmedTransactions] error message:\n- - - - - - - - - - - - - - - - -\n", error.message)
        }
        return undefined
    }
}

// THIS FUNCTION IS PAGINATED, RETURNS 50 UNCONFIRMED TRANSACTIONS
export async function getAddressUnconfirmedTransactions(address: string, limit: number = 20, offset: number = 0, context: string = "yourExampleString") {
    try {
        const baseUrl = 'https://rest.cryptoapis.io/addresses-historical/utxo/litecoin';
        const url = `${baseUrl}/${process.env.CRYPTOAPIS_NETWORK_MODE}/${address}/unspent-outputs?context=${context}`;
        console.log("[getAddressUnconfirmedTransactions] url:", url)
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CRYPTOAPIS_API_KEY!,
                'limit': limit.toString(),  
                'offset': offset.toString()
            }
        })
        console.log("[getAddressUnconfirmedTransactions] response.data:", response.data)
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.log("[getAddressUnconfirmedTransactions] error - AXIOS:\n- - - - - - - - - - - - - - - - -\n", error.response?.data)
        } else if (error instanceof Error && 'message' in error) {
            console.log("[getAddressUnconfirmedTransactions] error message:\n- - - - - - - - - - - - - - - - -\n", error.message)
        }   
        return undefined
    }
}

export async function handleReceivedTransaction(address: string, ltc_amount: number, usd_amount: number, transaction: any) {
    // increase user balance
    const user = await UserRepository.findByAddressHash(address)
    if (!user) {
        console.log("[handleReceivedTransaction] user not found")
        return
    }
    console.log("[handleReceivedTransaction] user balance before:", user.balance_usd)
    const updatedUser = await UserRepository.updateUser(user.telegram_id_hash, { balance_usd: user.balance_usd + usd_amount })
    console.log("[handleReceivedTransaction] user balance after:", updatedUser.balance_usd)
    // send notification to user
}

export async function registerUsersWallet(userAddressHash: string, context: string = "yourExampleString"): Promise<{ is_subscribed: boolean, reference_id: string }> {
    let is_subscribed = false
    let reference_id = ""
    // console.log("[registerUsersWallet] userAddressHash:", userAddressHash)
    try {
        const baseUrl = 'https://rest.cryptoapis.io/blockchain-events/litecoin';
        const url = `${baseUrl}/${process.env.CRYPTOAPIS_NETWORK_MODE}/address-coins-transactions-confirmed?context=${context}`;
        // console.log("[registerUsersWallet] url:", url)
        const response = await axios.post(
            url,
            {
                context: context,
                data: {
                    item: {
                        address: userAddressHash,
                        allowDuplicates: false,
                        callbackSecretKey: process.env.CRYPTOAPIS_CALLBACK_SECRET_KEY!,
                        callbackUrl: process.env.CRYPTOAPIS_CALLBACK_URL!,
                        receiveCallbackOn: 3
                    }
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.CRYPTOAPIS_API_KEY!
                }
            }
        );
        // console.log("[registerUsersWallet] response.data:", response.data)
        is_subscribed = response.data.data.item.isActive
        reference_id = response.data.data.item.referenceId
        return { is_subscribed, reference_id }
    } catch (error) {
        if (error instanceof AxiosError) {
            // console.error("[registerUsersWallet] ERROR - AXIOS:\n- - - - - - - - - - - - - - - - -\n", error.response?.data)
            console.error("[registerUsersWallet] ERROR - AXIOS:\n- - - - - - - - - - - - - - - - -\n", error.response?.data)
        } else if (error instanceof Error && 'message' in error) {
            console.log("[registerUsersWallet] ERROR message:\n- - - - - - - - - - - - - - - - -\n", error.message)
        }
        return { is_subscribed, reference_id }
    }
}

// export async function checkUserCallbackAndActivate(tgId: number) {
//     const user = await UserRepository.findByTgId(tgId.toString())
//     if (!user) {
//         console.log("[checkUserCallbackAndActivate] user not found")
//         return
//     }
//     const isSubscribed = await isAddressSubscribed(user.address_hash)
//     if (!isSubscribed) {
//         console.log("[checkUserCallbackAndActivate] user not subscribed")
//         const { is_subscribed, reference_id } = await registerUsersWallet(user.address_hash)
//         console.log("[checkUserCallbackAndActivate] user is subscribed:", is_subscribed)
//     }
//     if (!user.is_synced) {
//         const isSynced = await syncAddress(user.address_hash)
//         console.log("[checkUserCallbackAndActivate] user is synced:", isSynced)
//     } else {
//         console.log("[checkUserCallbackAndActivate] user is already synced")
//     }

//     return
// }



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

export async function isAddressSynced(address: string, limit: number = 25, offset: number = 0, context: string = "yourExampleString") {
    try {
        let hasMore = true;
        let startingAfter = "";
        let page = 0;

        while (hasMore) {
            let response;
            const url = `https://rest.cryptoapis.io/addresses-historical/manage/litecoin/${process.env.CRYPTOAPIS_NETWORK_MODE}?context=${context}&limit=${limit}${startingAfter ? `&startingAfter=${startingAfter}` : ""}`;
            try {
                response = await axios.get(url, {
                    headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.CRYPTOAPIS_API_KEY!
                }
                });
            } catch (error: any) {
                console.log("[isAddressSynced] error:", error.response?.data)
                return false
            }
            const syncedAddresses = response.data.data.items.map((item: any) => ({
                address: item.address,
                syncStatus: item.syncStatus, 
                isActive: item.isActive
            }));
            const foundAddress = syncedAddresses.find((item: any) => {
                return item.address === address
            });
            if (foundAddress && !foundAddress.isActive) {
                const { is_active, sync_status } = await activateSyncedAddress(address)
                // console.log("[isAddressSynced] is_active:", is_active)
                // console.log("[isAddressSynced] sync_status:", sync_status)
                return is_active && sync_status == "completed"
            }
            if (foundAddress && foundAddress.isActive && (foundAddress.syncStatus == "completed" || foundAddress.syncStatus == "synced")) {
                return true
            }
            hasMore = response.data.data.hasMore;
            startingAfter = response.data.data.nextStartingAfter;

            console.log("Checked page", page, "hasMore:", hasMore, "startingAfter:", startingAfter)
            page++;

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return false;
    } catch (error: any) {
        console.error('[isAddressSynced] Error checking synced address:', error.code, error.message);
        return undefined;
    }
}

export async function syncAddress(address: string, context: string = "yourExampleString") {
    try {
        // console.log("[syncAddress] x-api-key:", process.env.CRYPTOAPIS_API_KEY!)
        // console.log("[syncAddress] address:", address)
        // console.log("[syncAddress] callbackUrl:", process.env.CRYPTOAPIS_CALLBACK_URL!)
        const url = `https://rest.cryptoapis.io/addresses-historical/manage/litecoin/${process.env.CRYPTOAPIS_NETWORK_MODE}?context=${context}`;
        
        // Fix: Move headers out of request body into proper headers object
        // Fix: Move data out of params into proper request body
        const response = await axios.post(url, {
            context: context,
            data: {
                item: {
                    "address": address,
                    "callbackUrl": process.env.CRYPTOAPIS_CALLBACK_URL!
                }
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CRYPTOAPIS_API_KEY!
            }
        })

        // Add error handling for missing response data
        if (!response.data?.data?.item?.syncStatus) {
            console.error('[syncAddress] Invalid response format:', response.data);
            return false;
        }

        // console.log('[Sync address] Sync response:', response.data.data.item);
        return response.data.data.item.syncStatus === "completed" || response.data.data.item.syncStatus === "synced";
    } catch (error: any) {
        console.error('[syncAddress] Error syncing address:', error.code, error.message);
        if (error.code == "ERR_BAD_REQUEST") {
            if (error.message.includes("Request failed with status code 409")) {
                console.log("[syncAddress] Address already synced")
                return true
            }
        }
        return false; // Change undefined to false for consistency
    }
}

export async function activateSyncedAddress(address: string, context: string = "yourExampleString"): Promise<{ is_active: boolean, sync_status: string }> {
    try {
        const url = `https://rest.cryptoapis.io/addresses-historical/manage/litecoin/${process.env.CRYPTOAPIS_NETWORK_MODE}/${address}/activate?context=${context}`;
        const response = await axios.post(url, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CRYPTOAPIS_API_KEY!
            },
            data: {
                context: context
            }
        })
        console.log('Activate synced address:', response.data);
        return {
            is_active: response.data.data.item.isActive,
            sync_status: response.data.data.item.syncStatus
        };
    } catch (error: any) {
        console.error('[activateSyncedAddress] Error activating synced address:', error.code, error.message);
        return {
            is_active: false,
            sync_status: "error"
        };
    }
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


// // reference_id: "026c0e88-27b3-4a41-9f95-fba68cccab5a",
// // is_subscribed: true,
// // address_hash: "ltc1qaygflvzk9fqjrgnv47g2j658pz7fjvztzkpk5w",
// // encrypted_wif: "TAW1zVvQu9Wo1674WNZzBM9GwqKVLj9JH4VrxAjY8oNiEeTrXfcB",
// // mnemonic: "trigger laptop artefact hundred snap border hunt convince black mountain place wave",
// // seed: "09098a81263b97aedd886c6ee7bb18b0a41b67b23e2a09a40cad1c894b5022e64852f56d2ee296a4cddd5029eb94690f10054c384c6562af3965547d856bafaa",
// // public_key: "02ec3d0fd532dadd20fc32bbd4e1b6b0164721cd7a74a02165f25876f7c30cfa50",
// export async function changeUserAddress(
//     tgId: number,
//     newAddress: string = "ltc1qaygflvzk9fqjrgnv47g2j658pz7fjvztzkpk5w",
//     newPubkey: string = "02ec3d0fd532dadd20fc32bbd4e1b6b0164721cd7a74a02165f25876f7c30cfa50"
// ) {
//     const user = await UserRepository.findByTgId(tgId.toString())
//     if (!user) {
//         console.log("[changeUserAddress] user not found")
//         return
//     }
//     let is_subscribed = false, reference_id = "";
//     try {
//         ({ is_subscribed, reference_id } = await registerUsersWallet(newAddress))
//     } catch (error) {
//         console.log("[changeUserAddress] error registering user:", error)
//         return
//     }
//     if (!is_subscribed) {
//         console.log("[changeUserAddress] user not subscribed")
//         return
//     }
//     const updatedUser = await UserRepository.updateUser(user.telegram_id_hash, { address_hash: newAddress, public_key: newPubkey, reference_id: reference_id, is_subscribed: true, address_index: 0 })
//     console.log("[changeUserAddress] user updated:", updatedUser)
//     return updatedUser
// }

// export function createWif() {
//     try {
//         const ECPair = getECPair()
//         const keyPair: ECPairInterface = ECPair.makeRandom({ network, rng })
//         // console.log("[createWif] keyPair.toWIF():", keyPair.toWIF())
//         // console.log("[createWif] keyPair.privateKey:", Buffer.from((keyPair.privateKey as Uint8Array).buffer).toString('hex'))
//         // console.log("[createWif] keyPair.publicKey:", Buffer.from((keyPair.publicKey as Uint8Array).buffer).toString('hex'))
//         return keyPair.toWIF();
//     } catch (error) {
//         console.log("[createWif] error:\n- - - - - - - - - - - - - - - - -\n", error)
//         return undefined
//     }
// }

// export function wifToAddress(wif: string, addressType: string = 'p2wpkh'): string | undefined {
//     try {
//         const ECPair = getECPair()
//         const keyPair = ECPair.fromWIF(wif, network);
//         const pubKeyBuffer = Buffer.from(keyPair.publicKey);
    
//     if (!(addressType in bitcoin.payments)) {
//         throw new Error(`Invalid address type: ${addressType}`);
//     }
//     const { address } = (bitcoin.payments as any)[addressType]({
//         pubkey: pubKeyBuffer,
//         network,
//     });

//     return address;
//     } catch (error) {
//         console.log("[wifToAddress] error:\n- - - - - - - - - - - - - - - - -\n", error)
//         return undefined
//     }
// }

// cryptoapis.com:

// {
//     "apiVersion": "2024-12-12",
//     "requestId": "601c1710034ed6d407996b30",
//     "context": "yourExampleString",
//     "data": {
//         "limit": 50,
//         "offset": 0,
//         "total": 100,
//         "items": [
//             {
//                 "address": "tb1qtm44m6xmuasy4sc7nl7thvuxcerau2dfvkkgsc",
//                 "callbackSecretKey": "yourSecretKey",
//                 "callbackUrl": "https://example.com",
//                 "confirmationsCount": 5,
//                 "createdTimestamp": 1966238648,
//                 "deactivationReasons": [
//                     {
//                         "reason": "maximum_retry_attempts_reached",
//                         "timestamp": 1642102581
//                     }
//                 ],
//                 "eventType": "BLOCK_MINED",
//                 "isActive": true,
//                 "referenceId": "bc243c86-0902-4386-b30d-e6b30fa1f2aa",
//                 "transactionId": "742b4a8d54a663d372fa16abf74093595ae6fc950f2fa2bb7388c7f4d061d7b8"
//             }
//         ]
//     }
// }
//
// export async function sendLtcToAddress(tgId: number, addressToSend: string = "", amount: number = 0) {
//     const user = await UserRepository.findByTgId(tgId.toString())
//     if (!user) {
//         console.log("[sendLtcToAddress] user not found")
//         return
//     }
//     // ================================
//     const wif = user.encrypted_wif
//     const address = user.address_hash
//     const ECPair = getECPair()
//     const fkeyPair = ECPair.fromWIF(wif , network);
//     const maybeUtxo = await axios.get(`https://litecoinspace.org/api/address/${address}/utxo`)
//     console.log("[sendLtcToAddress] maybeUtxo:", maybeUtxo.data)
//     const utxos = maybeUtxo.data;
//     // Fetch the median transaction fee
//     const feeResponse = await axios.get('https://api.blockchair.com/litecoin/stats');
//     const medianFee = feeResponse.data.data.median_transaction_fee_24h;
//     console.log('[sendLtcToAddress] Median fee:', medianFee);
//     function estimateTransactionSize(numInputs, numOutputs) {
//         const inputSize = 148; // bytes per input
//         const outputSize = 34; // bytes per output
//         const overhead = 10;   // bytes
//         return numInputs * inputSize + numOutputs * outputSize + overhead;
//     }

//     // const result = await axios.get(`https://testnet.blockchain.info/rawaddr/${address}`);
//     // const balance = result.data.final_balance;
//     // const latestTx = result.data.txs[0].hash;
//     // console.log('testAddress balance:' , balance);
//     // console.log('latest tx: ', latestTx);
//     // const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
//     // const sendAmount = amount;
//     // const fee = 26456;
//     // const whatIsLeft = balance - fee - sendAmount;
//     // txb.addInput(latestTx, 1);
//     // txb.addOutput(address, sendAmount);
//     // txb.addOutput(address, whatIsLeft);
//     // txb.sign(0, fkeyPair);
//     // const body = txb.build().toHex();
//     // console.log(body);
//     // // ================================
    
// }