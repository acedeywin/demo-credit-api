import AccountModel from '../models/account.model'
import { AccountDto } from '../types/account.types'
import { InternalError } from '../utils/error.handler'

class AccountService {
    static async createAccount(payload: AccountDto) {
        try {
            await AccountModel.createAccount(payload)
        } catch (error) {
            console.error('Account creation failed:', error)
            throw new InternalError('Account creation could not be completed.')
        }
    }
}

export default AccountService
