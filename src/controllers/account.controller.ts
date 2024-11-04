import { NextFunction, Request, Response } from 'express'
import AccountService from '../services/account.service'

/**
 * AccountController handles account-related requests.
 */
class AccountController {
    /**
     * Creates a new user account.
     *
     * @param {Request} req - The incoming request object containing the `user_id` in the query.
     * @param {Response} res - The response object used to send back the result.
     * @param {NextFunction} next - The next middleware function in the stack.
     */
    static async createAccount(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { user_id } = req.query

            // Calls the AccountService to create a new account for the given user ID
            const account = await AccountService.createNewAccount(
                user_id as string
            )

            // Sends a success response with the account number
            res.status(201).json({
                status: 'success',
                message: 'User account created successfully',
                data: { account_number: account },
            })
            return
        } catch (error) {
            next(error)
        }
    }
}

export default AccountController
