import { query, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import UserModel from '../models/user.model'

export const validateAccountCreation = [
    query('user_id')
        .isString()
        .notEmpty()
        .withMessage('user_id query parameter is required.'),
]

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
