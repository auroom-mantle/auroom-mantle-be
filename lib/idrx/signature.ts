import crypto from 'crypto';

/**
 * Create HMAC signature for IDRX API requests
 * Based on: https://docs.idrx.co/integration/processing-redeem-idrx-requests.md
 */
export function createIDRXSignature(
    method: 'GET' | 'POST',
    path: string,
    body: string,
    timestamp: string,
    secretKey: string
): string {
    // Create signature string: METHOD + PATH + BODY + TIMESTAMP
    const signatureString = `${method}${path}${body}${timestamp}`;

    // Create HMAC SHA256 signature
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(signatureString);

    return hmac.digest('hex');
}

/**
 * Hash bank account number for privacy
 */
export function hashBankAccount(bankName: string, accountNumber: string): string {
    const accountString = `${bankName}_${accountNumber}`;
    return crypto.createHash('sha256').update(accountString).digest('hex');
}
