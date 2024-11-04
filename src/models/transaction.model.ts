import { Knex } from 'knex'
import db from '../config/db/connection'
import { TransactionDto } from '../types/transaction.types'

class TransactionModel {
    static async createTransaction(
        payload: TransactionDto,
        trx: Knex.Transaction
    ) {
        await trx('transactions').insert(payload)
    }

    static async getAccountTransactions(account_id: string) {
        const transactions = await db('transactions')
            .select('*')
            .where({ account_id }).orderBy('created_at', 'desc');

        return transactions || null
    }

    static async getTransactionById(id: string) {
        const transaction = await db('transactions').where({ id }).first()

        return transaction || null
    }
}

export default TransactionModel
