import { NextRequest, NextResponse } from 'next/server';
import { getRedeemRequest } from '@/lib/blockchain/contract';

export async function GET(
    req: NextRequest,
    { params }: { params: { requestId: string } }
) {
    try {
        const requestId = params.requestId;

        if (!requestId) {
            return NextResponse.json(
                { error: 'Request ID is required' },
                { status: 400 }
            );
        }

        // Get request details from smart contract
        const request = await getRedeemRequest(BigInt(requestId));

        // Map status codes to readable strings
        const statusMap = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
        const modeMap = ['SELF_SERVICE', 'TREASURY_ASSISTED'];

        return NextResponse.json({
            success: true,
            data: {
                requestId,
                user: request.user,
                amount: request.amount.toString(),
                status: statusMap[request.status] || 'UNKNOWN',
                mode: modeMap[request.mode] || 'UNKNOWN',
                txHashBurn: request.txHashBurn,
                txHashRedeem: request.txHashRedeem,
                timestamp: Number(request.timestamp),
                createdAt: new Date(Number(request.timestamp) * 1000).toISOString(),
            },
        });

    } catch (error: any) {
        console.error('Status check error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
