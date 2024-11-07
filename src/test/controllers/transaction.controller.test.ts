import { Request, Response, NextFunction } from 'express'
import TransactionController from '../../controllers/transaction.controller'
import TransactionService from '../../services/transaction.service'
import { PaymentType } from '../../types/account.types'

jest.mock('../../services/transaction.service')

describe('TransactionController', () => {
    let req: Partial<Request>
    let res: Partial<Response>
    let next: NextFunction

    beforeEach(() => {
        req = {
            body: {},
            query: {},
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('fundAccount', () => {
        it('should fund an account successfully', async () => {
            req.body = {
                amount: 100,
                description: 'Test funding',
                account_number: '1234567890',
            }
            await TransactionController.fundAccount(
                req as Request,
                res as Response,
                next
            )

            expect(TransactionService.fundAccount).toHaveBeenCalledWith(
                '1234567890',
                100,
                'Test funding'
            )
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Account funding successful.',
            })
        })

        it('should handle errors in funding account', async () => {
            const error = new Error('Funding error')
            ;(
                TransactionService.fundAccount as jest.Mock
            ).mockRejectedValueOnce(error)

            await TransactionController.fundAccount(
                req as Request,
                res as Response,
                next
            )

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('withdrawFund', () => {
        it('should withdraw funds successfully', async () => {
            req.body = {
                amount: 50,
                description: 'Test withdrawal',
                account_number: '1234567890',
            }
            await TransactionController.withdrawFund(
                req as Request,
                res as Response,
                next
            )

            expect(TransactionService.withdrawFund).toHaveBeenCalledWith(
                '1234567890',
                50,
                'Test withdrawal'
            )
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Fund withdrawal successful.',
            })
        })

        it('should handle errors in withdrawing funds', async () => {
            const error = new Error('Withdrawal error')
            ;(
                TransactionService.withdrawFund as jest.Mock
            ).mockRejectedValueOnce(error)

            await TransactionController.withdrawFund(
                req as Request,
                res as Response,
                next
            )

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('transferFund', () => {
        it('should transfer funds successfully', async () => {
            req.body = {
                amount: 30,
                description: 'Test transfer',
                sender_account: '1234567890',
                receiver_account: '0987654321',
            }
            await TransactionController.transferFund(
                req as Request,
                res as Response,
                next
            )

            expect(TransactionService.transferFund).toHaveBeenCalledWith(
                '1234567890',
                '0987654321',
                30,
                'Test transfer'
            )
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Fund transfer successful.',
            })
        })

        it('should handle errors in transferring funds', async () => {
            const error = new Error('Transfer error')
            ;(
                TransactionService.transferFund as jest.Mock
            ).mockRejectedValueOnce(error)

            await TransactionController.transferFund(
                req as Request,
                res as Response,
                next
            )

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('transactionHistory', () => {
        it('should fetch transaction history successfully', async () => {
            req.query = { account_number: '1234567890', page: '1', size: '10' }
            const mockTransactions = {
                account: { id: '123', balance: 1000 },
                transactions: [
                    {
                        id: 't1',
                        amount: 50,
                        transaction_type: PaymentType.CREDIT,
                    },
                    {
                        id: 't2',
                        amount: 30,
                        transaction_type: PaymentType.DEBIT,
                    },
                ],
                totalPages: 6,
                currentPage: 1,
                page: 1
            }
            ;(
                TransactionService.transactionHistory as jest.Mock
            ).mockResolvedValueOnce(mockTransactions)

            await TransactionController.transactionHistory(
                req as Request,
                res as Response,
                next
            )

            expect(TransactionService.transactionHistory).toHaveBeenCalledWith(
                '1234567890',
                1,
                10
            )
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Transactions fetched successfully.',
                data: mockTransactions,
            })
        })

        it('should handle errors in fetching transaction history', async () => {
            const error = new Error('History fetch error')
            ;(
                TransactionService.transactionHistory as jest.Mock
            ).mockRejectedValueOnce(error)

            await TransactionController.transactionHistory(
                req as Request,
                res as Response,
                next
            )

            expect(next).toHaveBeenCalledWith(error)
        })
    })
})
