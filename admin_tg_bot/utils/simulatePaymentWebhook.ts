import "reflect-metadata";
import { AppDataSource } from "../../db/data-source";
import { UserRepository } from "../../db/repositories/UserRepository";

/**
 * Generates a random LTC amount between 0.38 and 1.84
 */
function generateRandomLtcAmount(): number {
    const min = 0.38;
    const max = 1.84;
    return Math.random() * (max - min) + min;
}

/**
 * Generates a random idempotency key
 */
function generateIdempotencyKey(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Generates a random transaction hash
 */
function generateTxHash(): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 64; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Simulates a third party POST call to localhost:3001 webhook for payment received
 */
export async function simulatePaymentWebhook(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
        // Initialize database connection if not already initialized
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log("Database connection initialized");
        }

        // Get all users from the database
        const users = await UserRepository.findAllUsers();
        
        if (users.length === 0) {
            return {
                success: false,
                message: "❌ Пользователи не найдены в базе данных"
            };
        }

        // Select a random user
        const randomUser = users[Math.floor(Math.random() * users.length)];
        console.log(`Selected random user: ID ${randomUser!.id}, Address: ${randomUser!.address_hash}`);

        // Generate random payment data
        const ltcAmount = generateRandomLtcAmount();
        const idempotencyKey = generateIdempotencyKey();
        const txHash = generateTxHash();

        // Prepare the webhook payload
        const webhookPayload = {
            data: {
                item: {
                    amount: ltcAmount,
                    direction: "incoming",
                    address: randomUser!.address_hash,
                    tx: txHash
                },
                idempotencyKey: idempotencyKey
            }
        };

        console.log("Webhook payload:", JSON.stringify(webhookPayload, null, 2));

        // Send POST request to localhost:3001
        const response = await fetch("http://localhost:3001/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(webhookPayload),
        });

        if (response.ok) {
            const successMessage = `✅ Симуляция пополнения выполнена успешно!\n\n` +
                `👤 Пользователь ID: ${randomUser!.id}\n` +
                `📧 ТГ ID: ${randomUser!.telegram_id_hash}\n` +
                `🏦 Адрес: ${randomUser!.address_hash}\n\n` +
                `💰 Сумма: ${ltcAmount.toFixed(8)} LTC\n` +
                `💵 В USD: ~$${(ltcAmount * 118).toFixed(2)}\n\n` +
                `🔑 Idempotency Key: ${idempotencyKey}\n` +
                `🔗 TX Hash: ${txHash.substring(0, 16)}...`;

            console.log("✅ Webhook sent successfully!");
            console.log(`📊 Simulated payment: ${ltcAmount.toFixed(8)} LTC (~$${(ltcAmount * 118).toFixed(2)} USD)`);
            
            return {
                success: true,
                message: successMessage,
                data: {
                    user: randomUser,
                    ltcAmount,
                    usdAmount: ltcAmount * 118,
                    idempotencyKey,
                    txHash
                }
            };
        } else {
            const errorMessage = `❌ Ошибка отправки webhook: ${response.status} ${response.statusText}`;
            console.error("❌ Failed to send webhook:", response.status, response.statusText);
            
            return {
                success: false,
                message: errorMessage
            };
        }

    } catch (error) {
        const errorMessage = `❌ Ошибка симуляции: ${error instanceof Error ? error.message : String(error)}`;
        console.error("Error simulating payment webhook:", error);
        
        return {
            success: false,
            message: errorMessage
        };
    }
}
