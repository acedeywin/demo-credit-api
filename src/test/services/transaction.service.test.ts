import redisClient from '../../config/redis'
import TransactionModel from '../../models/transaction.model'
import AccountService from '../../services/account.service'
import TransactionService from '../../services/transaction.service'
import { PaymentType } from '../../types/account.types'
import { TransactionDto } from '../../types/transaction.types'
import { InternalError } from '../../utils/error.handler'
import { generateReferenceId } from '../../utils/helpers'

// Mock dependencies
jest.mock('../../services/account.service')
jest.mock('../../models/transaction.model')
jest.mock('../../utils/helpers', () => ({
    generateReferenceId: jest.fn(),
}))

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

describe('TransactionService', () => {
    const account_number = '1234567890'
    const amount = 100
    const description = 'Test transaction'
    const mockAccountDetails = {
        id: '1',
        user_id: 'user1',
        balance: 1000,
    }
    const mockTransactions = [
        { id: 't1', amount: 50, transaction_type: PaymentType.CREDIT },
        { id: 't2', amount: 30, transaction_type: PaymentType.DEBIT },
    ]

    let mockAccountServiceInstance: jest.Mocked<AccountService>

    beforeEach(() => {
        jest.clearAllMocks()

        // Mock AccountService instance
        mockAccountServiceInstance = new AccountService(
            account_number
        ) as jest.Mocked<AccountService>
        mockAccountServiceInstance.accountDetails = jest
            .fn()
            .mockResolvedValue(mockAccountDetails)
        mockAccountServiceInstance.updateBalance = jest
            .fn()
            .mockResolvedValue(undefined)
        mockAccountServiceInstance.getBalance = jest
            .fn()
            .mockResolvedValue(mockAccountDetails.balance)
        mockAccountServiceInstance.notification = jest
            .fn()
            .mockResolvedValue(undefined)

        // Ensure AccountService returns the mocked instance
        ;(AccountService as unknown as jest.Mock).mockImplementation(
            () => mockAccountServiceInstance
        )
        ;(
            generateReferenceId as jest.MockedFunction<
                typeof generateReferenceId
            >
        ).mockResolvedValue('ref123')
        ;(
            TransactionModel.createTransaction as jest.MockedFunction<
                typeof TransactionModel.createTransaction
            >
        ).mockResolvedValue(undefined)
        ;(
            TransactionModel.getAccountTransactions as jest.MockedFunction<
                typeof TransactionModel.getAccountTransactions
            >
        ).mockResolvedValue(mockTransactions)
    })

    describe('updateAccount', () => {
        it('should update account balance, create a transaction, and send notification', async () => {
            await TransactionService.updateAccount(
                account_number,
                amount,
                PaymentType.CREDIT,
                description
            )

            // Verify methods were called with correct parameters
            expect(mockAccountServiceInstance.accountDetails).toHaveBeenCalled()
            expect(
                mockAccountServiceInstance.updateBalance
            ).toHaveBeenCalledWith(amount, PaymentType.CREDIT)
            expect(mockAccountServiceInstance.getBalance).toHaveBeenCalled()
            expect(TransactionModel.createTransaction).toHaveBeenCalledWith(
                expect.objectContaining<TransactionDto>({
                    account_id: mockAccountDetails.id,
                    amount,
                    transaction_type: PaymentType.CREDIT,
                    balance_after: mockAccountDetails.balance,
                    reference_id: 'ref123',
                    description,
                })
            )
            expect(
                mockAccountServiceInstance.notification
            ).toHaveBeenCalledWith(
                amount,
                'ref123',
                description,
                PaymentType.CREDIT
            )
        })

        it('should throw an InternalError if account update fails', async () => {
            mockAccountServiceInstance.accountDetails.mockRejectedValueOnce(
                new Error('Account error')
            )

            await expect(
                TransactionService.updateAccount(
                    account_number,
                    amount,
                    PaymentType.CREDIT
                )
            ).rejects.toThrow(InternalError)
        })
    })

    describe('fundAccount', () => {
        it('should fund the account by calling updateAccount with CREDIT type', async () => {
            const spy = jest.spyOn(TransactionService, 'updateAccount')

            await TransactionService.fundAccount(
                account_number,
                amount,
                description
            )

            expect(spy).toHaveBeenCalledWith(
                account_number,
                amount,
                PaymentType.CREDIT,
                description
            )
        })
    })

    describe('withdrawFund', () => {
        it('should withdraw from the account by calling updateAccount with DEBIT type', async () => {
            const spy = jest.spyOn(TransactionService, 'updateAccount')

            await TransactionService.withdrawFund(
                account_number,
                amount,
                description
            )

            expect(spy).toHaveBeenCalledWith(
                account_number,
                amount,
                PaymentType.DEBIT,
                description
            )
        })
    })

    describe('transferFund', () => {
        it('should transfer funds between accounts by calling updateAccount for both sender and receiver', async () => {
            const sender_account = '1234567890'
            const receiver_account = '0987654321'
            const spy = jest.spyOn(TransactionService, 'updateAccount')

            await TransactionService.transferFund(
                sender_account,
                receiver_account,
                amount,
                description
            )

            expect(spy).toHaveBeenCalledWith(
                sender_account,
                amount,
                PaymentType.DEBIT,
                description
            )
            expect(spy).toHaveBeenCalledWith(
                receiver_account,
                amount,
                PaymentType.CREDIT,
                description
            )
        })
    })

    describe('transactionHistory', () => {
        it('should return account details and transaction history', async () => {
            const result =
                await TransactionService.transactionHistory(account_number)

            // Assertions for account and transaction results
            expect(mockAccountServiceInstance.accountDetails).toHaveBeenCalled()
            expect(
                TransactionModel.getAccountTransactions
            ).toHaveBeenCalledWith(mockAccountDetails.id)
            expect(result.account).toEqual(mockAccountDetails)
            expect(result.transactions).toEqual(mockTransactions)
        })

        it('should throw an InternalError if fetching transaction history fails', async () => {
            mockAccountServiceInstance.accountDetails.mockRejectedValueOnce(
                new Error('Database error')
            )

            await expect(
                TransactionService.transactionHistory(account_number)
            ).rejects.toThrow(InternalError)
        })
    })
})
