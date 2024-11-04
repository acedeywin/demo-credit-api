/* eslint-disable @typescript-eslint/no-explicit-any */
import { validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import AccountModel from '../../models/account.model'
import { handleWithdrawalValidationErrors } from '../../middlewares/transaction.middleware'
import { AccountStatus } from '../../types/account.types'

jest.mock('../../models/account.model')

// Explicitly cast `validationResult` to Jest's mocked function type
jest.mock('express-validator', () => {
    const originalModule = jest.requireActual('express-validator')
    return {
        ...originalModule,
        validationResult: jest.fn(),
    }
})

const mockValidationResult = validationResult as jest.MockedFunction<
    typeof validationResult
>

describe('Transaction Middleware Tests', () => {
    let req: Partial<Request>
    let res: Partial<Response>
    let next: NextFunction

    beforeEach(() => {
        req = { body: {}, query: {} }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    // Helper function to mock `validationResult`
    const setMockValidationResult = (isValid: boolean, errors: any[] = []) => {
        mockValidationResult.mockReturnValue({
            isEmpty: () => isValid,
            array: () => errors,
        } as any)
    }

    describe('handleWithdrawalValidationErrors', () => {
        it('should return 400 if validation errors are present', async () => {
            setMockValidationResult(false, [{ msg: 'Invalid input' }])

            await handleWithdrawalValidationErrors(
                req as Request,
                res as Response,
                next
            )

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                errors: [{ msg: 'Invalid input' }],
            })
        })

        it('should return 403 if account does not exist', async () => {
            setMockValidationResult(true)
            ;(AccountModel.getAccountDetils as jest.Mock).mockResolvedValue(
                null
            )
            req.body.account_number = '1234567890'

            await handleWithdrawalValidationErrors(
                req as Request,
                res as Response,
                next
            )

            expect(res.status).toHaveBeenCalledWith(403)
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Account does not exist.',
            })
        })

        it('should call next if all validations pass', async () => {
            setMockValidationResult(true)
            ;(AccountModel.getAccountDetils as jest.Mock).mockResolvedValue({
                balance: 500,
                status: AccountStatus.ACTIVE,
            })
            req.body = { account_number: '1234567890', amount: 100 }

            await handleWithdrawalValidationErrors(
                req as Request,
                res as Response,
                next
            )

            expect(next).toHaveBeenCalled()
        })
    })
})
