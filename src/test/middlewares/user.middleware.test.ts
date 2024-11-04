import { Request, Response, NextFunction } from 'express'
import {
    validateUserRegistration,
    handleUserRegistrationValidationErrors,
    validateFetchingUser,
    handleUserValidationErrors,
    handleUserVerificationValidationErrors,
    validateUserData,
} from '../../middlewares/user.middleware'
import { verifyAge, compareUserInfo } from '../../utils/helpers'
import AdjutorService from '../../services/adjutor.service'
import UserModel from '../../models/user.model'
import AccountModel from '../../models/account.model'
import CacheService from '../../services/cache.service'
import redisClient from '../../config/redis'

jest.mock('../../utils/helpers')
jest.mock('../../services/adjutor.service')
jest.mock('../../models/user.model')
jest.mock('../../models/account.model')
jest.mock('../../services/cache.service')

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

describe('User Middleware Tests', () => {
    let req: Partial<Request>
    let res: Partial<Response>
    let next: NextFunction

    beforeEach(() => {
        req = {
            body: {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                password: 'StrongPassword1!',
                confirm_password: 'StrongPassword1!',
                phone_number: '08031234567',
                nin: '12345678901',
                dob: '2000-01-01',
            },
            query: { user_id: '123' },
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        next = jest.fn()
        ;(verifyAge as jest.Mock).mockResolvedValue(true)
        ;(compareUserInfo as jest.Mock).mockResolvedValue(true)
        ;(AdjutorService.verifyNIN as jest.Mock).mockResolvedValue({
            first_name: 'John',
            last_name: 'Doe',
            mobile: '08031234567',
        })
        ;(AdjutorService.karmaCheck as jest.Mock).mockResolvedValue(false)
        ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(null)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runMiddlewares = async (middlewares: any[]) => {
        for (const middleware of middlewares) {
            await middleware(req as Request, res as Response, next)
        }
    }

    describe('User Registration Validation Middleware', () => {
        it('should pass validation for valid input', async () => {
            await runMiddlewares([
                ...validateUserRegistration,
                handleUserRegistrationValidationErrors,
            ])
            expect(next).toHaveBeenCalled()
        })

        it('should return 400 if any required field is missing', async () => {
            req.body.first_name = ''
            await runMiddlewares([
                ...validateUserRegistration,
                handleUserRegistrationValidationErrors,
            ])
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'First name is required.',
                    }),
                ]),
            })
        })

        it('should return 400 if password does not meet requirements', async () => {
            req.body.password = 'weakpass'
            await runMiddlewares([
                ...validateUserData,
                handleUserRegistrationValidationErrors,
            ])
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'Password should contain at least 1 uppercase character, 1 lowercase, 1 number, 1 symbol, and should be at least 8 characters long.',
                    }),
                ]),
            })
        })

        it('should return 400 if password and confirm_password do not match', async () => {
            req.body.confirm_password = 'DifferentPassword!'
            await runMiddlewares([
                ...validateUserData,
                handleUserRegistrationValidationErrors,
            ])
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                errors: expect.arrayContaining([
                    expect.objectContaining({ msg: 'Passwords do not match.' }),
                ]),
            })
        })

        it('should return 403 if phone number already exists', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue({
                phone_number: req.body.phone_number,
            })
            await handleUserRegistrationValidationErrors(
                req as Request,
                res as Response,
                next
            )
            expect(res.status).toHaveBeenCalledWith(403)
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Phone number already exist.',
            })
        })

        it('should return 403 if email already exists', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue({
                email: req.body.email,
            })
            await handleUserRegistrationValidationErrors(
                req as Request,
                res as Response,
                next
            )
            expect(res.status).toHaveBeenCalledWith(403)
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'You already have an account.',
            })
        })
    })

    describe('Fetching User Validation Middleware', () => {
        const email = 'user@example.com'
        const code = '123456'

        beforeEach(() => {
            req.body = { email, code }
            jest.clearAllMocks()
        })

        it('should return 400 if user_id is missing in query', async () => {
            req.query = {} // Simulate missing user_id
            const middlewares = [
                ...validateFetchingUser,
                handleUserValidationErrors,
            ]

            await runMiddlewares(middlewares) // Execute both validation and error handling middlewares
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'user_id query parameter is required.',
                    }),
                ]),
            })
        })

        it('should return 404 if user is not found', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
                null
            )
            await handleUserValidationErrors(
                req as Request,
                res as Response,
                next
            )
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'User not found',
            })
        })

        it('should return 404 if account is not found', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue({
                id: '123',
            })
            ;(AccountModel.getAccountByUserId as jest.Mock).mockResolvedValue(
                null
            )
            await handleUserValidationErrors(
                req as Request,
                res as Response,
                next
            )
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Account not found',
            })
        })

        it('should call next if verification is successful', async () => {
            // Mock expected values for successful verification
            ;(CacheService.getCache as jest.Mock).mockResolvedValue(
                code
            )
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue({
                id: '1',
                email,
            })

            await handleUserVerificationValidationErrors(
                req as Request,
                res as Response,
                next
            )

            // Check that the cache and user model are accessed as expected
            expect(CacheService.getCache).toHaveBeenCalledWith(email)
            expect(UserModel.getUserByIdentifier).toHaveBeenCalledWith({
                email,
            })
            // Verify that next() is called to proceed to the next middleware
            expect(next).toHaveBeenCalled()
        })
    })

    describe('User Verification Validation Middleware', () => {
        const email = 'user@example.com'
        const code = '123456'

        beforeEach(() => {
            req.body = { email, code }
            jest.clearAllMocks()
        })

        it('should return 404 if cache is not found for email', async () => {
            ;(CacheService.getCache as jest.Mock).mockResolvedValue(null)
            await handleUserVerificationValidationErrors(
                req as Request,
                res as Response,
                next
            )
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid Request',
                status: 'success',
            })
        })

        it('should return 404 if code does not match cached code', async () => {
            ;(CacheService.getCache as jest.Mock).mockResolvedValue('654321')
            await handleUserVerificationValidationErrors(
                req as Request,
                res as Response,
                next
            )
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid Request',
                status: 'success',
            })
        })

        it('should return 404 if user is not found for the email', async () => {
            ;(CacheService.getCache as jest.Mock).mockResolvedValue(code)
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
                null
            )
            await handleUserVerificationValidationErrors(
                req as Request,
                res as Response,
                next
            )
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid Request',
                status: 'success',
            })
        })

        it('should call next if verification is successful', async () => {
            // Mock expected values for successful verification
            ;(CacheService.getCache as jest.Mock).mockResolvedValue(
                code
            )
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue({
                id: '1',
                email,
            })

            await handleUserVerificationValidationErrors(
                req as Request,
                res as Response,
                next
            )

            // Check that the cache and user model are accessed as expected
            expect(CacheService.getCache).toHaveBeenCalledWith(email)
            expect(UserModel.getUserByIdentifier).toHaveBeenCalledWith({
                email,
            })
            // Verify that next() is called to proceed to the next middleware
            expect(next).toHaveBeenCalled()
        })

        it('should call next with an error if an exception is thrown', async () => {
            const error = new Error('Database error')
            ;(CacheService.getCache as jest.Mock).mockRejectedValue(error)
            await handleUserVerificationValidationErrors(
                req as Request,
                res as Response,
                next
            )
            expect(next).toHaveBeenCalledWith(error)
        })
    })
})
