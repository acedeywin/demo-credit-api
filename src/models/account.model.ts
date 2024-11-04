import { Knex } from 'knex'
import db from '../config/db/connection'
import { AccountDto, PaymentType } from '../types/account.types'

/**
 * AccountModel provides data access methods for account-related operations.
 */
class AccountModel {
    /**
     * Creates a new account with the specified details.
     * 
     * @param {AccountDto} payload - The account details to be inserted into the database.
     */
    static async createAccount(payload: AccountDto) {
        await db('accounts').insert(payload)
    }

    /**
     * Retrieves an account by the specified user ID.
     * 
     * @param {string} [user_id] - The user ID associated with the account.
     * @returns {Promise<AccountDto[] | null>} - The account details or null if not found.
     */
    static async getAccountByUserId(user_id?: string): Promise<AccountDto[] | null> {
        const account = await db('accounts').select('*').where({ user_id })
        return account || null
    }

    /**
     * Retrieves account details by the specified account number.
     * 
     * @param {string} account_number - The account number to search for.
     * @returns {Promise<AccountDto | null>} - The account details or null if not found.
     */
    static async getAccountDetils(
        account_number: string
    ): Promise<AccountDto | null> {
        const account = await db('accounts').where({ account_number }).first()
        return account || null
    }

    /**
     * Retrieves the balance for the specified account number within a transaction.
     * 
     * @param {string} account_number - The account number to fetch the balance for.
     * @param {Knex.Transaction} trx - The transaction object.
     * @returns {Promise<number>} - The balance of the specified account.
     */
    static async getBalance(account_number: string, trx: Knex.Transaction): Promise<number> {
        const { balance } = await trx('accounts')
            .where({ account_number })
            .select('balance')
            .first()

        return balance
    }

    /**
     * Updates the balance for the specified account number based on the transaction type.
     * 
     * @param {string} account_number - The account number to update.
     * @param {number} amount - The amount to credit or debit.
     * @param {PaymentType} type - The type of transaction (CREDIT or DEBIT).
     * @param {Knex.Transaction} trx - The transaction object.
     * @returns {Promise<number>} - The number of affected rows.
     */
    static async updateBalance(
        account_number: string,
        amount: number,
        type: PaymentType,
        trx: Knex.Transaction
    ): Promise<number> {
        return type === PaymentType.CREDIT
            ? await trx('accounts')
                  .where({ account_number })
                  .increment('balance', amount)
            : await trx('accounts')
                  .where({ account_number })
                  .decrement('balance', amount)
    }

    /**
     * Updates an account by either ID or user ID with the specified payload.
     * 
     * @param {{ id?: string; user_id?: string }} identifier - The identifier object containing either `id` or `user_id`.
     * @param {Partial<AccountDto>} payload - The fields to update in the account.
     * @returns {Promise<AccountDto | null>} - The updated account details or null if the update failed.
     */
    static async updateAccountByIdOrUserId(
        identifier: { id?: string; user_id?: string },
        payload: Partial<AccountDto>
    ): Promise<AccountDto | null> {
        const { id, user_id } = identifier

        const query = db('accounts')
            .where((builder) => {
                if (id) builder.where('id', id)
                if (user_id) builder.where('user_id', user_id)
            })
            .update(payload)

        // Execute update
        const rowsAffected = await query
        if (!rowsAffected) {
            return null
        }

        // Retrieve the updated account row
        const [updatedAccount] = await db('accounts')
            .select('*')
            .where((builder) => {
                if (id) builder.where('id', id)
                if (user_id) builder.where('user_id', user_id)
            })
            .limit(1)

        return updatedAccount || null
    }
}

export default AccountModel
