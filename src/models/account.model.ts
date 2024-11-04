import db from '../config/db/connection'
import { AccountDto, PaymentType } from '../types/account.types'

class AccountModel {
    static async createAccount(payload: AccountDto) {
        await db('accounts').insert(payload)
    }

    static async getAccountByUserId(user_id?: string) {
        const account = await db('accounts').select('*').where({ user_id })
        return account || null
    }

    static async getAccountDetils(
        account_number: string
    ): Promise<AccountDto | null> {
        const account = await db('accounts').where({ account_number }).first()
        return account || null
    }

    static async updateBalance(
        account_number: string,
        amount: number,
        type: PaymentType
    ) {
        return type === PaymentType.CREDIT
            ? await db('accounts')
                  .where({ account_number })
                  .increment('balance', amount)
            : await db('accounts')
                  .where({ account_number })
                  .decrement('balance', amount)
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
