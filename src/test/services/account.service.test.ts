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
    formatDate,
    generateUniqueAccountNumber,
} from '../../utils/helpers'
import db from '../../config/db/connection'
import { Knex } from 'knex'
import redisClient from '../../config/redis'

jest.mock('../../models/account.model')
jest.mock('../../models/user.model')
jest.mock('../../utils/email')
jest.mock('../../utils/helpers', () => ({
    formatCurrency: jest.fn(),
    formatDate: jest.fn(),
    generateUniqueAccountNumber: jest.fn(),
    maskNumber: jest.fn(),
}))
jest.mock('../../config/db/connection')

// Mock ioredis directly
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        quit: jest.fn().mockResolvedValue('OK'),
    }))
})

afterAll(async () => {
    await redisClient.quit()
})

describe('AccountService', () => {
    const user_id = 'user123'
    const account_number = 'ACC123456'
    const email = 'user@example.com'
    const amount = 1000
    const balance = 5000
    const reference_id = 'REF123'
    const description = 'Test Transaction'
    const mockUser = { id: user_id, first_name: 'John', email }
    const mockTransaction = {} as Knex.Transaction

    beforeEach(() => {
        jest.clearAllMocks()

        // Set up mocks for helper functions and models
        ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
            mockUser
        )
        ;(generateUniqueAccountNumber as jest.Mock).mockResolvedValue(
            account_number
        )
        ;(sendEmail as jest.Mock).mockResolvedValue('Email sent successfully')
        ;(AccountModel.createAccount as jest.Mock).mockResolvedValue({
            account_number,
            user_id,
            status: AccountStatus.ACTIVE,
            balance: 0,
        })
        ;(formatCurrency as jest.Mock).mockImplementation(
            (value) => `₦${value}`
        )
        ;(formatDate as jest.Mock).mockReturnValue('2024-01-01 00:00:00')
    })

    describe('createAccount', () => {
        it('should create an account successfully', async () => {
            const payload: AccountDto = {
                account_number,
                user_id,
                status: AccountStatus.ACTIVE,
                balance: 0,
            }

            const result = await AccountService.createAccount(
                payload,
                mockTransaction
            )
            expect(AccountModel.createAccount).toHaveBeenCalledWith(
                payload,
                mockTransaction
            )
            expect(result).toEqual({
                account_number,
                user_id,
                status: AccountStatus.ACTIVE,
                balance: 0,
            })
        })

        it('should throw an InternalError if account creation fails', async () => {
            ;(AccountModel.createAccount as jest.Mock).mockRejectedValue(
                new Error('DB Error')
            )

            await expect(
                AccountService.createAccount(
                    {
                        account_number,
                        user_id,
                        status: AccountStatus.ACTIVE,
                        balance: 0,
                    },
                    mockTransaction
                )
            ).rejects.toThrow(InternalError)
        })
    })

    describe('createNewAccount', () => {
        it('should create a new account and send an email', async () => {
            ;(db.transaction as jest.Mock).mockImplementation(
                async (callback) => {
                    const trxMock = {} as Knex.Transaction
                    return callback(trxMock)
                }
            )

            const result = await AccountService.createNewAccount(user_id)

            expect(UserModel.getUserByIdentifier).toHaveBeenCalledWith({
                id: user_id,
            })
            expect(generateUniqueAccountNumber).toHaveBeenCalled()
            expect(AccountModel.createAccount).toHaveBeenCalledWith(
                { account_number, user_id, status: AccountStatus.ACTIVE },
                expect.any(Object)
            )
            expect(sendEmail).toHaveBeenCalledWith(
                email,
                'New Account Successfully Created',
                expect.stringContaining(account_number)
            )
            expect(result).toEqual({
                account_number,
                user_id,
                status: AccountStatus.ACTIVE,
                balance: 0,
            })
        })

        it('should throw an InternalError if email sending fails', async () => {
            ;(sendEmail as jest.Mock).mockRejectedValue(
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
            const result = await accountService.getBalance(mockTransaction)

            expect(result).toBe(balance)
        })

        it('should return 0 if balance is not found', async () => {
            ;(AccountModel.getBalance as jest.Mock).mockResolvedValue(null)

            const accountService = new AccountService(account_number)
            const result = await accountService.getBalance(mockTransaction)

            expect(result).toBe(0)
        })
    })

    describe('updateBalance', () => {
        it('should update the account balance', async () => {
            const accountService = new AccountService(account_number)

            await accountService.updateBalance(
                amount,
                PaymentType.DEBIT,
                mockTransaction
            )

            expect(AccountModel.updateBalance).toHaveBeenCalledWith(
                account_number,
                amount,
                PaymentType.DEBIT,
                mockTransaction
            )
        })
    })

    describe('accountDetails', () => {
        it('should return account details', async () => {
            const accountData = { account_number, user_id, balance }
            ;(AccountModel.getAccountDetils as jest.Mock).mockResolvedValue(
                accountData
            )

            const accountService = new AccountService(account_number)
            const result = await accountService.accountDetails()

            expect(result).toEqual(accountData)
        })
    })

    describe('notification', () => {
        it('should send a transaction notification email', async () => {
            const accountData = { account_number, user_id, balance }
            ;(AccountModel.getAccountDetils as jest.Mock).mockResolvedValue(
                accountData
            )

            const accountService = new AccountService(account_number)
            await accountService.notification(
                amount,
                reference_id,
                description,
                PaymentType.CREDIT,
                mockTransaction
            )

            expect(sendEmail).toHaveBeenCalledWith(
                email,
                `${PaymentType.CREDIT.toLocaleUpperCase()} Transaction Notification`,
                expect.stringContaining(`₦${amount}`)
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
                    reference_id,
                    description,
                    PaymentType.CREDIT,
                    mockTransaction
                )
            ).rejects.toThrow(InternalError)
        })
    })
})
