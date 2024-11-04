/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express'
import {
    validateLogin,
    handleLoginValidatationErrors,
} from '../../middlewares/auth.middleware'
import UserModel from '../../models/user.model'
import EncryptionService from '../../services/encryption.service'
import UserService from '../../services/user.service'
import { validationResult } from 'express-validator'
import redisClient from '../../config/redis'

jest.mock('../../models/user.model')
jest.mock('../../services/encryption.service')
jest.mock('../../services/user.service')
jest.mock('../../services/auth.service')

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

describe('Auth Middleware Tests', () => {
    let req: Partial<Request>
    let res: Partial<Response>
    let next: NextFunction

    const email = 'user@example.com'
    const password = 'password123'
    const user = {
        id: '1',
        email,
        password: 'hashedPassword',
        email_verified: true,
        first_name: 'John',
    }

    beforeEach(() => {
        req = { body: { email, password } }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    // Helper function for validation middleware tests

    const runValidation = async (
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

    describe('validateLogin', () => {
        it('should return 400 if email is missing', async () => {
            req.body = { password } // Email is missing
            await runValidation(validateLogin, req, res, next)
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'A valid email is required.',
                    }),
                ]),
            })
        })

        it('should return 400 if password is missing', async () => {
            req.body = { email } // Password is missing
            await runValidation(validateLogin, req, res, next)
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        msg: 'A valid password is required',
                    }),
                ]),
            })
        })
    })

    describe('handleLoginValidatationErrors', () => {
        it('should return 401 if user is not found', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
                null
            )
            await handleLoginValidatationErrors(
                req as Request,
                res as Response,
                next
            )
            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid email or password',
            })
        })

        it('should send verification email if email is not verified', async () => {
            const unverifiedUser = { ...user, email_verified: false }
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
                unverifiedUser
            )
            await handleLoginValidatationErrors(
                req as Request,
                res as Response,
                next
            )
            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                message: `Please, verify your email. Verification code successfully sent to ${email}`,
            })
            expect(UserService.sendVerificationEmail).toHaveBeenCalledWith(
                email,
                unverifiedUser.first_name
            )
        })

        it('should return 401 if password is incorrect', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
                user
            )
            ;(EncryptionService.compare as jest.Mock).mockResolvedValue(false)
            await handleLoginValidatationErrors(
                req as Request,
                res as Response,
                next
            )
            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid email or password',
            })
        })

        it('should call next if validation is successful', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
                user
            )
            ;(EncryptionService.compare as jest.Mock).mockResolvedValue(true)
            await handleLoginValidatationErrors(
                req as Request,
                res as Response,
                next
            )
            expect(next).toHaveBeenCalled()
        })
    })
})
