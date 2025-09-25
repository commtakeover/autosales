import axios, { AxiosError } from "axios";
import { UserRepository } from "../../db/repositories/UserRepository";

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
                        receiveCallbackOn: 2
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
            // console.error("[registerUsersWallet - eventSubscription] ERROR - AXIOS:\n- - - - - - - - - - - - - - - - -\n", error.response?.data)
            if (error.response?.data.error.message.includes("The specified resource already exists")) {
                const subscriptions = await listSubscribedEvents()
                if (subscriptions!.data.items) {
                    for (const subscription of subscriptions!.data.items) {
                        if (subscription.address === userAddressHash) {
                            return { is_subscribed: true, reference_id: subscription.referenceId }
                        }
                    }
                }
                return { is_subscribed: false, reference_id: "" }
            }
        } else if (error instanceof Error && 'message' in error) {
            console.log("[registerUsersWallet - eventSubscription] ERROR message:\n- - - - - - - - - - - - - - - - -\n", error.message)
        }
        return { is_subscribed, reference_id }
    }
}

export async function listSubscribedEvents(limit: number = 50, offset: number = 0, context: string = "yourExampleString") {
    try {
        let allItems: any[] = [];
        let hasMore = true;
        let currentOffset = 0;

        while (hasMore) {
            const baseUrl = 'https://rest.cryptoapis.io/blockchain-events/litecoin';
            const params = new URLSearchParams({
                context: context,
                limit: limit.toString(),
                offset: currentOffset.toString()
            });
            const url = `${baseUrl}/${process.env.CRYPTOAPIS_NETWORK_MODE}?${params.toString()}`;
            
            const response = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.CRYPTOAPIS_API_KEY!
                }
            });
            
            const { data } = response.data;
            
            if (data.items && data.items.length > 0) {
                allItems = allItems.concat(data.items);
                currentOffset += limit;
                
                // Check if we've received all available items
                if (data.items.length < limit || allItems.length >= data.total) {
                    hasMore = false;
                }
            } else {
                hasMore = false;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const response = {
            apiVersion: "2024-12-12",
            requestId: "paginated-request",
            context: context,
            data: {
                limit: allItems.length,
                offset: 0,
                total: allItems.length,
                items: allItems
            }
        };
        // console.log("[listSubscribedEvents - eventSubscription] response:", response)
        return response
    } catch (error) {
        if (error instanceof AxiosError) {
            console.log("[listSubscribedEvents] error - AXIOS:\n- - - - - - - - - - - - - - - - -\n", error.response?.data)
        } else if (error instanceof Error && 'message' in error) {
            console.log("[listSubscribedEvents] error message:\n- - - - - - - - - - - - - - - - -\n", error.message)
        }
        return undefined
    }
}

export async function deleteSubscribedEvent(referenceId: string, context: string = "yourExampleString") {
    try {
        const baseUrl = 'https://rest.cryptoapis.io/blockchain-events/litecoin';
        const url = `${baseUrl}/${process.env.CRYPTOAPIS_NETWORK_MODE}/${referenceId}?context=${context}`;
        console.log("[deleteSubscribedEvent] url:", url)
        
        const response = await axios.delete(url, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CRYPTOAPIS_API_KEY!
            },
            data: JSON.stringify([])
        })
        // console.log("[deleteSubscribedEvent] response.data:", response.data)
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.log("[deleteSubscribedEvent] error - AXIOS:\n- - - - - - - - - - - - - - - - -\n", error.response?.data)
        } else if (error instanceof Error && 'message' in error) {
            console.log("[deleteSubscribedEvent] error message:\n- - - - - - - - - - - - - - - - -\n", error.message)
        }
        return undefined
    }
}

export async function isAddressSubscribed(address: string, context: string = "yourExampleString") {
    try {
        const userReferenceId = await UserRepository.getUserReferenceId(address)
        if (!userReferenceId) return false
        const baseUrl = 'https://rest.cryptoapis.io/blockchain-events/litecoin';
        const url = `${baseUrl}/${process.env.CRYPTOAPIS_NETWORK_MODE}/${userReferenceId}?context=${context}`;
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CRYPTOAPIS_API_KEY
            }
        })
        return response.data.item.isSubscribed;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.log("[isAddressSubscribed] error - AXIOS:\n- - - - - - - - - - - - - - - - -\n", error.response?.data)
        } else if (error instanceof Error && 'message' in error) {
            console.log("[isAddressSubscribed] error message:\n- - - - - - - - - - - - - - - - -\n", error.message)
        }
        return undefined
    }
}

export async function activateExistingEventSubscription(referenceId: string, context: string = "yourExampleString") {
    try {
        const baseUrl = 'https://rest.cryptoapis.io/blockchain-events/litecoin';
        const url = `${baseUrl}/${process.env.CRYPTOAPIS_NETWORK_MODE}/${referenceId}/activate?context=${context}`;
        // console.log("[activateExistingEventSubscription] url:", url)
        
        const response = await axios.post(url, {
            context: context
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CRYPTOAPIS_API_KEY!
            }
        })
        console.log("[activateExistingEventSubscription] response.data:", response.data)
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.log("[activateExistingEventSubscription] error - AXIOS:\n- - - - - - - - - - - - - - - - -\n", error.response?.data)
        } else if (error instanceof Error && 'message' in error) {
            console.log("[activateExistingEventSubscription] error message:\n- - - - - - - - - - - - - - - - -\n", error.message)
        }
        return undefined
    }
}

export async function checkXPub(xPubToCheck: string, context: string = "yourExampleString") {
    let hasMore = true;
    let limit = 10;
    let currentOffset = 0;
    while (hasMore) {
        try {
            const url = `https://rest.cryptoapis.io/hd-wallets/manage/litecoin/${process.env.CRYPTOAPIS_NETWORK_MODE}?context=${context}&limit=${limit}&offset=${currentOffset}`;
            const response = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.CRYPTOAPIS_API_KEY
                }
            })
            const data = response.data.data;
            console.log("[checkXPub] data:", data)
            const found = data.items.find((item: any) => item.xPub === xPubToCheck);
            if (found) {
                return found;
            }

            if (data.items.length < limit || currentOffset + data.items.length >= data.total) {
                hasMore = false;
            } else {
                currentOffset += limit;
                await new Promise(resolve => setTimeout(resolve, 250));
            }
        } catch (error) {
            console.error('[checkXPub] error:', error);
            return undefined;
        }
    }
    return undefined; // xPub not found
}

export async function activateXPub(xPubToActivate: string, context: string = "yourExampleString") {
    
}

// export async function syncXPub(xPubToSync: string, context: string = "yourExampleString") {
//     const url = 'https://rest.cryptoapis.io/hd-wallets/manage/litecoin/mainnet/xpub661MyMwAqRbcEotdQaQtfeZsd2RKwh2ZqdNCqu3mAV47yCywyGwgmiTRR6ECJop4BStkpwiVjaUwQWBKcpy5zUNQE5Fu4KRirTHBLjrBfDw/sync?context=yourExampleString';
//     fetch(url, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'x-api-key': '599d92e650becd1c68bb91d92579c78e0d645f9a'
//         }
//         body: JSON.stringify({
//         "context": "yourExampleString"
//     })
//     })
//     .then(response => response.json())
//     .then(data => {
//         console.log(data);
//     })
//     .catch(error => {
//         console.error('Error:', error);
//     });
// }

export async function listSyncedAddresses(xPubToSync: string, addressFormat: string = "p2wpkh", isChangeAddress: boolean = false, context: string = "yourExampleString") {
    const limit = 10;
    const offset = 0;
    const url = `https://rest.cryptoapis.io/hd-wallets/utxo/litecoin/${process.env.CRYPTOAPIS_NETWORK_MODE}/${xPubToSync}/addresses?context=${context}&addressFormat=${addressFormat}&isChangeAddress=${isChangeAddress}&limit=${limit}&offset=${offset}`;
    const response = await axios.get(url, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.CRYPTOAPIS_API_KEY
        }
    })
    const data = response.data.data;
    return data;
}

export async function getAddressAtIndex(indexToGet: number, context: string = "yourExampleString", addressFormat: string = "p2wpkh", isChangeAddress: boolean = false) {
    const url = `https://rest.cryptoapis.io/hd-wallets/utxo/litecoin/${process.env.CRYPTOAPIS_NETWORK_MODE}/${process.env.CRYPTOAPIS_XPUB}/addresses?context=${context}&addressFormat=${addressFormat}&isChangeAddress=${isChangeAddress}&limit=1&offset=${indexToGet}`;
    const response = await axios.get(url, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.CRYPTOAPIS_API_KEY
        }
    })
    const data = response.data.data;
    return data.items[0].index == indexToGet ? data.items[0].address : undefined;
}

export async function getAllAddressesSyncData() {
    try {
        const limit = 50;
        let offset = 0;
        const context = "yourExampleString";

        let hasMore = true;
        let startingAfter = "";
        let page = 0;

        let allAddresses: any[] = [];

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
                console.log("[getAllAddressesSyncData] error:", error.response?.data)
                return undefined
            }
            
            const syncedAddresses = response.data.data.items.map((item: any) => ({
                address: item.address,
                syncStatus: item.syncStatus, 
                isActive: item.isActive
            }));
            allAddresses = allAddresses.concat(syncedAddresses);

            hasMore = response.data.data.hasMore;
            startingAfter = response.data.data.nextStartingAfter;
            page++;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return allAddresses;
    } catch (error: any) {
        console.error('[getAllAddressesSyncData] Error getting all synced addresses:', error.code, error.message);
        return undefined;
    }
}

export async function syncAddress(address: string, context: string = "yourExampleString") {
    try {
        const url = `https://rest.cryptoapis.io/addresses-historical/manage/litecoin/${process.env.CRYPTOAPIS_NETWORK_MODE}?context=${context}`;
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

        console.log('[syncAddress] response:', response.data)

        // Add error handling for missing response data
        if (!response.data?.data?.item?.syncStatus) {
            console.error('[syncAddress] Invalid response format:', response.data);
            return false;
        }

        // console.log('[Sync address] Sync response:', response.data.data.item);
        return response.data.data.item.syncStatus === "completed" || response.data.data.item.syncStatus === "synced";
    } catch (error: any) {
        console.log('[syncAddress] error:', error)
        // console.error('[syncAddress] Error syncing address:', error.code, error.message);
        return false; // Change undefined to false for consistency
    }
}