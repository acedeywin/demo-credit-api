/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express'
import {
    validateLogin,
    handleLoginValidatationErrors,
    authenticateJWT,
} from '../../middlewares/auth.middleware'
import UserModel from '../../models/user.model'
import EncryptionService from '../../services/encryption.service'
import UserService from '../../services/user.service'
import AuthService from '../../services/auth.service'
import { validationResult } from 'express-validator'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
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
        id: '12',
        email,
        password: 'hashedPassword',
        email_verified: true,
        first_name: 'John',
    }
    const unverifiedUser = { ...user, email_verified: false }
    const token = 'valid.jwt.token'
    const decodedUser = { id: '1', email: 'user@example.com' }

    beforeEach(() => {
        req = {
            body: { email, password },
            headers: { authorization: `Bearer ${token}` },
            query: {
                user_id: '123',
            },
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('validateLogin', () => {
        it('should return 400 if email is missing', async () => {
            req.body = { password }
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
            req.body = { email }
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
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
                unverifiedUser
            )
            const subject = 'Verification Code'
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
                unverifiedUser.first_name,
                subject
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

    describe('authenticateJWT', () => {
        it('should return 401 if authorization header is missing', async () => {
            req.headers = {}
            await authenticateJWT(req as Request, res as Response, next)
            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Authorization header missing',
            })
        })

        it('should return 401 if token has expired', async () => {
            ;(AuthService.verifyToken as jest.Mock).mockRejectedValue(
                new TokenExpiredError('Token expired', new Date())
            )
            await authenticateJWT(req as Request, res as Response, next)
            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Token expired. Please log in again.',
            })
        })

        it('should return 403 if token is invalid', async () => {
            ;(AuthService.verifyToken as jest.Mock).mockRejectedValue(
                new JsonWebTokenError('Invalid token')
            )
            await authenticateJWT(req as Request, res as Response, next)
            expect(res.status).toHaveBeenCalledWith(403)
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' })
        })

        it('should return 401 if user_id in query does not match decoded user id', async () => {
            decodedUser.id = '456' // Mock decoded token with a different ID

            // Mock the verifyToken method to return the decoded token
            AuthService.verifyToken = jest.fn().mockResolvedValue(decodedUser)

            await authenticateJWT(req as Request, res as Response, next)

            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Unauthorised request.',
            })
            expect(next).not.toHaveBeenCalled()
        })

        it('should call next if user_id in query matches decoded user id', async () => {
            decodedUser.id = '123'

            // Mock the verifyToken method to return the decoded token
            AuthService.verifyToken = jest.fn().mockResolvedValue(decodedUser)

            await authenticateJWT(req as Request, res as Response, next)

            expect(next).toHaveBeenCalled()
            expect(res.status).not.toHaveBeenCalled()
            expect(res.json).not.toHaveBeenCalled()
        })

        it('should return 500 for unexpected errors', async () => {
            const unexpectedError = new Error('Unexpected error')
            ;(AuthService.verifyToken as jest.Mock).mockRejectedValue(
                unexpectedError
            )
            await authenticateJWT(req as Request, res as Response, next)
            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Internal server error',
            })
        })
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
})
