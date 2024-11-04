import db from '../config/db/connection'
import { TransactionDto } from '../types/transaction.types'

class TransactionModel {
    static async createTransaction(payload: TransactionDto) {
        await db('transactions').insert(payload)
    }

    static async getAccountTransactions(account_id: string) {
        const transactions = await db('transactions')
            .select('*')
            .where({ account_id })

        return transactions || null
    }

    static async getTransactionById(id: string) {
        const transaction = await db('transactions').where({ id }).first()

        return transaction || null
    }
}

export default TransactionModel
