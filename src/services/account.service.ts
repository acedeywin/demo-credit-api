import AccountModel from '../models/account.model'
import UserModel from '../models/user.model'
import { AccountDto, AccountStatus, PaymentType } from '../types/account.types'
import sendEmail from '../utils/email'
import { InternalError } from '../utils/error.handler'
import {
    formatCurrency,
    formatDate,
    generateUniqueAccountNumber,
    maskNumber,
} from '../utils/helpers'

class AccountService {
    account_number: string
    constructor(account_number: string) {
        this.account_number = account_number
    }

    static async createAccount(payload: AccountDto) {
        try {
            await AccountModel.createAccount(payload)
        } catch (error) {
            console.error('Account creation failed:', error)
            throw new InternalError('Account creation could not be completed.')
        }
    }

    static async createNewAccount(id: string) {
        try {
            const user = await UserModel.getUserByIdentifier({ id })

            const account_number = await generateUniqueAccountNumber()

            const payload: AccountDto = {
                account_number,
                user_id: id,
                status: AccountStatus.ACTIVE,
            }

            const text = `Hello ${user?.first_name},\n\n Your new account was successfully created.\n\n Account Number: ${account_number}.`
            const subject = 'New Account Successfully Created'

            await this.createAccount(payload)
            await sendEmail(user?.email as string, subject, text)

            return account_number
        } catch (error) {
            console.error('New account creation failed:', error)
            throw new InternalError(
                'New account creation could not be completed.'
            )
        }
    }

    async getBalance(): Promise<number> {
        const account = await AccountModel.getAccountDetils(this.account_number)
        return account ? Number(account.balance) : 0
    }

    async updateBalance(amount: number, type: PaymentType): Promise<void> {
        const account = await AccountModel.updateBalance(
            this.account_number,
            amount,
            type
        )
        console.log('account is here', account)
    }

    async accountDetails() {
        const account = await AccountModel.getAccountDetils(this.account_number)
        return account
    }

    async notification(
        amount: number,
        reference_id: string,
        description: string,
        type: PaymentType
    ) {
        try {
            const account = await this.accountDetails()

            const user = await UserModel.getUserByIdentifier({
                id: account?.user_id,
            })

            const transaction_type = type.toLocaleUpperCase()
            const account_number = maskNumber(String(account?.account_number))
            const balance = await this.getBalance()
            const format_balance = formatCurrency(balance)
            const format_amount = formatCurrency(Number(amount))
            const date = formatDate(new Date())

            const text = `Hello ${user?.first_name},\n\nThis is to inform you that a transaction has occurred on your account with details below:\nAccount Number: ${account_number}\nAmount ${format_amount}\nTransaction Currency: NGN\nBalance: ${format_balance}\nTransaction Type: ${transaction_type}\nTransaction Narration: ${description ? description : transaction_type}\nTransaction Remarks: ${reference_id}\nDate and Time: ${date}`
            const subject = `${transaction_type} Transaction Notification`

            await sendEmail(user?.email as string, subject, text)
        } catch (error) {
            console.error('New account creation failed:', error)
            throw new InternalError(
                'New account creation could not be completed.'
            )
        }
    }
}

export default AccountService
