export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class IDRXApiError extends Error {
    constructor(message: string, public statusCode?: number) {
        super(message);
        this.name = 'IDRXApiError';
    }
}

export class BlockchainError extends Error {
    constructor(message: string, public txHash?: string) {
        super(message);
        this.name = 'BlockchainError';
    }
}

export class UnauthorizedError extends Error {
    constructor(message: string = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}
