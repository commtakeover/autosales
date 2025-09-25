import axios from "axios";

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











// CHANGE ADDRESS - false
// {
//     "address": "ltc1q437v797setk0g688a9y9hmntamp9gll78n0n8j",
//     "index": 0
//   },
//   {
//     "address": "ltc1qvd6jsj96ke27txcncqh2dfgdlp6swzdkgp70q2",
//     "index": 1
//   },
//   {
//     "address": "ltc1qe7k852np24n9p98vzkvk6z7qswttz0d5erld49",
//     "index": 2
//   },
//   {
//     "address": "ltc1qtcemey35tzt6fcmf4j0h60hsz7nkwrfc6w0qkh",
//     "index": 3
//   },
//   {
//     "address": "ltc1q9zcx6jl6fxn4yj6df326kslg285cp99klh83fg",
//     "index": 4
//   },