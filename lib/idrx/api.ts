import { createIDRXSignature } from './signature';
import { IDRXRedeemRequest, IDRXRedeemResponse } from './types';

const IDRX_API_URL = process.env.IDRX_API_URL!;
const IDRX_API_KEY = process.env.IDRX_API_KEY!;
const IDRX_SECRET_KEY = process.env.IDRX_SECRET_KEY!;

export class IDRXApiClient {
    /**
     * Submit redeem request to IDRX.org
     */
    async submitRedeemRequest(
        request: IDRXRedeemRequest
    ): Promise<IDRXRedeemResponse> {
        const path = '/transaction/redeem-request';
        const url = `${IDRX_API_URL}${path}`;

        // Prepare request body
        const body = JSON.stringify(request);
        const timestamp = Math.round(Date.now()).toString();

        // Create signature
        const signature = createIDRXSignature(
            'POST',
            path,
            Buffer.from(body).toString('base64'),
            timestamp,
            IDRX_SECRET_KEY
        );

        // Make request
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'idrx-api-key': IDRX_API_KEY,
                'idrx-api-sig': signature,
                'idrx-api-ts': timestamp,
            },
            body,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`IDRX API Error: ${error.message || response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get transaction history
     */
    async getTransactionHistory(walletAddress: string) {
        const path = '/api/transaction/user/transaction-history';
        const url = `${IDRX_API_URL}${path}?walletAddress=${walletAddress}`;
        const timestamp = Math.round(Date.now()).toString();

        // Create signature for GET request
        const signature = createIDRXSignature(
            'GET',
            path,
            '',
            timestamp,
            IDRX_SECRET_KEY
        );

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'idrx-api-key': IDRX_API_KEY,
                'idrx-api-sig': signature,
                'idrx-api-ts': timestamp,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`IDRX API Error: ${error.message || response.statusText}`);
        }

        return response.json();
    }
}

export const idrxClient = new IDRXApiClient();
