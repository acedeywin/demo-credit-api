import jwt from 'jsonwebtoken'

import UserModel from '../models/user.model'
import { UserDto } from '../types/user.types'
import { omitValue } from '../utils/helpers'
import { InternalError } from '../utils/error.handler'
import UserService from './user.service'
import EncryptionService from './encryption.service'
import CacheService from './cache.service'

/**
 * AuthService provides authentication and authorization-related functionality, including token generation, verification, login, and password management.
 */
class AuthService {
    /**
     * Generates a JWT token for a specified user ID.
     *
     * @param {string} userId - The unique user ID.
     * @returns {Promise<string>} - The generated JWT token.
     */
    static async generateToken(userId: string): Promise<string> {
        return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
            expiresIn: process.env.JWT_EXPIRY,
        })
    }

    /**
     * Verifies a given JWT token.
     *
     * @param {string} token - The JWT token to verify.
     * @returns {Promise<unknown>} - The decoded token payload.
     */
    static async verifyToken(token: string): Promise<unknown> {
        return jwt.verify(token, process.env.JWT_SECRET as string)
    }

    /**
     * Logs in a user by retrieving user details based on email and omitting the password from the returned data.
     *
     * @param {string} email - The user's email address.
     * @returns {Promise<{ user: Partial<UserDto> }>} - An object containing user details without the password.
     * @throws {InternalError} - If the login operation fails.
     */
    static async login(email: string): Promise<{ user: Partial<UserDto> }> {
        try {
            const user = await UserModel.getUserByIdentifier({ email })
            const userData = omitValue(user as UserDto, ['password'])

            return { user: userData }
        } catch (error) {
            console.error('Error with user login:', error)
            throw new InternalError('User login could not be completed:', error)
        }
    }

    /**
     * Sends a password reset verification email to the specified user's email address.
     *
     * @param {string} email - The email address of the user requesting a password reset.
     * @returns {Promise<void | null>} - Resolves if the operation is successful, or null if the user does not exist.
     * @throws {InternalError} - If the password reset operation fails.
     */
    static async resetPassword(email: string): Promise<void | null> {
        try {
            const user = await UserModel.getUserByIdentifier({ email })
            if (!user) return null
            const subject = 'Password Reset Code'

            await UserService.sendVerificationEmail(
                email,
                user?.first_name as string,
                subject
            )
        } catch (error) {
            throw new InternalError(
                'Forgot password could not be completed:',
                error
            )
        }
    }

    /**
     * Changes the password for a user by updating the hashed password in the database.
     *
     * @param {string} email - The email address of the user changing the password.
     * @param {string} password - The new password to be set for the user.
     * @returns {Promise<void>}
     * @throws {InternalError} - If the change password operation fails.
     */
    static async changePassword(
        email: string,
        password: string
    ): Promise<void> {
        try {
            const user = await UserModel.getUserByIdentifier({ email })
            const hashedPassword = await EncryptionService.hash(password)

            await UserModel.updateUserById(user?.id as string, {
                password: hashedPassword,
            })
            await CacheService.invalidateCache(email)
        } catch (error) {
            throw new InternalError(
                'Change password could not be completed:',
                error
            )
        }
    }
}

export default AuthService
