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
        'x-api-key': `${process.env.CRYPTOAPIS_API_KEY}`
      }
    });

    return Number(response.data.data.item.latestRate.amount);
  } catch (error) {
    console.error('Error fetching LTC price:', error);
    throw error;
  }
}