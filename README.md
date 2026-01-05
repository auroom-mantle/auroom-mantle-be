# AuRoom Backend API

Backend API for AuRoom protocol to handle IDRX → IDR fiat redemption. Built with Next.js and deployed on Vercel.

## 🏗️ Architecture

This backend integrates with:
- **IDRX.org API** for processing redeem requests
- **BorrowingProtocolV2** smart contract on Lisk Sepolia
- **Treasury bot** (Vercel cron job) for automated processing

## 📁 Project Structure

```
auroom-lisk-be/
├── app/
│   └── api/
│       ├── redeem/
│       │   ├── self-service/route.ts       # Self-service redeem endpoint
│       │   ├── treasury-assisted/route.ts  # Treasury-assisted redeem endpoint
│       │   └── status/[requestId]/route.ts # Status check endpoint
│       └── cron/
│           └── treasury-bot/route.ts       # Treasury bot cron job
├── lib/
│   ├── idrx/
│   │   ├── signature.ts                    # HMAC signature utilities
│   │   ├── api.ts                          # IDRX API client
│   │   └── types.ts                        # TypeScript types
│   ├── blockchain/
│   │   ├── contract.ts                     # Smart contract integration
│   │   └── abi.ts                          # Contract ABI
│   └── utils/
│       ├── validation.ts                   # Input validation
│       └── errors.ts                       # Custom error classes
├── .env.example                            # Environment variables template
├── vercel.json                             # Vercel configuration
└── package.json                            # Dependencies
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `IDRX_API_KEY` - Your IDRX API key
- `IDRX_SECRET_KEY` - Your IDRX secret key
- `IDRX_API_URL` - IDRX API URL (https://idrx.co/api)
- `LISK_SEPOLIA_RPC` - Lisk Sepolia RPC URL
- `BORROWING_PROTOCOL_ADDRESS` - BorrowingProtocolV2 contract address
- `TREASURY_PRIVATE_KEY` - Treasury wallet private key
- `IDRX_TOKEN_ADDRESS` - IDRX token address on Lisk Sepolia
- `CRON_SECRET` - Secret for cron job authentication
- `NETWORK_CHAIN_ID` - Network chain ID (4202 for Lisk Sepolia)

### 3. Run Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

## 📡 API Endpoints

### POST /api/redeem/self-service

Submit a self-service redeem request (≤250M IDR).

**Request Body:**
```json
{
  "txHash": "0x...",
  "amount": "21000",
  "bankAccount": "7255759001",
  "bankCode": "014",
  "bankName": "BANK CENTRAL ASIA",
  "bankAccountName": "JOHN DOE",
  "walletAddress": "0x...",
  "requestId": "1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "custRefNumber": "REF123456",
    "burnStatus": "PROCESSING"
  },
  "message": "Redeem request submitted successfully"
}
```

### POST /api/redeem/treasury-assisted

Submit a treasury-assisted redeem request (>250M IDR).

**Request Body:**
```json
{
  "amount": "300000000",
  "bankAccount": "7255759001",
  "bankCode": "014",
  "bankName": "BANK CENTRAL ASIA",
  "bankAccountName": "JOHN DOE",
  "walletAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Redeem request queued. Treasury will process within 24 hours.",
  "estimatedProcessingTime": "24 hours"
}
```

### GET /api/redeem/status/[requestId]

Check the status of a redeem request.

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "1",
    "user": "0x...",
    "amount": "21000",
    "status": "COMPLETED",
    "mode": "SELF_SERVICE",
    "txHashBurn": "0x...",
    "txHashRedeem": "REF123456",
    "timestamp": 1704499200,
    "createdAt": "2024-01-06T00:00:00.000Z"
  }
}
```

### GET /api/cron/treasury-bot

Treasury bot cron job (runs every 5 minutes via Vercel Cron).

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "processed": 3,
  "results": [
    {
      "requestId": "1",
      "status": "COMPLETED",
      "txHash": "0x..."
    }
  ],
  "timestamp": "2024-01-06T00:00:00.000Z"
}
```

## 🔧 Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

```bash
vercel --prod
```

### 4. Set Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add all required environment variables from `.env.example`.

Or use CLI:

```bash
vercel env add IDRX_API_KEY
vercel env add IDRX_SECRET_KEY
vercel env add TREASURY_PRIVATE_KEY
# ... etc
```

### 5. Verify Cron Job

Go to Vercel Dashboard → Your Project → Settings → Cron Jobs to verify the treasury bot cron job is configured (from `vercel.json`).

## 🧪 Testing

### Test Self-Service Endpoint

```bash
curl -X POST http://localhost:3000/api/redeem/self-service \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "0x123...",
    "amount": "21000",
    "bankAccount": "7255759001",
    "bankCode": "014",
    "bankName": "BANK CENTRAL ASIA",
    "bankAccountName": "JOHN DOE",
    "walletAddress": "0xabc...",
    "requestId": "1"
  }'
```

### Test Treasury-Assisted Endpoint

```bash
curl -X POST http://localhost:3000/api/redeem/treasury-assisted \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "300000000",
    "bankAccount": "7255759001",
    "bankCode": "014",
    "bankName": "BANK CENTRAL ASIA",
    "bankAccountName": "JOHN DOE",
    "walletAddress": "0xabc..."
  }'
```

### Test Status Endpoint

```bash
curl http://localhost:3000/api/redeem/status/1
```

### Test Treasury Bot (Local)

```bash
curl http://localhost:3000/api/cron/treasury-bot \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 🔒 Security

- All API keys and secrets are stored in environment variables
- Treasury private key is never exposed to frontend
- Bank account information is hashed for privacy
- Cron job requires authentication via `CRON_SECRET`
- Input validation on all endpoints
- Rate limiting should be implemented (use Vercel Edge Config or Upstash)

## 📊 Status Codes

- `0` - PENDING
- `1` - PROCESSING
- `2` - COMPLETED
- `3` - FAILED

## 🆘 Troubleshooting

### IDRX API returns 401

- Check `IDRX_API_KEY` and `IDRX_SECRET_KEY` are correct
- Verify signature generation is working
- Check timestamp is current

### Transaction reverts

- Check treasury has enough IDRX
- Verify contract address is correct
- Check gas limits

### Cron job not running

- Verify `vercel.json` is deployed
- Check Vercel dashboard for cron logs
- Verify `CRON_SECRET` is set

## 📚 References

- [IDRX API Documentation](https://docs.idrx.co/integration/processing-redeem-idrx-requests.md)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Viem Documentation](https://viem.sh/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## 📄 License

MIT
