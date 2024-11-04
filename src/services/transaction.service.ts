import db from '../config/db/connection'
import TransactionModel from '../models/transaction.model'
import { PaymentType } from '../types/account.types'
import { TransactionDto } from '../types/transaction.types'
import { InternalError } from '../utils/error.handler'
import { generateReferenceId } from '../utils/helpers'
import AccountService from './account.service'

class TransactionService {
    account_number: string
    constructor(account_number: string) {
        this.account_number = account_number
    }
    static async updateAccount(
        account_number: string,
        amount: number,
        type: PaymentType,
        description?: string
    ) {
        try {
            const account = new AccountService(account_number)
            const details = await account.accountDetails()
            const reference_id = await generateReferenceId(
                details?.user_id as string,
                type
            )

            await db.transaction(async (trx) => {
                await account.updateBalance(amount, type, trx)
                const balance_after = await account.getBalance(trx)

                const transaction: TransactionDto = {
                    account_id: details?.id as string,
                    amount,
                    transaction_type: type,
                    balance_after,
                    reference_id,
                    description,
                }

                await TransactionModel.createTransaction(transaction, trx)
                await account.notification(
                    amount,
                    reference_id,
                    description as string,
                    type,
                    trx
                )
            })
        } catch (error) {
            throw new InternalError('Account update failed:', error)
        }
    }

    static async fundAccount(
        account_number: string,
        amount: number,
        description?: string
    ) {
        const transaction_type = PaymentType.CREDIT

        await this.updateAccount(
            account_number,
            amount,
            transaction_type,
            description
        )
    }

    static async withdrawFund(
        account_number: string,
        amount: number,
        description?: string
    ) {
        const transaction_type = PaymentType.DEBIT

        await this.updateAccount(
            account_number,
            amount,
            transaction_type,
            description
        )
    }

    static async transferFund(
        sender_account: string,
        receiver_account: string,
        amount: number,
        description?: string
    ) {
        await this.updateAccount(
            sender_account,
            amount,
            PaymentType.DEBIT,
            description
        )
        await this.updateAccount(
            receiver_account,
            amount,
            PaymentType.CREDIT,
            description
        )
    }

    static async transactionHistory(account_number: string) {
        try {
            const account = new AccountService(account_number)

            const details = await account.accountDetails()

            const transactions = await TransactionModel.getAccountTransactions(
                details?.id as string
            )

            return { account: details, transactions }
        } catch (error) {
            throw new InternalError('Fetching transactions failed:', error)
        }
    }
}

export default TransactionService
