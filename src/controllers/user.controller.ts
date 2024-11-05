import { NextFunction, Request, Response } from 'express'
import UserService from '../services/user.service'
import { omitValue } from '../utils/helpers'
import { UserDto } from '../types/user.types'

/**
 * UserController handles user-related operations, including creating new user accounts, 
 * retrieving user information by ID, and verifying user accounts.
 */
class UserController {
    /**
     * Creates a new user account by processing the request body, omitting any unnecessary fields, 
     * and initiating the account creation process in the UserService. Sends a verification email
     * upon successful account creation.
     *
     * @param {Request} req - The HTTP request object containing user details in the body.
     * Expected fields include `email`, `password`, and `initial_deposit` among others.
     * @param {Response} res - The HTTP response object for sending the result of the request.
     * @param {NextFunction} next - The next middleware function in the stack for error handling.
     */
    static async createUser(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const { initial_deposit } = req.body;
            const values = omitValue(req.body, ['confirm_password', 'nin', 'initial_deposit']);
            const data = await UserService.createUser(values as UserDto, initial_deposit);

            res.status(201).json({
                status: 'success',
                message: `Account successfully created. Verification code sent to ${data.user?.email}`,
                data
            });
            return
        } catch (error) {
            next(error);
        }
    }

    /**
     * Retrieves a user account by their unique ID. It extracts `user_id` from the query parameters 
     * and uses UserService to fetch the user details.
     *
     * @param {Request} req - The HTTP request object containing `user_id` in the query parameters.
     * @param {Response} res - The HTTP response object for sending the result of the request.
     * @param {NextFunction} next - The next middleware function in the stack for error handling.
     */
    static async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const { user_id } = req.query;

            const user = await UserService.getUserById(user_id as string);

            res.status(201).json({
                status: 'success',
                message: 'User account fetched successfully.',
                data: user,
            });
            return
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verifies a user account based on the provided email address. UserService is used to update 
     * the user’s verification status to active, allowing them to proceed with login.
     *
     * @param {Request} req - The HTTP request object containing `email` in the body for verification.
     * @param {Response} res - The HTTP response object for sending the result of the verification process.
     * @param {NextFunction} next - The next middleware function in the stack for error handling.
     */
    static async verifyUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body;

            await UserService.verifyUser(email);

            res.status(201).json({
                status: 'success',
                message: 'Account successfully verified. Proceed to login.',
            });
            return
        } catch (error) {
            next(error);
        }
    }
}

export default UserController;
