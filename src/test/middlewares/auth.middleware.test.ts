/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express'
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken'

import {
    validateLogin,
    handleLoginValidatationErrors,
    authenticateJWT,
} from '../../middlewares/auth.middleware'
import UserModel from '../../models/user.model'
import EncryptionService from '../../services/encryption.service'
import { validationResult } from 'express-validator'

jest.mock('../../models/user.model')
jest.mock('../../services/encryption.service')
jest.mock('../../services/auth.service')
jest.mock('jsonwebtoken')

describe('Auth Middleware', () => {
    let req: Partial<Request>
    let res: Partial<Response>
    let next: NextFunction

    const email = 'user@example.com'
    const password = 'password123'
    const user = { id: '1', email, password: 'hashedPassword' }
    const token = 'valid.jwt.token'
    const decodedUser = { id: '1', email: 'user@example.com' }

    beforeEach(() => {
        req = {
            body: { email, password },
            headers: { authorization: `Bearer ${token}` },
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    // Helper function to run validation middlewares
    const runValidationWithErrors = async (
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
        it('should return 400 if email is missing or invalid', async () => {
            req.body = { password }
            await runValidationWithErrors(validateLogin, req, res, next)

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
            await runValidationWithErrors(validateLogin, req, res, next)

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

    describe('handleLoginValidationErrors', () => {
        it('should return 401 if user is not found', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
                null
            )

            await handleLoginValidatationErrors(
                req as Request,
                res as Response,
                next
            )

            expect(UserModel.getUserByIdentifier).toHaveBeenCalledWith({
                email,
            })
            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid email or password',
            })
        })

        it('should return 401 if password is invalid', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
                user
            )
            ;(EncryptionService.compare as jest.Mock).mockResolvedValue(false)

            await handleLoginValidatationErrors(
                req as Request,
                res as Response,
                next
            )

            expect(EncryptionService.compare).toHaveBeenCalledWith(
                password,
                user.password
            )
            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid email or password',
            })
        })

        it('should call next if user and password are valid', async () => {
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
        it('should return 401 if authorization header is missing', () => {
            req.headers = {}

            authenticateJWT(req as Request, res as Response, next)

            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Authorization header missing',
            })
        })

        it('should return 401 if token has expired', () => {
            ;(jwt.verify as jest.Mock).mockImplementation(() => {
                throw new TokenExpiredError('Token expired', new Date())
            })

            authenticateJWT(req as Request, res as Response, next)

            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Token expired. Please log in again.',
            })
        })

        it('should return 403 if token is invalid', () => {
            ;(jwt.verify as jest.Mock).mockImplementation(() => {
                throw new JsonWebTokenError('Invalid token')
            })

            authenticateJWT(req as Request, res as Response, next)

            expect(res.status).toHaveBeenCalledWith(403)
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' })
        })

        it('should call next and set req.user if token is valid', () => {
            ;(jwt.verify as jest.Mock).mockReturnValue(decodedUser)

            authenticateJWT(req as Request, res as Response, next)

            expect(jwt.verify).toHaveBeenCalledWith(
                token,
                process.env.JWT_SECRET
            )
            expect(req.user).toEqual(decodedUser)
            expect(next).toHaveBeenCalled()
        })

        it('should return 500 if an unexpected error occurs', () => {
            const error = new Error('Unexpected error')
            ;(jwt.verify as jest.Mock).mockImplementation(() => {
                throw error
            })

            authenticateJWT(req as Request, res as Response, next)

            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Internal server error',
            })
        })
    })
})
