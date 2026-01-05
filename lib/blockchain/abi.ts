export const BORROWING_PROTOCOL_ABI = [
    {
        "inputs": [
            { "internalType": "uint256", "name": "requestId", "type": "uint256" },
            { "internalType": "uint8", "name": "status", "type": "uint8" },
            { "internalType": "string", "name": "txHashBurn", "type": "string" },
            { "internalType": "string", "name": "txHashRedeem", "type": "string" }
        ],
        "name": "updateRedeemStatus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "requestId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "indexed": false, "internalType": "uint8", "name": "mode", "type": "uint8" }
        ],
        "name": "RedeemRequested",
        "type": "event"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "requestId", "type": "uint256" }
        ],
        "name": "getRedeemRequest",
        "outputs": [
            { "internalType": "address", "name": "user", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "internalType": "uint8", "name": "status", "type": "uint8" },
            { "internalType": "uint8", "name": "mode", "type": "uint8" },
            { "internalType": "string", "name": "txHashBurn", "type": "string" },
            { "internalType": "string", "name": "txHashRedeem", "type": "string" },
            { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;
