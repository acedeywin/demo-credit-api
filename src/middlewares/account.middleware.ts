import { query, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import UserModel from '../models/user.model'

/**
 * Validation middleware for account creation.
 * Ensures that the `user_id` query parameter is provided and is a non-empty string.
 */
export const validateAccountCreation = [
    query('user_id')
        .isString()
        .notEmpty()
        .withMessage('user_id query parameter is required.'),
]

/**
 * Handles validation errors for account creation.
 * Checks if there are any validation errors from `validateAccountCreation` middleware.
 * If errors exist, responds with a 400 status and an array of errors.
 * If no errors, checks if the user exists; if not, responds with a 401 status and an error message.
 * If validation passes and user exists, proceeds to the next middleware.
 *
 * @param {Request} req - The request object containing query parameters, including `user_id`.
 * @param {Response} res - The response object used to send back validation error messages or proceed.
 * @param {NextFunction} next - The next middleware function in the stack.
 */
export const handleAccountCreationValidationError = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() })
            return
        }

        const { user_id } = req.query

        const user = await UserModel.getUserByIdentifier({
            id: user_id as string,
        })

        if (!user) {
            res.status(401).json({ message: 'User does not exist' })
            return
        }

        next()
    } catch (error) {
        next(error)
    }
}
