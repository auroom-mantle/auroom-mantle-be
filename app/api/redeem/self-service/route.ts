import { NextRequest, NextResponse } from 'next/server';
import { idrxClient, isDemoMode } from '@/lib/idrx/client-factory';
import { updateRedeemStatus } from '@/lib/blockchain/contract';
import { isValidAddress, isValidAmount, isValidBankAccount, isValidBankCode } from '@/lib/utils/validation';
import { ValidationError } from '@/lib/utils/errors';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            txHash,           // Burn transaction hash (user already burned)
            amount,
            bankAccount,
            bankCode,
            bankName,
            bankAccountName,
            walletAddress,
            requestId,        // From smart contract
        } = body;

        // Validate required fields
        if (!txHash || !amount || !bankAccount || !walletAddress) {
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

        // Check amount limit for self-service (250M IDR)
        const amountNum = parseInt(amount);
        const demoMode = isDemoMode();

        if (!demoMode && amountNum > 250_000_000) {
            return NextResponse.json(
                { error: 'Amount exceeds self-service limit. Use treasury-assisted mode.' },
                { status: 400 }
            );
        }

        // Submit to IDRX API
        const idrxResponse = await idrxClient.submitRedeemRequest({
            txHash,
            networkChainId: process.env.NETWORK_CHAIN_ID!,
            amountTransfer: amount,
            bankAccount,
            bankCode,
            bankName,
            bankAccountName,
            walletAddress,
        });


        // Update status on-chain if requestId is provided (skip in demo mode)
        if (requestId && !demoMode) {
            await updateRedeemStatus(
                BigInt(requestId),
                1, // PROCESSING
                txHash,
                idrxResponse.data.custRefNumber
            );
        }

        return NextResponse.json({
            success: true,
            data: idrxResponse.data,
            message: demoMode
                ? '✅ DEMO MODE: Redeem request simulated successfully'
                : 'Redeem request submitted successfully',
            isDemoMode: demoMode,
        });

    } catch (error: any) {
        console.error('Self-service redeem error:', error);

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
