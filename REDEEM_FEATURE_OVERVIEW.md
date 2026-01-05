# AuRoom Redeem Feature - Complete Overview

## 📋 Executive Summary

This document provides a high-level overview of the **IDRX → IDR Fiat Redeem Feature** for AuRoom Protocol. This feature allows users to instantly convert their borrowed IDRX stablecoin into Indonesian Rupiah (IDR) in their bank accounts.

---

## 🎯 Problem Statement

Currently, users who borrow IDRX from BorrowingProtocolV2 must:
1. Manually convert IDRX to IDR themselves
2. Navigate to IDRX.org separately
3. Complete the redeem process independently

This creates friction and reduces the "instant cash loan" value proposition.

---

## 💡 Solution: Hybrid Redeem Approach

We implement a **two-mode system** that balances speed, security, and user control:

### Mode 1: Self-Service (Instant)
- **Target**: Users needing ≤ 250M IDR
- **Process**: User burns IDRX → Backend forwards to IDRX API
- **Speed**: Real-time (< 24 hours, usually < 1 hour)
- **Control**: User maintains full control

### Mode 2: Treasury-Assisted (White-Glove)
- **Target**: Users needing > 250M IDR or preferring assistance
- **Process**: User transfers IDRX to treasury → Treasury handles everything
- **Speed**: Within 24 hours (office hours for large amounts)
- **Control**: Treasury manages the process

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     User Interface (Next.js)                  │
│  ┌────────────────┐         ┌──────────────────────────┐    │
│  │  Cash Loan     │────────▶│  Redeem Modal            │    │
│  │  Page          │         │  - Mode Selection        │    │
│  └────────────────┘         │  - Bank Details Form     │    │
│                              │  - Status Tracking       │    │
│                              └──────────────────────────┘    │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              Backend API (Vercel Serverless)                  │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │  /api/redeem/        │    │  Cron Job (Every 5min)   │   │
│  │  - self-service      │    │  Process treasury queue  │   │
│  │  - treasury-assisted │    │  Burn IDRX + Call API    │   │
│  │  - status            │    │  Update contract         │   │
│  └──────────────────────┘    └──────────────────────────┘   │
└────────────────────┬─────────────────────┬───────────────────┘
                     │                     │
        ┌────────────┴──────────┐         │
        ▼                       ▼         ▼
┌───────────────┐    ┌──────────────────────────┐
│  IDRX.org API │    │  Smart Contract          │
│               │    │  (Lisk Sepolia)          │
│  - Burn IDRX  │    │  - Track redeem requests │
│  - Redeem     │    │  - Update status         │
│  - Transfer   │    │  - Store bank accounts   │
└───────┬───────┘    └──────────────────────────┘
        │
        ▼
┌───────────────┐
│  User's Bank  │
│  Account      │
└───────────────┘
```

---

## 📊 User Flow Comparison

### Self-Service Flow
```
1. User clicks "Redeem to Bank" in Cash Loan page
2. Selects "Self-Service" mode
3. Enters amount (≤ 250M IDR) and bank details
4. Wallet prompts: "Burn IDRX" transaction
5. User confirms burn
6. Backend receives burn txHash
7. Backend calls IDRX API with signature
8. IDRX processes and transfers IDR to bank
9. User receives IDR (< 24 hours)
```

### Treasury-Assisted Flow
```
1. User clicks "Redeem to Bank" in Cash Loan page
2. Selects "Treasury-Assisted" mode
3. Enters amount (any) and bank details
4. Wallet prompts: "Transfer IDRX to Treasury"
5. User confirms transfer
6. Request queued in smart contract
7. Treasury bot (cron) picks up request
8. Bot burns IDRX and calls IDRX API
9. IDRX processes and transfers IDR to bank
10. User receives IDR (within 24 hours)
```

---

## 🔧 Technical Components

### 1. Smart Contract Updates
**File**: `BorrowingProtocolV2.sol`

**New Features**:
- Bank account registration (KYC-linked)
- Redeem request tracking (on-chain)
- Status updates (PENDING → PROCESSING → COMPLETED)
- Self-service limit enforcement (250M IDR)

**See**: [SMART_CONTRACT_UPDATES.md](./SMART_CONTRACT_UPDATES.md)

### 2. Backend API (Vercel)
**Stack**: Next.js API Routes + TypeScript

**Endpoints**:
- `POST /api/redeem/self-service` - Forward burn to IDRX API
- `POST /api/redeem/treasury-assisted` - Queue request
- `GET /api/redeem/status/:id` - Check status
- `GET /api/cron/treasury-bot` - Process queue (cron)

**See**: [BACKEND_IMPLEMENTATION_GUIDE.md](./BACKEND_IMPLEMENTATION_GUIDE.md)

### 3. Frontend Integration
**Stack**: Next.js + wagmi + viem

**Components**:
- `RedeemModal` - Main redeem interface
- `RedeemHistory` - Track past requests
- `useRedeemContract` - Contract interaction hook
- `useIDRXToken` - IDRX burn hook

**See**: [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)

---

## 💰 Cost Analysis

### Free Tier Resources (Vercel)
- ✅ Unlimited API requests
- ✅ 100GB bandwidth/month
- ✅ Vercel Postgres (free tier)
- ✅ Cron jobs (unlimited)
- ✅ Edge functions

**Total Cost**: $0/month for MVP

### Gas Costs (Lisk Sepolia)
- Burn IDRX: ~50,000 gas
- Request redeem: ~120,000 gas
- Update status: ~60,000 gas

**Total per redeem**: ~$0.01 - $0.05 USD

---

## 🔒 Security Considerations

### 1. API Key Protection
- ✅ IDRX API key stored in Vercel env vars
- ✅ Never exposed to frontend
- ✅ Backend acts as secure proxy

### 2. Bank Account Verification
- ✅ Admin-only bank account registration
- ✅ KYC name must match bank account name
- ✅ On-chain verification status

### 3. Amount Limits
- ✅ Self-service capped at 250M IDR
- ✅ Prevents large unauthorized transfers
- ✅ Treasury oversight for large amounts

### 4. Smart Contract Security
- ✅ ReentrancyGuard on all state-changing functions
- ✅ Admin-only privileged functions
- ✅ Input validation on all parameters

---

## 📈 Scalability

### Current Capacity
- **Self-Service**: Unlimited (instant processing)
- **Treasury-Assisted**: Limited by cron frequency (every 5 min)

### Scaling Options
1. **Increase cron frequency** (every 1 min)
2. **Add multiple treasury wallets** (parallel processing)
3. **Implement webhook** from IDRX for instant updates
4. **Add queue system** (BullMQ + Redis)

---

## 🧪 Testing Strategy

### Unit Tests
- IDRX signature generation
- Bank account hashing
- Amount validation
- Status transitions

### Integration Tests
- Self-service flow (end-to-end)
- Treasury-assisted flow (end-to-end)
- Cron job execution
- Error handling

### User Acceptance Testing
- Beta users test on testnet
- Collect feedback on UX
- Iterate on UI/flow

---

## 📅 Implementation Timeline

### Phase 1: MVP (Week 1-2)
- [ ] Update smart contract with redeem tracking
- [ ] Deploy contract to Lisk Sepolia
- [ ] Build backend API (Vercel)
- [ ] Create IDRX signature utility
- [ ] Deploy backend to Vercel

### Phase 2: Frontend (Week 2-3)
- [ ] Build RedeemModal component
- [ ] Integrate with backend API
- [ ] Add redeem history view
- [ ] Test on testnet

### Phase 3: Testing (Week 3-4)
- [ ] Internal testing
- [ ] Beta user testing
- [ ] Bug fixes and refinements
- [ ] Security audit (optional)

### Phase 4: Launch (Week 4)
- [ ] Deploy to mainnet
- [ ] Monitor initial transactions
- [ ] Gather user feedback
- [ ] Iterate based on feedback

---

## 🎯 Success Metrics

### User Metrics
- **Redeem completion rate**: > 95%
- **Average processing time**: < 2 hours (self-service)
- **User satisfaction**: > 4.5/5 stars

### Technical Metrics
- **API uptime**: > 99.9%
- **Transaction success rate**: > 98%
- **Average response time**: < 500ms

### Business Metrics
- **Redeem volume**: Track total IDR redeemed
- **Mode distribution**: Self-service vs Treasury-assisted
- **Repeat usage**: Users who redeem multiple times

---

## 🚀 Future Enhancements

### Short-term (1-3 months)
1. **Webhook integration** with IDRX for instant status updates
2. **Email/SMS notifications** when IDR is transferred
3. **Multi-bank support** with auto-detection
4. **Saved bank accounts** for repeat users

### Medium-term (3-6 months)
1. **Instant redeem** for verified users (< 1 hour guarantee)
2. **Batch processing** for treasury efficiency
3. **Analytics dashboard** for admins
4. **Automated KYC verification** integration

### Long-term (6-12 months)
1. **Multi-currency support** (USD, EUR, etc.)
2. **P2P redeem marketplace** (users trade IDRX for fiat)
3. **Redeem insurance** (guarantee fund for failed redeems)
4. **Mobile app** with biometric authentication

---

## 📚 Documentation Index

1. **[BACKEND_IMPLEMENTATION_GUIDE.md](./BACKEND_IMPLEMENTATION_GUIDE.md)**
   - Complete backend code with Vercel deployment
   - IDRX API integration
   - Treasury bot implementation

2. **[SMART_CONTRACT_UPDATES.md](./SMART_CONTRACT_UPDATES.md)**
   - Contract modifications needed
   - New functions and events
   - Deployment guide

3. **[FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)**
   - React hooks and components
   - UI/UX patterns
   - Testing checklist

---

## 🆘 Support & Resources

### Documentation
- [IDRX API Docs](https://docs.idrx.co/)
- [Vercel Docs](https://vercel.com/docs)
- [Viem Docs](https://viem.sh/)

### Contact
- Technical issues: Create GitHub issue
- Security concerns: Email security@auroom.io
- General questions: Discord community

---

## ✅ Quick Start Checklist

For Claude Sonnet implementing this:

- [ ] Read all 3 implementation guides
- [ ] Set up Vercel account (free tier)
- [ ] Get IDRX API credentials
- [ ] Deploy backend to Vercel
- [ ] Update smart contract (optional for MVP)
- [ ] Build frontend components
- [ ] Test on Lisk Sepolia testnet
- [ ] Deploy to production

**Estimated Time**: 2-3 days for experienced developer

---

## 📝 Notes

- This is a **hybrid approach** balancing decentralization and UX
- **Self-service mode** is fully decentralized (user burns own IDRX)
- **Treasury-assisted mode** is centralized but provides better UX for large amounts
- All code is production-ready and follows best practices
- Security has been prioritized throughout the design

---

**Last Updated**: 2026-01-05
**Version**: 1.0
**Status**: Ready for Implementation
