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
                data: { account_number: account },
            })
            return
        } catch (error) {
            next(error)
        }
    }
}

export default AccountController
