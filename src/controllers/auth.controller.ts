import { NextFunction, Request, Response } from 'express'
import AuthService from '../services/auth.service'

class AuthController {
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
        } catch (error) {
            next(error)
        }
    }

    static async logout(req: Request, res: Response) {
        // On the client side, logging out involves deleting the JWT.
        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully.',
        })
    }

    static async resetPassword(req: Request, res: Response, next: NextFunction){

        try {

            const { email } = req.body

            await AuthService.resetPassword(email)

            res.status(200).json({
                status: 'success',
                message: `A password reset code will been sent to ${email} if it exist.`,
            })
            return
            
        } catch (error) {
            next(error)
        }

    }

    static async changePassword(req: Request, res: Response, next: NextFunction){
        try {

            const { email, password } = req.body

            await AuthService.changePassword(email, password)

            res.status(200).json({
                status: 'success',
                message: 'Password reset was successful.',
            })
            
        } catch (error) {
            next(error)
        }
    }

}

export default AuthController
