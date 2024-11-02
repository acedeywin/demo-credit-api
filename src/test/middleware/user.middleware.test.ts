import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'

import {
    validateUserRegistration,
    handleUserRegistrationValidationErrors,
    validateFetchingUser,
} from '../../middleware/user.middleware'
import { verifyAge, compareUserInfo } from '../../utils/helpers'
import AdjutorService from '../../services/adjutor.service'
import UserModel from '../../models/user.model'
import AccountModel from '../../models/account.model'
import redisClient from '../../config/redis'

jest.mock('../../utils/helpers')
jest.mock('../../services/adjutor.service')
jest.mock('../../models/user.model')
jest.mock('../../models/account.model')

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

describe('User Registration Validation Middleware', () => {
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
        }
        res = {
            status: jest.fn().mockReturnThis() as unknown as Response['status'],
            json: jest.fn() as unknown as Response['json'],
        }
        next = jest.fn()

        // Default mock responses
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

    it('should pass validation for valid input', async () => {
        const middlewares = [
            ...validateUserRegistration,
            handleUserRegistrationValidationErrors,
        ]

        // Run each middleware in sequence
        for (const middleware of middlewares) {
            await middleware(req as Request, res as Response, next)
        }

        expect(next).toHaveBeenCalled()
    })

    it('should return 400 if any required field is missing', async () => {
        // Remove a required field, e.g., email
        req.body.email = ''

        // Run each middleware in validateUserRegistration
        for (const middleware of validateUserRegistration) {
            await middleware(req as Request, res as Response, next)
        }

        // Check validation result manually and call res.status if errors exist
        const errors = validationResult(req as Request)
        if (!errors.isEmpty()) {
            ;(res.status as jest.Mock).mockReturnThis() // Assert status as a function
            ;(res.json as jest.Mock).mockImplementation(() => {}) // Assert json as a function
            res.status!(400).json({ errors: errors.array() }) // // Non-null assertions
        }

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({
            errors: expect.arrayContaining([
                expect.objectContaining({ msg: 'A valid email is required.' }),
            ]),
        })
    })

    it('should return 400 if password does not meet requirements', async () => {
        req.body.password = 'weakpassword'
        const middlewares = [
            ...validateUserRegistration,
            handleUserRegistrationValidationErrors,
        ]

        await runMiddlewares(middlewares)

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

        // Run each middleware in validateUserRegistration
        for (const middleware of validateUserRegistration) {
            await middleware(req as Request, res as Response, next)
        }

        // Check validation result manually and call res.status if errors exist
        const errors = validationResult(req as Request)
        if (!errors.isEmpty()) {
            ;(res.status as jest.Mock).mockReturnThis() // Assert status as a function
            ;(res.json as jest.Mock).mockImplementation(() => {}) // Assert json as a function
            res.status!(400).json({ errors: errors.array() }) // Non-null assertions
        }

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({
            errors: expect.arrayContaining([
                expect.objectContaining({ msg: 'Passwords do not match.' }),
            ]),
        })
    })

    it('should return 403 if user already exists', async () => {
        ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue({ id: '1' })
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

    it('should return 403 if user is under 18', async () => {
        ;(verifyAge as jest.Mock).mockResolvedValue(false)
        await handleUserRegistrationValidationErrors(
            req as Request,
            res as Response,
            next
        )
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            message: 'Your age is below the legal age of 18.',
        })
    })

    it('should return 400 if NIN verification fails due to mismatched information', async () => {
        ;(compareUserInfo as jest.Mock).mockImplementationOnce(() => false)
        await handleUserRegistrationValidationErrors(
            req as Request,
            res as Response,
            next
        )
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            message:
                'NIN verification failed. Mismatched information. Account cannot be created.',
        })
    })

    it('should return 403 if karma check fails', async () => {
        ;(AdjutorService.karmaCheck as jest.Mock).mockResolvedValue(true)
        await handleUserRegistrationValidationErrors(
            req as Request,
            res as Response,
            next
        )
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            message: 'You are barred from using this service.',
        })
    })

    describe('validateFetchingUser', () => {
        it('should proceed if user and account are found', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue({
                id: '1',
            })
            ;(AccountModel.findAccountById as jest.Mock).mockResolvedValue({
                id: '2',
            })

            const middlewares = [
                ...validateUserRegistration,
                handleUserRegistrationValidationErrors,
            ]
            await runMiddlewares(middlewares)

            expect(next).toHaveBeenCalled()
        })

        it('should return 404 if user_id is missing', async () => {
            req.query = {} // Set empty query object

            await validateFetchingUser(req as Request, res as Response, next)
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Missing query parameter',
            })
        })
    })
})
