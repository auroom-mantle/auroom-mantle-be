import { IDRXApiClient } from './api';
import { MockIDRXClient } from './mock-client';

/**
 * Factory to create the appropriate IDRX client based on environment
 */
export function createIDRXClient() {
    const mode = process.env.IDRX_MODE || 'demo';

    if (mode === 'production') {
        console.log('[IDRX] 🚀 Using PRODUCTION mode - Real API calls');
        return new IDRXApiClient();
    } else {
        console.log('[IDRX] 🎭 Using DEMO mode - Mock API responses');
        return new MockIDRXClient();
    }
}

/**
 * Get current IDRX mode
 */
export function getIDRXMode(): 'demo' | 'production' {
    return (process.env.IDRX_MODE || 'demo') as 'demo' | 'production';
}

/**
 * Check if currently in demo mode
 */
export function isDemoMode(): boolean {
    return getIDRXMode() === 'demo';
}

// Export singleton instance
export const idrxClient = createIDRXClient();
