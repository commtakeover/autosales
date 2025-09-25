import axios, { AxiosError } from "axios";
import { UserRepository } from "../../../db/repositories/UserRepository";

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

        if (!userReferenceId) {
            return false
        }

        const baseUrl = 'https://rest.cryptoapis.io/blockchain-events/litecoin';
        const url = `${baseUrl}/${process.env.CRYPTOAPIS_NETWORK_MODE}/${userReferenceId}?context=${context}`;
        console.log("[isAddressSubscribed] url:\n", url)
        
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CRYPTOAPIS_API_KEY
            }
        })
        console.log("[isAddressSubscribed] response.data:\n", response.data)
        return response.data;
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
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CRYPTOAPIS_API_KEY
            },
            body: JSON.stringify({
                "context": context
            })
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