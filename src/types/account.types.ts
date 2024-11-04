export enum AccountStatus {
    ACTIVE = 'active',
    DORMANT = 'dormant',
    SUSPENDED = 'suspended',
    CLOSED = 'closed',
}

export enum PaymentType {
    CREDIT = 'credit',
    DEBIT = 'debit',
}

export interface AccountDto {
    id?: string
    account_number: string
    user_id?: string
    balance?: number
    status?: AccountStatus
}
