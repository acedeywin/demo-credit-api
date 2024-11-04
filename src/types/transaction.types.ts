import { PaymentType } from './account.types'

export interface TransactionDto {
    account_id: string
    amount: number
    balance_after: number
    transaction_type: PaymentType
    description?: string
    reference_id: string
}