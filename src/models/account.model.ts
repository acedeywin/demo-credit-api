import db from '../config/db/connection'
import { AccountDto } from '../types/account.types'

class AccountModel {
    static async createAccount(payload: AccountDto) {
        await db('accounts').insert(payload)
    }

    static async getAccountById(
        id?: string,
        user_id?: string
    ): Promise<AccountDto | null> {
        const query = db('accounts')

        if (user_id) {
            query.where('user_id', user_id)
        }

        if (id && user_id) {
            query.where({ id, user_id })
        }

        const account = await query.first()
        return account || null
    }

    static async updateAccountById(
        id: string,
        payload: Partial<AccountDto>
    ): Promise<AccountDto | null> {
        const [account] = await db('accounts')
            .update(payload)
            .where({ id })
            .returning('*')
        return account || null
    }

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
