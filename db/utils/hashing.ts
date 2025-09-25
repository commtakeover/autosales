import * as crypto from 'crypto';

export function hashString(text: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(text);
    return hash.digest('hex');
}
