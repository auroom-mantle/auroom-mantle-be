/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate bank account number (Indonesian format)
 */
export function isValidBankAccount(accountNumber: string): boolean {
    // Indonesian bank accounts are typically 10-16 digits
    return /^\d{10,16}$/.test(accountNumber);
}

/**
 * Validate amount is positive and within limits
 */
export function isValidAmount(amount: string, min: number = 0, max?: number): boolean {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= min) return false;
    if (max !== undefined && num > max) return false;
    return true;
}

/**
 * Validate bank code (Indonesian bank codes are 3 digits)
 */
export function isValidBankCode(code: string): boolean {
    return /^\d{3}$/.test(code);
}
