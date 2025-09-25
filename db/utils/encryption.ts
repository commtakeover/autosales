import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '!default-key-32chars-1234567890!';
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const keyBuffer = Buffer.from(ENCRYPTION_KEY);
    if (keyBuffer.length !== 32) {
        throw new Error(`Invalid ENCRYPTION_KEY length: expected 32 bytes, got ${keyBuffer.length}`);
    }
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const keyBuffer = Buffer.from(ENCRYPTION_KEY);
    if (keyBuffer.length !== 32) {
        throw new Error(`Invalid ENCRYPTION_KEY length: expected 32 bytes, got ${keyBuffer.length}`);
    }
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
