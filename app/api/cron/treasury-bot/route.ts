import { NextRequest, NextResponse } from 'next/server';
import { getPendingRedeemRequests, burnIDRXFromTreasury, updateRedeemStatus } from '@/lib/blockchain/contract';
import { idrxClient } from '@/lib/idrx/api';
import { hashBankAccount } from '@/lib/idrx/signature';
import { UnauthorizedError } from '@/lib/utils/errors';

export async function GET(req: NextRequest) {
    try {
        // Verify cron secret (Vercel Cron sends this)
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            throw new UnauthorizedError();
        }

        console.log('[Treasury Bot] Starting redeem queue processing...');

        // Get pending treasury-assisted requests
        const pendingRequests = await getPendingRedeemRequests();

        console.log(`[Treasury Bot] Found ${pendingRequests.length} pending requests`);

        const results = [];

        for (const request of pendingRequests) {
            try {
                console.log(`[Treasury Bot] Processing request #${request.id}`);

                // 1. Burn IDRX from treasury
                const bankHash = hashBankAccount(
                    request.bankName || 'UNKNOWN',
                    request.bankAccount || '0000000000'
                );

                const burnReceipt = await burnIDRXFromTreasury(
                    BigInt(request.amount),
                    bankHash
                );

                console.log(`[Treasury Bot] Burned IDRX, tx: ${burnReceipt.transactionHash}`);

                // 2. Submit to IDRX API
                const idrxResponse = await idrxClient.submitRedeemRequest({
                    txHash: burnReceipt.transactionHash,
                    networkChainId: process.env.NETWORK_CHAIN_ID!,
                    amountTransfer: request.amount.toString(),
                    bankAccount: request.bankAccount,
                    bankCode: request.bankCode,
                    bankName: request.bankName,
                    bankAccountName: request.bankAccountName,
                    walletAddress: request.user,
                });

                console.log(`[Treasury Bot] IDRX API response:`, idrxResponse.data);

                // 3. Update status on-chain
                await updateRedeemStatus(
                    BigInt(request.id),
                    2, // COMPLETED
                    burnReceipt.transactionHash,
                    idrxResponse.data.custRefNumber
                );

                console.log(`[Treasury Bot] Request #${request.id} completed`);

                results.push({
                    requestId: request.id.toString(),
                    status: 'COMPLETED',
                    txHash: burnReceipt.transactionHash,
                });

            } catch (error: any) {
                console.error(`[Treasury Bot] Error processing request #${request.id}:`, error);

                // Mark as failed
                try {
                    await updateRedeemStatus(
                        BigInt(request.id),
                        3, // FAILED
                        '',
                        error.message
                    );
                } catch (updateError) {
                    console.error(`[Treasury Bot] Failed to update status for request #${request.id}:`, updateError);
                }

                results.push({
                    requestId: request.id.toString(),
                    status: 'FAILED',
                    error: error.message,
                });
            }
        }

        return NextResponse.json({
            success: true,
            processed: pendingRequests.length,
            results,
            timestamp: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('[Treasury Bot] Fatal error:', error);

        if (error instanceof UnauthorizedError) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
