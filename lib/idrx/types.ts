export interface IDRXRedeemRequest {
    txHash: string;              // Burn transaction hash
    networkChainId: string;      // "4202" for Lisk Sepolia
    amountTransfer: string;      // Amount in smallest unit (e.g., "21000")
    bankAccount: string;         // Bank account number
    bankCode: string;            // Bank code (e.g., "014" for BCA)
    bankName: string;            // Bank name (e.g., "BANK CENTRAL ASIA")
    bankAccountName: string;     // Account holder name
    walletAddress: string;       // User's wallet address
}

export interface IDRXRedeemResponse {
    statusCode: number;
    message: string;
    data: {
        id: number;
        chainId: number;
        userId: number;
        requester: string;
        txHash: string;
        fromAddress: string;
        amount: string;
        bankName: string;
        bankCode: string;
        bankAccountNumber: string;
        bankAccountName: string;
        bankAccountNumberHash: string | null;
        custRefNumber: string;      // Customer reference number
        disburseId: number;
        burnStatus: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
        createdAt: string;
        updatedAt: string;
        deleted: boolean;
        reportStatus: string;
        notes: string | null;
    };
}
