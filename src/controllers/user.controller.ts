import { NextFunction, Request, Response } from 'express'
import UserService from '../services/user.service'
import { omitValue } from '../utils/helpers'
import { UserDto } from '../types/user.types'

/**
 * UserController handles user-related requests such as account creation, retrieval, and verification.
 */
class UserController {
    /**
     * Creates a new user account, omitting unnecessary fields from the request body.
     *
     * @param {Request} req - The request object containing user details in the body, including `email`, `password`, and others.
     * @param {Response} res - The response object used to send back the result.
     * @param {NextFunction} next - The next middleware function in the stack.
     * @returns {Promise<void>}
     */
    static async createUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const values = omitValue(req.body, ['confirm_password', 'nin'])
            await UserService.createUser(values as UserDto)

            res.status(201).json({
                status: 'success',
                message: `Account successfully created. Verification code sent to ${req.body.email}`,
            })
            return
        } catch (error) {
            next(error)
        }
    }

    /**
     * Retrieves a user account by its ID.
     *
     * @param {Request} req - The request object containing `user_id` in the query.
     * @param {Response} res - The response object used to send back the result.
     * @param {NextFunction} next - The next middleware function in the stack.
     */
    static async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const { user_id } = req.query

            const user = await UserService.getUserById(user_id as string)

            res.status(201).json({
                status: 'success',
                message: 'User account fetched successfully.',
                data: user,
            })
            return
        } catch (error) {
            next(error)
        }
    }

    /**
     * Verifies a user account using the provided email.
     *
     * @param {Request} req - The request object containing `email` in the body.
     * @param {Response} res - The response object used to send back the result.
     * @param {NextFunction} next - The next middleware function in the stack.
     */
    static async verifyUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body

            await UserService.verifyUser(email)

            res.status(201).json({
                status: 'success',
                message: 'Account successfully verified. Proceed to login.',
            })
            return
        } catch (error) {
            next(error)
        }
    }
}

export default UserController
