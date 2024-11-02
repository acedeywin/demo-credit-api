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
                message: 'Logged in successfully',
                token,
                data: user,
            })
        } catch (error) {
            next(error)
        }
    }

    static logout(req: Request, res: Response) {
        // On the client side, logging out involves deleting the JWT.
        res.status(200).json({ message: 'Logged out successfully' });
    }
}

export default AuthController
