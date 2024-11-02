import { body, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'

import UserModel from '../models/user.model'
import EncryptionService from '../services/encryption.service'
import { CustomRequest } from '../types/auth.types'

export const validateLogin = [
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password')
        .isString()
        .notEmpty()
        .withMessage('A valid password is required'),
]

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

export const authenticateJWT = (
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string)

        req.user = decoded
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
