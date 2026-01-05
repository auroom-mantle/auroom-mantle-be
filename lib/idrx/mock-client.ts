import { IDRXRedeemRequest, IDRXRedeemResponse } from './types';

/**
 * Mock IDRX API Client for Demo Mode
 * Simulates IDRX API responses without making real API calls
 */
export class MockIDRXClient {
    private requestCounter = 1000; // Start from 1000 for demo IDs

    /**
     * Simulate redeem request submission
     */
    async submitRedeemRequest(
        request: IDRXRedeemRequest
    ): Promise<IDRXRedeemResponse> {
        console.log('[MockIDRXClient] Simulating redeem request:', {
            amount: request.amountTransfer,
            bankName: request.bankName,
            walletAddress: request.walletAddress,
        });

        // Simulate network delay
        const delay = parseInt(process.env.DEMO_PROCESSING_DELAY || '2000');
        await this.sleep(delay);

        // Simulate success rate (for testing error handling)
        const successRate = parseInt(process.env.DEMO_SUCCESS_RATE || '100');
        const shouldSucceed = Math.random() * 100 < successRate;

        if (!shouldSucceed) {
            throw new Error('Demo: Simulated IDRX API error');
        }

        // Generate mock response
        const mockId = this.requestCounter++;
        const custRefNumber = this.generateCustRefNumber();

        console.log('[MockIDRXClient] Generated mock response:', {
            id: mockId,
            custRefNumber,
        });

        return {
            statusCode: 201,
            message: 'success',
            data: {
                id: mockId,
                chainId: parseInt(request.networkChainId),
                userId: 999, // Mock user ID
                requester: request.bankAccountName,
                txHash: request.txHash,
                fromAddress: request.walletAddress,
                amount: request.amountTransfer,
                bankName: request.bankName,
                bankCode: request.bankCode,
                bankAccountNumber: request.bankAccount,
                bankAccountName: request.bankAccountName,
                custRefNumber: custRefNumber,
                disburseId: mockId * 100,
                burnStatus: 'REQUESTED',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        };
    }

    /**
     * Simulate getting transaction history
     */
    async getTransactionHistory(walletAddress: string) {
        console.log('[MockIDRXClient] Fetching transaction history for:', walletAddress);
        await this.sleep(1000);

        return {
            statusCode: 200,
            message: 'success',
            data: [
                {
                    id: 1,
                    txHash: '0xdemo123456789abcdef',
                    amount: '100000',
                    status: 'COMPLETED',
                    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                },
                {
                    id: 2,
                    txHash: '0xdemo987654321fedcba',
                    amount: '50000',
                    status: 'PROCESSING',
                    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                },
            ],
        };
    }

    /**
     * Generate mock customer reference number
     */
    private generateCustRefNumber(): string {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `DEMO${timestamp}${random}`;
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const mockIdrxClient = new MockIDRXClient();
