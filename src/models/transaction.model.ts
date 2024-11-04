import { Knex } from 'knex'
import db from '../config/db/connection'
import { TransactionDto } from '../types/transaction.types'

/**
 * TransactionModel provides data access methods for transaction-related operations.
 */
class TransactionModel {
    /**
     * Creates a new transaction record within a transaction.
     * 
     * @param {TransactionDto} payload - The transaction details to be inserted.
     * @param {Knex.Transaction} trx - The transaction object for database operations.
     * @returns {Promise<void>}
     */
    static async createTransaction(
        payload: TransactionDto,
        trx: Knex.Transaction
    ): Promise<void> {
        await trx('transactions').insert(payload)
    }

    /**
     * Retrieves all transactions for a specified account, ordered by creation date in descending order.
     * 
     * @param {string} account_id - The ID of the account to fetch transactions for.
     * @returns {Promise<TransactionDto[] | null>} - An array of transactions or null if no transactions found.
     */
    static async getAccountTransactions(account_id: string): Promise<TransactionDto[] | null> {
        const transactions = await db('transactions')
            .select('*')
            .where({ account_id })
            .orderBy('created_at', 'desc')

        return transactions || null
    }

    /**
     * Retrieves a transaction by its unique ID.
     * 
     * @param {string} id - The ID of the transaction to retrieve.
     * @returns {Promise<TransactionDto | null>} - The transaction details or null if not found.
     */
    static async getTransactionById(id: string): Promise<TransactionDto | null> {
        const transaction = await db('transactions').where({ id }).first()

        return transaction || null
    }
}

export default TransactionModel
