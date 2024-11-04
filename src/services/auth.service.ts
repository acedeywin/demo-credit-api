import jwt from 'jsonwebtoken'

import UserModel from '../models/user.model'
import { UserDto } from '../types/user.types'
import { omitValue } from '../utils/helpers'
import { InternalError } from '../utils/error.handler'

class AuthService {
    static async generateToken(userId: string): Promise<string> {
        return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
            expiresIn: process.env.JWT_EXPIRY,
        })
    }

    static async verifyToken(token: string): Promise<unknown> {
        return jwt.verify(token, process.env.JWT_SECRET as string)
    }

    static async login(email: string) {
        try {
            const user = await UserModel.getUserByIdentifier({ email })
            const userData = omitValue(user as UserDto, ['password'])

            return { user: userData }
        } catch (error) {
            console.error('Error with user login:', error)
            throw new InternalError('User login could not be completed')
        }
    }
}

export default AuthService
