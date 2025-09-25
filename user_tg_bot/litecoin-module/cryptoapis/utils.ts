import axios from 'axios';

/**
 * Gets the current LTC price in USD from CryptoAPIs
 * @returns Promise<number> The current LTC price
 */
export async function getLtcPrice(): Promise<number> {
  try {
    const response = await axios.get('https://rest.cryptoapis.io/market-data/assets/by-symbol/LTC?context=yourExampleString', {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '599d92e650becd1c68bb91d92579c78e0d645f9a'
      }
    });

    return Number(response.data.data.item.latestRate.amount);
  } catch (error) {
    console.error('Error fetching LTC price:', error);
    throw error;
  }
}