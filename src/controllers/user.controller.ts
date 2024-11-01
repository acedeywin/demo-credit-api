import { NextFunction, Request, Response } from 'express'

import UserService from '../services/user.service'
import { omitValue } from '../utils/helpers'
import { UserDto } from '../types/user.types'

class UserController {
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
                message: 'User account created successfully',
            })
            return
        } catch (error) {
            next(error)
        }
    }

    static async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const { user_id, account_id } = req.query

            const user = await UserService.getUserById(
                user_id as string,
                account_id as string
            )

            res.status(201).json({
                status: 'success',
                message: 'User account fetched successfully',
                user,
            })
            return
        } catch (error) {
            next(error)
        }
    }
}

export default UserController
