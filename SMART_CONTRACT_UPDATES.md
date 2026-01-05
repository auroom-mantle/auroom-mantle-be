# Smart Contract Updates for Redeem Feature

## 📋 Overview

This document outlines the necessary updates to `BorrowingProtocolV2.sol` to support the hybrid redeem approach (self-service + treasury-assisted).

---

## 🔄 Changes Required

### Option 1: Minimal Changes (Recommended for MVP)

**No smart contract changes needed.** The redeem flow is entirely off-chain:

1. User borrows IDRX via `depositAndBorrow()` or `borrow()`
2. User burns IDRX via IDRX contract directly
3. Backend forwards burn txHash to IDRX API
4. IDRX transfers IDR to user's bank

**Pros:**
- No redeployment needed
- No audit required
- Faster to market

**Cons:**
- No on-chain audit trail for redeems
- Cannot track redeem status on-chain

---

### Option 2: On-Chain Tracking (Recommended for Production)

Add redeem tracking functionality to `BorrowingProtocolV2.sol`.

#### New Enums

```solidity
enum RedeemMode { SELF_SERVICE, TREASURY_ASSISTED }
enum RedeemStatus { PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED }
```

#### New Structs

```solidity
struct BankAccount {
    string bankName;
    string bankCode;
    string accountNumber;
    string accountName;
    bool verified;
    uint256 verifiedAt;
}

struct RedeemRequest {
    uint256 id;
    address user;
    uint256 amount;
    RedeemMode mode;
    RedeemStatus status;
    string txHashBurn;      // Hash from burn transaction
    string txHashRedeem;    // Reference from IDRX API
    uint256 requestedAt;
    uint256 processedAt;
}
```

#### New State Variables

```solidity
// User's verified bank account
mapping(address => BankAccount) public userBankAccount;

// Redeem requests
mapping(uint256 => RedeemRequest) public redeemRequests;
uint256 public redeemRequestCounter;

// Self-service limit (250M IDR with 6 decimals)
uint256 public constant SELF_SERVICE_LIMIT = 250_000_000e6;
```

#### New Events

```solidity
event BankAccountVerified(
    address indexed user,
    string bankName,
    string accountNumber
);

event RedeemRequested(
    uint256 indexed requestId,
    address indexed user,
    uint256 amount,
    RedeemMode mode
);

event RedeemProcessed(
    uint256 indexed requestId,
    string txHashBurn,
    string txHashRedeem
);

event RedeemCompleted(
    uint256 indexed requestId
);

event RedeemFailed(
    uint256 indexed requestId,
    string reason
);
```

#### New Functions

```solidity
/**
 * @notice Register/update user's bank account (admin only)
 * @dev Required for KYC compliance
 */
function registerBankAccount(
    address user,
    string memory bankName,
    string memory bankCode,
    string memory accountNumber,
    string memory accountName
) external onlyAdmin {
    userBankAccount[user] = BankAccount({
        bankName: bankName,
        bankCode: bankCode,
        accountNumber: accountNumber,
        accountName: accountName,
        verified: true,
        verifiedAt: block.timestamp
    });
    
    emit BankAccountVerified(user, bankName, accountNumber);
}

/**
 * @notice Request self-service redeem
 * @dev User must burn IDRX first, then submit burn txHash
 */
function requestRedeemSelfService(
    uint256 amount,
    string memory burnTxHash
) external nonReentrant returns (uint256 requestId) {
    require(userBankAccount[msg.sender].verified, "Bank account not verified");
    require(amount <= SELF_SERVICE_LIMIT, "Exceeds self-service limit");
    require(bytes(burnTxHash).length > 0, "Invalid burn txHash");
    
    requestId = ++redeemRequestCounter;
    
    redeemRequests[requestId] = RedeemRequest({
        id: requestId,
        user: msg.sender,
        amount: amount,
        mode: RedeemMode.SELF_SERVICE,
        status: RedeemStatus.PENDING,
        txHashBurn: burnTxHash,
        txHashRedeem: "",
        requestedAt: block.timestamp,
        processedAt: 0
    });
    
    emit RedeemRequested(requestId, msg.sender, amount, RedeemMode.SELF_SERVICE);
}

/**
 * @notice Request treasury-assisted redeem
 * @dev User transfers IDRX to treasury, treasury processes later
 */
function requestRedeemTreasuryAssisted(
    uint256 amount
) external nonReentrant returns (uint256 requestId) {
    require(amount > 0, "Amount must be > 0");
    
    // Transfer IDRX to treasury
    require(
        idrx.transferFrom(msg.sender, treasury, amount),
        "IDRX transfer failed"
    );
    
    requestId = ++redeemRequestCounter;
    
    redeemRequests[requestId] = RedeemRequest({
        id: requestId,
        user: msg.sender,
        amount: amount,
        mode: RedeemMode.TREASURY_ASSISTED,
        status: RedeemStatus.PENDING,
        txHashBurn: "",
        txHashRedeem: "",
        requestedAt: block.timestamp,
        processedAt: 0
    });
    
    emit RedeemRequested(requestId, msg.sender, amount, RedeemMode.TREASURY_ASSISTED);
}

/**
 * @notice Update redeem status (admin/backend only)
 * @dev Called by backend after processing
 */
function updateRedeemStatus(
    uint256 requestId,
    RedeemStatus status,
    string memory txHashBurn,
    string memory txHashRedeem
) external onlyAdmin {
    RedeemRequest storage request = redeemRequests[requestId];
    require(request.id == requestId, "Request not found");
    
    request.status = status;
    
    if (bytes(txHashBurn).length > 0) {
        request.txHashBurn = txHashBurn;
    }
    if (bytes(txHashRedeem).length > 0) {
        request.txHashRedeem = txHashRedeem;
    }
    
    if (status == RedeemStatus.COMPLETED) {
        request.processedAt = block.timestamp;
        emit RedeemCompleted(requestId);
    } else if (status == RedeemStatus.FAILED) {
        emit RedeemFailed(requestId, txHashRedeem); // Use txHashRedeem for error message
    }
    
    emit RedeemProcessed(requestId, txHashBurn, txHashRedeem);
}

/**
 * @notice Get user's redeem request IDs
 */
function getUserRedeemRequests(address user) 
    external 
    view 
    returns (uint256[] memory) 
{
    uint256 count = 0;
    
    // Count user's requests
    for (uint256 i = 1; i <= redeemRequestCounter; i++) {
        if (redeemRequests[i].user == user) {
            count++;
        }
    }
    
    // Populate array
    uint256[] memory requestIds = new uint256[](count);
    uint256 index = 0;
    for (uint256 i = 1; i <= redeemRequestCounter; i++) {
        if (redeemRequests[i].user == user) {
            requestIds[index] = i;
            index++;
        }
    }
    
    return requestIds;
}

/**
 * @notice Get redeem request details
 */
function getRedeemRequest(uint256 requestId)
    external
    view
    returns (RedeemRequest memory)
{
    return redeemRequests[requestId];
}

/**
 * @notice Check if user has verified bank account
 */
function hasBankAccount(address user) external view returns (bool) {
    return userBankAccount[user].verified;
}
```

---

## 📝 Implementation Steps

### Step 1: Update Contract

1. Add new structs, enums, and state variables
2. Add new functions for redeem tracking
3. Test thoroughly on testnet

### Step 2: Deploy Updated Contract

```bash
# Deploy BorrowingProtocolV2.1
forge script script/lisk/Deploy9_BorrowingProtocolV2.s.sol:Deploy9_BorrowingProtocolV2 \
  --rpc-url $LISK_SEPOLIA_RPC \
  --broadcast \
  --verify
```

### Step 3: Update Frontend

1. Update contract ABI
2. Add UI for redeem flow
3. Integrate with backend API

### Step 4: Update Backend

1. Add contract interaction code
2. Implement treasury bot
3. Deploy to Vercel

---

## 🔄 Migration Path

If you already have deployed `BorrowingProtocolV2`:

### Option A: Deploy New Contract (Clean Slate)

1. Deploy `BorrowingProtocolV2.1` with redeem features
2. Update frontend to use new contract
3. Keep old contract for existing positions

### Option B: Upgrade Existing Contract

If you want to preserve existing user positions:

1. Make contract upgradeable (use UUPS or Transparent Proxy)
2. Deploy implementation with new features
3. Upgrade proxy to new implementation

**Note:** If current contract is not upgradeable, you'll need Option A.

---

## 🧪 Testing Checklist

- [ ] Self-service redeem with verified bank account
- [ ] Self-service redeem exceeding limit (should fail)
- [ ] Self-service redeem without verified bank (should fail)
- [ ] Treasury-assisted redeem
- [ ] Update redeem status (admin only)
- [ ] Get user redeem requests
- [ ] Event emissions
- [ ] Gas optimization

---

## 📊 Gas Estimates

Approximate gas costs on Lisk Sepolia:

| Function | Estimated Gas |
|----------|---------------|
| `registerBankAccount` | ~80,000 |
| `requestRedeemSelfService` | ~120,000 |
| `requestRedeemTreasuryAssisted` | ~150,000 (includes IDRX transfer) |
| `updateRedeemStatus` | ~60,000 |
| `getUserRedeemRequests` | View function (free) |

---

## 🔒 Security Considerations

1. **Admin-only functions**: Only admin can register bank accounts and update statuses
2. **Bank account verification**: Required for self-service redeem
3. **Amount limits**: Self-service capped at 250M IDR
4. **Reentrancy protection**: All state-changing functions use `nonReentrant`
5. **Input validation**: All inputs validated before processing

---

## 📚 Additional Resources

- [BorrowingProtocolV2.sol](../src/BorrowingProtocolV2.sol)
- [Backend Implementation Guide](./BACKEND_IMPLEMENTATION_GUIDE.md)
- [IDRX Documentation](https://docs.idrx.co/)
