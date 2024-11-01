import db from '../config/db/connection'
import { AccountDto } from '../types/account.types'

class AccountModel {
    static async createAccount(payload: AccountDto): Promise<AccountDto> {
        const [accountId] = await db('accounts').insert(payload)

        const [account] = await db('accounts')
            .where({ id: accountId })
            .select('*')

        return account
    }

    static async getAccountById(
        id: string,
        user_id: string
    ): Promise<AccountDto | null> {
        const account = await db('accounts').where({ id, user_id }).first()
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
}

export default AccountModel
