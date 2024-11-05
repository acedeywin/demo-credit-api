import { NextFunction, Request, Response } from 'express'
import AuthService from '../services/auth.service'

/**
 * AuthController handles authentication-related requests.
 */
class AuthController {
    /**
     * Logs in a user by generating a JWT.
     *
     * @param {Request} req - The request object containing user email in the body.
     * @param {Response} res - The response object used to send back the result.
     * @param {NextFunction} next - The next middleware function in the stack.
     */
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await AuthService.login(req.body.email)

            // Generate JWT
            const token = await AuthService.generateToken(
                user.user.id as string
            )

            res.status(200).json({
                status: 'success',
                message: 'Logged in successfully',
                token,
                data: user,
            })
            return
        } catch (error) {
            next(error)
        }
    }

    /**
     * Logs out a user by returning a success message.
     *
     * @param {Request} req - The request object.
     * @param {Response} res - The response object used to send back the result.
     */
    static async logout(req: Request, res: Response) {
        // On the client side, logging out involves deleting the JWT.
        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully.',
        })
        return
    }

    /**
     * Sends a password reset code to the user's email if it exists.
     *
     * @param {Request} req - The request object containing the user email in the body.
     * @param {Response} res - The response object used to send back the result.
     * @param {NextFunction} next - The next middleware function in the stack.
     */
    static async resetPassword(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { email } = req.body

            await AuthService.resetPassword(email)

            res.status(200).json({
                status: 'success',
                message: `A password reset code has been sent to ${email} if it exists.`,
            })
            return
        } catch (error) {
            next(error)
        }
    }

    /**
     * Changes the user's password.
     *
     * @param {Request} req - The request object containing the user email and new password in the body.
     * @param {Response} res - The response object used to send back the result.
     * @param {NextFunction} next - The next middleware function in the stack.
     */
    static async changePassword(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { email, password } = req.body

            await AuthService.changePassword(email, password)

            res.status(200).json({
                status: 'success',
                message: 'Password reset was successful.',
            })
            return
        } catch (error) {
            next(error)
        }
    }
}

export default AuthController
