import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { liskSepolia } from 'viem/chains';
import { BORROWING_PROTOCOL_ABI } from './abi';

const BORROWING_PROTOCOL_ADDRESS = (process.env.BORROWING_PROTOCOL_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY as `0x${string}` | undefined;
const IS_DEMO_MODE = process.env.IDRX_MODE === 'demo';

// Public client for reading
export const publicClient = createPublicClient({
    chain: liskSepolia,
    transport: http(process.env.LISK_SEPOLIA_RPC || 'https://rpc.sepolia-api.lisk.com'),
});

// Wallet client for writing (treasury) - only initialize if not in demo mode and key exists
let walletClient: ReturnType<typeof createWalletClient> | null = null;

if (!IS_DEMO_MODE && TREASURY_PRIVATE_KEY) {
    const treasuryAccount = privateKeyToAccount(TREASURY_PRIVATE_KEY);
    walletClient = createWalletClient({
        account: treasuryAccount,
        chain: liskSepolia,
        transport: http(process.env.LISK_SEPOLIA_RPC || 'https://rpc.sepolia-api.lisk.com'),
    });
}

export { walletClient };

/**
 * Update redeem status on-chain
 */
export async function updateRedeemStatus(
    requestId: bigint,
    status: number, // 0=PENDING, 1=PROCESSING, 2=COMPLETED, 3=FAILED
    txHashBurn: string,
    txHashRedeem: string
): Promise<any | null> {
    if (!walletClient) {
        console.warn('[Blockchain] Wallet client not initialized (demo mode or missing key). Skipping on-chain update.');
        return null;
    }

    const hash = await walletClient.writeContract({
        address: BORROWING_PROTOCOL_ADDRESS,
        abi: BORROWING_PROTOCOL_ABI,
        functionName: 'updateRedeemStatus',
        args: [requestId, status, txHashBurn, txHashRedeem],
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt;
}

/**
 * Get redeem request details from contract
 */
export async function getRedeemRequest(requestId: bigint) {
    const result = await publicClient.readContract({
        address: BORROWING_PROTOCOL_ADDRESS,
        abi: BORROWING_PROTOCOL_ABI,
        functionName: 'getRedeemRequest',
        args: [requestId],
    });

    return {
        user: result[0],
        amount: result[1],
        status: result[2],
        mode: result[3],
        txHashBurn: result[4],
        txHashRedeem: result[5],
        timestamp: result[6],
    };
}

/**
 * Get pending redeem requests from contract
 */
export async function getPendingRedeemRequests(): Promise<any[]> {
    // Read from contract events
    const logs = await publicClient.getContractEvents({
        address: BORROWING_PROTOCOL_ADDRESS,
        abi: BORROWING_PROTOCOL_ABI,
        eventName: 'RedeemRequested',
        fromBlock: 'earliest',
    });

    // Filter for pending treasury-assisted requests (mode=1, status=0)
    const pendingRequests = [];

    for (const log of logs) {
        const requestId = log.args.requestId!;
        const request = await getRedeemRequest(requestId);

        // Check if treasury-assisted (mode=1) and pending (status=0)
        if (request.mode === 1 && request.status === 0) {
            pendingRequests.push({
                id: requestId,
                user: request.user,
                amount: request.amount,
                timestamp: request.timestamp,
            });
        }
    }

    return pendingRequests;
}

/**
 * Burn IDRX from treasury wallet
 */
export async function burnIDRXFromTreasury(
    amount: bigint,
    bankAccountHash: string
) {
    if (!walletClient) {
        console.warn('[Blockchain] Wallet client not initialized (demo mode or missing key). Skipping burn.');
        return null;
    }

    const IDRX_ADDRESS = process.env.IDRX_TOKEN_ADDRESS! as `0x${string}`;

    const hash = await walletClient.writeContract({
        address: IDRX_ADDRESS,
        abi: parseAbi([
            'function burnWithAccountNumber(uint256 amount, string accountNumber) external'
        ]),
        functionName: 'burnWithAccountNumber',
        args: [amount, bankAccountHash],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt;
}
