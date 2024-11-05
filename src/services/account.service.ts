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
import db from '../config/db/connection'

/**
 * AccountService provides business logic for managing user accounts, 
 * such as account creation, balance retrieval, and sending transaction notifications.
 */
class AccountService {
    account_number: string

    /**
     * Creates an instance of AccountService for a specified account number.
     *
     * @param {string} account_number - The account number associated with this instance.
     */
    constructor(account_number: string) {
        this.account_number = account_number
    }

    /**
     * Creates a new account in the database.
     *
     * @param {AccountDto} payload - Contains details for the new account.
     * @param {Knex.Transaction} trx - Transaction context for database operations.
     * @returns {Promise<AccountDto>} - The created account data.
     * @throws {InternalError} - Thrown if account creation fails.
     */
    static async createAccount(payload: AccountDto, trx: Knex.Transaction): Promise<AccountDto> {
        try {
            return await AccountModel.createAccount(payload, trx)
        } catch (error) {
            console.error('Account creation failed:', error)
            throw new InternalError('Account creation could not be completed.')
        }
    }

    /**
     * Generates a new account for a user, assigns a unique account number, 
     * and sends a notification email.
     *
     * @param {string} id - The user ID for whom the account is created.
     * @returns {Promise<AccountDto>} - The generated account.
     * @throws {InternalError} - Thrown if account creation fails.
     */
    static async createNewAccount(id: string): Promise<AccountDto> {
        try {
            const created_account = await db.transaction(async (trx) => {
                const user = await UserModel.getUserByIdentifier({ id })
                const account_number = await generateUniqueAccountNumber()

                const payload: AccountDto = {
                    account_number,
                    user_id: id,
                    status: AccountStatus.ACTIVE,
                }

                const text = `Hello ${user?.first_name},\n\n Your new account was successfully created.\n\n Account Number: ${account_number}.`
                const subject = 'New Account Successfully Created'

                const created_account = await this.createAccount(payload, trx)
                if (created_account?.account_number) {
                    await sendEmail(user?.email as string, subject, text)
                }

                return created_account
            })

            return created_account
        } catch (error) {
            console.error('New account creation failed:', error)
            throw new InternalError('New account creation could not be completed.')
        }
    }

    /**
     * Retrieves the balance of the account within a transaction context.
     *
     * @param {Knex.Transaction} trx - Transaction context for the operation.
     * @returns {Promise<number>} - The current account balance or 0 if unavailable.
     */
    async getBalance(trx: Knex.Transaction): Promise<number> {
        const balance = await AccountModel.getBalance(this.account_number, trx)
        return balance ? Number(balance) : 0
    }

    /**
     * Adjusts the account balance by a specified amount based on transaction type.
     *
     * @param {number} amount - The transaction amount to add (credit) or subtract (debit).
     * @param {PaymentType} type - Specifies if the transaction is a CREDIT or DEBIT.
     * @param {Knex.Transaction} trx - Transaction context for the operation.
     */
    async updateBalance(amount: number, type: PaymentType, trx: Knex.Transaction): Promise<void> {
        await AccountModel.updateBalance(this.account_number, amount, type, trx)
    }

    /**
     * Retrieves the full account details for the associated account number.
     *
     * @returns {Promise<AccountDto | null>} - Account details or null if not found.
     */
    async accountDetails(): Promise<AccountDto | null> {
        return await AccountModel.getAccountDetils(this.account_number)
    }

    /**
     * Sends a transaction notification email to the account holder detailing the transaction.
     *
     * @param {number} amount - The transaction amount.
     * @param {string} reference_id - Unique reference ID for the transaction.
     * @param {string} description - Description or note for the transaction.
     * @param {PaymentType} type - Type of transaction (CREDIT or DEBIT).
     * @param {Knex.Transaction} trx - Transaction context for the operation.
     * @throws {InternalError} - Thrown if the notification could not be sent.
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
            const user = await UserModel.getUserByIdentifier({ id: account?.user_id })

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
            throw new InternalError('Notification sending could not be completed.')
        }
    }
}

export default AccountService
