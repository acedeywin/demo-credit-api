import { Knex } from 'knex'
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

/**
 * AccountService provides business logic for managing accounts, including creating accounts, retrieving balances, and sending notifications.
 */
class AccountService {
    account_number: string

    /**
     * Initializes an instance of AccountService for a specific account number.
     *
     * @param {string} account_number - The account number for this instance of the service.
     */
    constructor(account_number: string) {
        this.account_number = account_number
    }

    /**
     * Creates a new account record in the database.
     *
     * @param {AccountDto} payload - The account details to be created.
     * @throws {InternalError} - If account creation fails.
     */
    static async createAccount(payload: AccountDto) {
        try {
            await AccountModel.createAccount(payload)
        } catch (error) {
            console.error('Account creation failed:', error)
            throw new InternalError('Account creation could not be completed.')
        }
    }

    /**
     * Creates a new account for a user by generating a unique account number and sending a notification email.
     *
     * @param {string} id - The unique user ID.
     * @returns {Promise<string>} - The newly created account number.
     * @throws {InternalError} - If account creation fails.
     */
    static async createNewAccount(id: string): Promise<string> {
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

    /**
     * Retrieves the current balance of the account within a transaction.
     *
     * @param {Knex.Transaction} trx - The transaction object.
     * @returns {Promise<number>} - The account balance, or 0 if unavailable.
     */
    async getBalance(trx: Knex.Transaction): Promise<number> {
        const balance = await AccountModel.getBalance(this.account_number, trx)
        return balance ? Number(balance) : 0
    }

    /**
     * Updates the account balance based on the transaction type (credit or debit).
     *
     * @param {number} amount - The amount to be credited or debited.
     * @param {PaymentType} type - The type of transaction (CREDIT or DEBIT).
     * @param {Knex.Transaction} trx - The transaction object.
     * @returns {Promise<void>}
     */
    async updateBalance(
        amount: number,
        type: PaymentType,
        trx: Knex.Transaction
    ): Promise<void> {
        await AccountModel.updateBalance(this.account_number, amount, type, trx)
    }

    /**
     * Retrieves the account details for the current account number.
     *
     * @returns {Promise<AccountDto | null>} - The account details or null if not found.
     */
    async accountDetails(): Promise<AccountDto | null> {
        const account = await AccountModel.getAccountDetils(this.account_number)
        return account
    }

    /**
     * Sends a transaction notification email to the account holder with transaction details.
     *
     * @param {number} amount - The transaction amount.
     * @param {string} reference_id - The reference ID of the transaction.
     * @param {string} description - The description of the transaction.
     * @param {PaymentType} type - The type of transaction (CREDIT or DEBIT).
     * @param {Knex.Transaction} trx - The transaction object.
     * @returns {Promise<void>}
     * @throws {InternalError} - If notification sending fails.
     */
    async notification(
        amount: number,
        reference_id: string,
        description: string,
        type: PaymentType,
        trx: Knex.Transaction
    ): Promise<void> {
        try {
            const account = await this.accountDetails()
            const user = await UserModel.getUserByIdentifier({
                id: account?.user_id,
            })

            const transaction_type = type.toLocaleUpperCase()
            const account_number = maskNumber(String(account?.account_number))
            const balance = await this.getBalance(trx)
            const format_balance = formatCurrency(balance)
            const format_amount = formatCurrency(Number(amount))
            const date = formatDate(new Date())

            const text = `Hello ${user?.first_name},\n\nThis is to inform you that a transaction has occurred on your account with details below:\nAccount Number: ${account_number}\nAmount: ${format_amount}\nTransaction Currency: NGN\nBalance: ${format_balance}\nTransaction Type: ${transaction_type}\nTransaction Narration: ${description || transaction_type}\nTransaction Remarks: ${reference_id}\nDate and Time: ${date}`
            const subject = `${transaction_type} Transaction Notification`

            await sendEmail(user?.email as string, subject, text)
        } catch (error) {
            console.error('Notification sending failed:', error)
            throw new InternalError(
                'Notification sending could not be completed.'
            )
        }
    }
}

export default AccountService
