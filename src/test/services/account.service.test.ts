import AccountService from '../../services/account.service'
import AccountModel from '../../models/account.model'
import UserModel from '../../models/user.model'
import sendEmail from '../../utils/email'
import {
    AccountDto,
    AccountStatus,
    PaymentType,
} from '../../types/account.types'
import { InternalError } from '../../utils/error.handler'
import {
    formatCurrency,
    generateUniqueAccountNumber,
} from '../../utils/helpers'
import { Knex } from 'knex'

jest.mock('../../models/account.model')
jest.mock('../../models/user.model')
jest.mock('../../utils/email')
jest.mock('../../utils/helpers', () => ({
    formatCurrency: jest.fn(),
    formatDate: jest.fn(),
    generateUniqueAccountNumber: jest.fn(),
    maskNumber: jest.fn(),
}))

describe('AccountService Tests', () => {
    const user_id = 'user123'
    const account_number = 'ACC123456'
    const email = 'user@example.com'
    const amount = 1000
    const type = PaymentType.DEBIT
    const balance = 5000
    const formattedBalance = '₦5,000'
    const formattedAmount = '₦1,000'
    const mockUser = { id: user_id, first_name: 'John', email }
    const mockTransaction = {} as Knex.Transaction // Use an empty object for the transaction mock

    beforeEach(() => {
        jest.clearAllMocks()
        ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
            mockUser
        )
        ;(generateUniqueAccountNumber as jest.Mock).mockResolvedValue(
            account_number
        )
        ;(AccountModel.createAccount as jest.Mock).mockResolvedValue(undefined)
        ;(sendEmail as jest.Mock).mockResolvedValue('Email sent successfully')
    })

    describe('createAccount', () => {
        it('should create an account successfully', async () => {
            const payload: AccountDto = {
                account_number,
                user_id,
                status: AccountStatus.ACTIVE,
            }
            await AccountService.createAccount(payload)
            expect(AccountModel.createAccount).toHaveBeenCalledWith(payload)
        })

        it('should throw an InternalError if account creation fails', async () => {
            ;(AccountModel.createAccount as jest.Mock).mockRejectedValue(
                new Error('DB Error')
            )
            await expect(
                AccountService.createAccount({
                    account_number,
                    user_id,
                    status: AccountStatus.ACTIVE,
                })
            ).rejects.toThrow(InternalError)
        })
    })

    describe('createNewAccount', () => {
        it('should create a new account and send email', async () => {
            const result = await AccountService.createNewAccount(user_id)

            expect(UserModel.getUserByIdentifier).toHaveBeenCalledWith({
                id: user_id,
            })
            expect(generateUniqueAccountNumber).toHaveBeenCalled()
            expect(AccountModel.createAccount).toHaveBeenCalledWith({
                account_number,
                user_id,
                status: AccountStatus.ACTIVE,
            })
            expect(sendEmail).toHaveBeenCalledWith(
                email,
                'New Account Successfully Created',
                expect.stringContaining(account_number)
            )
            expect(result).toBe(account_number)
        })

        it('should throw an InternalError if account creation fails', async () => {
            ;(AccountModel.createAccount as jest.Mock).mockRejectedValueOnce(
                new Error('DB Error')
            )

            await expect(
                AccountService.createNewAccount(user_id)
            ).rejects.toThrow(InternalError)
        })

        it('should throw an InternalError if email sending fails', async () => {
            ;(sendEmail as jest.Mock).mockRejectedValueOnce(
                new Error('Email service error')
            )

            await expect(
                AccountService.createNewAccount(user_id)
            ).rejects.toThrow(InternalError)
        })
    })

    describe('getBalance', () => {
        it('should return the balance of the account', async () => {
            ;(AccountModel.getBalance as jest.Mock).mockResolvedValue(balance)
            const accountService = new AccountService(account_number)
            const result = await accountService.getBalance(
                mockTransaction as Knex.Transaction
            )
            expect(result).toBe(balance)
        })

        it('should return 0 if balance does not exist', async () => {
            ;(AccountModel.getBalance as jest.Mock).mockResolvedValue(null)
            const accountService = new AccountService(account_number)
            const result = await accountService.getBalance(
                mockTransaction as Knex.Transaction
            )
            expect(result).toBe(0)
        })
    })

    describe('updateBalance', () => {
        it('should update the balance of the account', async () => {
            const accountService = new AccountService(account_number)
            await accountService.updateBalance(amount, type, mockTransaction)
            expect(AccountModel.updateBalance).toHaveBeenCalledWith(
                account_number,
                amount,
                type,
                mockTransaction
            )
        })
    })

    describe('accountDetails', () => {
        it('should return account details', async () => {
            const accountData = { account_number, balance }
            ;(AccountModel.getAccountDetils as jest.Mock).mockResolvedValue(
                accountData
            )

            const accountService = new AccountService(account_number)
            const result = await accountService.accountDetails()

            expect(result).toEqual(accountData)
            expect(AccountModel.getAccountDetils).toHaveBeenCalledWith(
                account_number
            )
        })
    })

    describe('notification', () => {
        it('should send a transaction notification email', async () => {
            const reference_id = 'REF123'
            const description = 'Test Transaction'
            const user = { id: user_id, first_name: 'John', email }
            const accountData = { account_number, user_id, balance }

            ;(AccountModel.getAccountDetils as jest.Mock).mockResolvedValue(
                accountData
            )
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
                user
            )
            ;(formatCurrency as jest.Mock)
                .mockReturnValueOnce(formattedAmount)
                .mockReturnValueOnce(formattedBalance)

            const accountService = new AccountService(account_number)
            await accountService.notification(
                amount,
                reference_id,
                description,
                type,
                mockTransaction
            )

            expect(sendEmail).toHaveBeenCalledWith(
                email,
                `${type.toUpperCase()} Transaction Notification`,
                expect.stringContaining(formattedAmount)
            )
        })

        it('should throw an InternalError if notification fails', async () => {
            ;(AccountModel.getAccountDetils as jest.Mock).mockRejectedValue(
                new Error('DB Error')
            )
            const accountService = new AccountService(account_number)
            await expect(
                accountService.notification(
                    amount,
                    'REF123',
                    'Test Transaction',
                    type,
                    mockTransaction
                )
            ).rejects.toThrow(InternalError)
        })
    })
})
