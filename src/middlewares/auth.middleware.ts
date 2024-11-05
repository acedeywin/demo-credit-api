import { body, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'

import UserModel from '../models/user.model'
import EncryptionService from '../services/encryption.service'
import { CustomRequest } from '../types/auth.types'
import UserService from '../services/user.service'
import AuthService from '../services/auth.service'

/**
 * Validation for email field to ensure it is a valid email format.
 */
export const validateEmail = () =>
    body('email').isEmail().withMessage('A valid email is required.')

export const validateLogin = [
    validateEmail(),
    body('password')
        .isString()
        .notEmpty()
        .withMessage('A valid password is required'),
]

export const validateCode = [
    body('code').isString().notEmpty().withMessage('Code is required.'),
]

/**
 * Handles validation errors for login.
 * If validation fails or user is invalid, sends an appropriate response.
 * If validation succeeds, proceeds to the next middleware.
 *
 * @param {Request} req - The request object containing `email` and `password` in the body.
 * @param {Response} res - The response object used to send back validation error messages or proceed.
 * @param {NextFunction} next - The next middleware function in the stack.
 * @returns {Promise<void>}
 */
export const handleLoginValidatationErrors = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() })
            return
        }

        const { email, password } = req.body

        const user = await UserModel.getUserByIdentifier({ email })

        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' })
            return
        }

        if (!user?.email_verified) {
            const subject = 'Verification Code'
            res.status(401).json({
                status: 'success',
                message: `Please, verify your email. Verification code successfully sent to ${email}`,
            })
            await UserService.sendVerificationEmail(
                email,
                user.first_name,
                subject
            )
            return
        }

        // Validate password
        const isValidPassword = await EncryptionService.compare(
            password,
            user.password
        )
        if (!isValidPassword) {
            res.status(401).json({ message: 'Invalid email or password' })
            return
        }

        next()
    } catch (error) {
        next(error)
    }
}

export const resetPasswordValidation = [
    validateEmail(),

    /**
     * Middleware to handle validation errors for password reset requests.
     * If validation fails, responds with a 400 status and error details.
     * If validation passes, proceeds to the next middleware.
     *
     * @param {Request} req - The request object.
     * @param {Response} res - The response object used to send validation error messages or proceed.
     * @param {NextFunction} next - The next middleware function in the stack.
     */
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() })
                return
            }
            next()
        } catch (error) {
            next(error)
        }
    },
]

/**
 * Handles validation errors for password change requests.
 *
 * @param {CustomRequest} req - The custom request object containing user data.
 * @param {Response} res - The response object used to send back validation error messages or proceed.
 * @param {NextFunction} next - The next middleware function in the stack.
 */
export const handleChangePasswordvalidationError = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() })
            return
        }
        next()
    } catch (error) {
        next(error)
    }
}

/**
 * Middleware to authenticate JSON Web Token (JWT) in requests.
 * Checks for authorization header, verifies the token, and attaches user info to request.
 * Responds with 401 for missing/expired tokens or 403 for invalid tokens.
 *
 * @param {CustomRequest} req - The custom request object with user property.
 * @param {Response} res - The response object used to send back authentication error messages or proceed.
 * @param {NextFunction} next - The next middleware function in the stack.
 */
export const authenticateJWT = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader) {
            res.status(401).json({ message: 'Authorization header missing' })
            return
        }

        const token = authHeader.split(' ')[1]
        const decoded = await AuthService.verifyToken(token)

        req.user = decoded

        if (req.query.user_id !== req.user.id) {
            res.status(401).json({
                message: 'Unauthorised request.',
            })
            return
        }

        next()
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            res.status(401).json({
                message: 'Token expired. Please log in again.',
            })
            return
        } else if (error instanceof JsonWebTokenError) {
            res.status(403).json({ message: 'Invalid token' })
            return
        } else {
            console.error('Unexpected error:', error)
            res.status(500).json({ message: 'Internal server error' })
            return
        }
    }
}
