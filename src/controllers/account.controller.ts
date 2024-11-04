import { NextFunction, Request, Response } from 'express'
import AccountService from '../services/account.service'

class AccountController {
    static async createAccount(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { user_id } = req.query

            const account = await AccountService.createNewAccount(
                user_id as string
            )

            res.status(201).json({
                status: 'success',
                message: 'User account created successfully',
                data: account,
            })
            return
        } catch (error) {
            next(error)
        }
    }
} //209cf65b-df32-42c6-b8e4-e80f02886753

export default AccountController
