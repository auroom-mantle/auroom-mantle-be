import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/idrx/client-factory';
import { isValidAddress, isValidAmount, isValidBankAccount, isValidBankCode } from '@/lib/utils/validation';
import { ValidationError } from '@/lib/utils/errors';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            amount,
            bankAccount,
            bankCode,
            bankName,
            bankAccountName,
            walletAddress,
        } = body;

        // Validate required fields
        if (!amount || !bankAccount || !walletAddress) {
            throw new ValidationError('Missing required fields');
        }

        // Validate wallet address
        if (!isValidAddress(walletAddress)) {
            throw new ValidationError('Invalid wallet address');
        }

        // Validate bank account
        if (!isValidBankAccount(bankAccount)) {
            throw new ValidationError('Invalid bank account number');
        }

        // Validate bank code
        if (bankCode && !isValidBankCode(bankCode)) {
            throw new ValidationError('Invalid bank code');
        }

        // Validate amount
        if (!isValidAmount(amount)) {
            throw new ValidationError('Invalid amount');
        }

        // Verify IDRX transfer to treasury (check transaction)
        // This should be done by checking the smart contract event
        // or verifying the transfer transaction

        // Store in queue (can use Vercel KV or database)
        // For MVP, the smart contract event is the queue

        const demoMode = isDemoMode();

        return NextResponse.json({
            success: true,
            message: demoMode
                ? '✅ DEMO MODE: Redeem request queued (simulated). Treasury will process within 24 hours.'
                : 'Redeem request queued. Treasury will process within 24 hours.',
            estimatedProcessingTime: '24 hours',
            isDemoMode: demoMode,
            data: {
                walletAddress,
                amount,
                bankAccount: `***${bankAccount.slice(-4)}`, // Masked for privacy
                bankName,
                status: 'PENDING',
            },
        });

    } catch (error: any) {
        console.error('Treasury-assisted redeem error:', error);

        if (error instanceof ValidationError) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
