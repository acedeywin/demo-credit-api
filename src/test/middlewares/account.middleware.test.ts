/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    validateAccountCreation,
    handleAccountCreationValidationError,
} from '../../middlewares/account.middleware'
import { Request, Response, NextFunction } from 'express'
import UserModel from '../../models/user.model'
import { validationResult } from 'express-validator'

jest.mock('../../models/user.model')

describe('Account Middleware Tests', () => {
    let req: Partial<Request>
    let res: Partial<Response>
    let next: NextFunction

    beforeEach(() => {
        req = {
            query: { user_id: '123' },
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        next = jest.fn()
    })

    // Helper function to run validations and handle errors manually

    const runValidationWithResult = async (
        middlewares: any[],
        req: Partial<Request>,
        res: Partial<Response>,
        next: NextFunction
    ) => {
        for (const middleware of middlewares) {
            await middleware(req as Request, res as Response, next)
        }
        const errors = validationResult(req as Request)
        if (!errors.isEmpty()) {
            res.status!(400).json({ errors: errors.array() })
        }
    }

    describe('validateAccountCreation', () => {
        it('should return 400 if user_id is missing in query', async () => {
            req.query = {} // Set query to empty to trigger validation error

            await runValidationWithResult(
                validateAccountCreation,
                req,
                res,
                next
            )

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'user_id query parameter is required.',
                    }),
                ]),
            })
        })
    })

    describe('handleAccountCreationValidationError', () => {
        it('should return 401 if user does not exist', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
                null
            )

            await handleAccountCreationValidationError(
                req as Request,
                res as Response,
                next
            )

            expect(UserModel.getUserByIdentifier).toHaveBeenCalledWith({
                id: '123',
            })
            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({
                message: 'User does not exist',
            })
        })

        it('should call next if user exists', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue({
                id: '123',
            })

            await handleAccountCreationValidationError(
                req as Request,
                res as Response,
                next
            )

            expect(UserModel.getUserByIdentifier).toHaveBeenCalledWith({
                id: '123',
            })
            expect(next).toHaveBeenCalled()
        })

        it('should call next with error if an exception is thrown', async () => {
            const error = new Error('Database error')
            ;(UserModel.getUserByIdentifier as jest.Mock).mockRejectedValue(
                error
            )

            await handleAccountCreationValidationError(
                req as Request,
                res as Response,
                next
            )

            expect(next).toHaveBeenCalledWith(error)
        })
    })
})
