import jwt from 'jsonwebtoken'

import UserModel from '../models/user.model'
import { UserDto } from '../types/user.types'
import { omitValue } from '../utils/helpers'
import { InternalError } from '../utils/error.handler'
import UserService from './user.service'
import EncryptionService from './encryption.service'
import CacheService from './cache.service'

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
            throw new InternalError('User login could not be completed:', error)
        }
    }

    static async resetPassword(email: string){
        try {

            const user = await UserModel.getUserByIdentifier({ email })
            if(!user) return null
            const subject = 'Password Reset Code'

            await UserService.sendVerificationEmail(email, user?.first_name as string, subject)

            
        } catch (error) {
            throw new InternalError('Forgot password could not be completed:', error)
        }
    }

    static async changePassword(email: string, password: string){
        try {

            const user = await UserModel.getUserByIdentifier({ email })
            const hashedPassword = await EncryptionService.hash(password)

            await UserModel.updateUserById(user?.id as string, { password: hashedPassword } )
            await CacheService.invalidateCache(email)
            
        } catch (error) {
            throw new InternalError('Change password could not be completed:', error)  
        }
    }
}

export default AuthService
