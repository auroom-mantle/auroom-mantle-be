import { NextResponse } from 'next/server';
import { getIDRXMode, isDemoMode } from '@/lib/idrx/client-factory';

export async function GET() {
    const mode = getIDRXMode();
    const demoMode = isDemoMode();

    return NextResponse.json({
        status: 'ok',
        isDemoMode: demoMode,
        mode: mode,
        timestamp: new Date().toISOString(),
        features: {
            idrxApi: demoMode ? 'mock' : 'production',
            blockchain: process.env.MANTLE_SEPOLIA_RPC ? 'connected' : 'not configured',
            treasuryBot: process.env.CRON_SECRET ? 'enabled' : 'disabled',
        },
        config: {
            networkChainId: process.env.NETWORK_CHAIN_ID || '5003',
            demoProcessingDelay: process.env.DEMO_PROCESSING_DELAY || '2000',
            demoSuccessRate: process.env.DEMO_SUCCESS_RATE || '100',
        },
    });
}
