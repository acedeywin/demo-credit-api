import db from '../config/db/connection'
import TransactionModel from '../models/transaction.model'
import { AccountDto, PaymentType } from '../types/account.types'
import { TransactionDto } from '../types/transaction.types'
import { InternalError } from '../utils/error.handler'
import { generateReferenceId } from '../utils/helpers'
import AccountService from './account.service'

/**
 * TransactionService provides methods for managing transactions, including funding, withdrawal, transfer, and transaction history retrieval.
 */
class TransactionService {
    account_number: string

    /**
     * Initializes an instance of TransactionService for a specific account number.
     *
     * @param {string} account_number - The account number for this instance of the service.
     */
    constructor(account_number: string) {
        this.account_number = account_number
    }

    /**
     * Updates an account balance by creating a transaction, adjusting the balance, and sending a notification.
     *
     * @param {string} account_number - The account number to update.
     * @param {number} amount - The amount to credit or debit.
     * @param {PaymentType} type - The type of transaction (CREDIT or DEBIT).
     * @param {string} [description] - An optional description of the transaction.
     * @returns {Promise<void>}
     * @throws {InternalError} - If the account update operation fails.
     */
    static async updateAccount(
        account_number: string,
        amount: number,
        type: PaymentType,
        description?: string
    ): Promise<void> {
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

    /**
     * Funds an account by crediting a specified amount.
     *
     * @param {string} account_number - The account number to fund.
     * @param {number} amount - The amount to credit to the account.
     * @param {string} [description] - An optional description of the transaction.
     * @returns {Promise<void>}
     */
    static async fundAccount(
        account_number: string,
        amount: number,
        description?: string
    ): Promise<void> {
        const transaction_type = PaymentType.CREDIT

        await this.updateAccount(
            account_number,
            amount,
            transaction_type,
            description
        )
    }

    /**
     * Withdraws funds from an account by debiting a specified amount.
     *
     * @param {string} account_number - The account number to debit.
     * @param {number} amount - The amount to debit from the account.
     * @param {string} [description] - An optional description of the transaction.
     * @returns {Promise<void>}
     */
    static async withdrawFund(
        account_number: string,
        amount: number,
        description?: string
    ): Promise<void> {
        const transaction_type = PaymentType.DEBIT

        await this.updateAccount(
            account_number,
            amount,
            transaction_type,
            description
        )
    }

    /**
     * Transfers funds between two accounts by debiting the sender and crediting the receiver.
     *
     * @param {string} sender_account - The account number of the sender.
     * @param {string} receiver_account - The account number of the receiver.
     * @param {number} amount - The amount to transfer.
     * @param {string} [description] - An optional description of the transaction.
     * @returns {Promise<void>}
     */
    static async transferFund(
        sender_account: string,
        receiver_account: string,
        amount: number,
        description?: string
    ): Promise<void> {
        try {
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
        } catch (error) {
            throw new InternalError('Fund transfer failed:', error)
        }
    }

    /**
     * Retrieves the transaction history for a specified account.
     *
     * @param {string} account_number - The account number to retrieve transaction history for.
     * @returns {Promise<{ account: AccountDto | null; transactions: TransactionDto[] | null }>} - An object containing account details and transaction history.
     * @throws {InternalError} - If fetching transactions fails.
     */
    static async transactionHistory(account_number: string): Promise<{
        account: AccountDto | null
        transactions: TransactionDto[] | null
    }> {
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
