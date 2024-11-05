import { v4 as uuidv4 } from 'uuid'
import AccountModel from '../models/account.model'
import UserModel from '../models/user.model'
import { AccountDto, AccountStatus } from '../types/account.types'
import { UserDto, VerificationStatus } from '../types/user.types'
import sendEmail from '../utils/email'
import { InternalError } from '../utils/error.handler'
import {
    generateOtp,
    generateUniqueAccountNumber,
    omitValue,
} from '../utils/helpers'
import CacheService from './cache.service'
import EncryptionService from './encryption.service'

/**
 * UserService provides methods for managing user accounts, including creation, verification, and email notifications.
 */
class UserService {
    /**
     * Creates a new user, hashes the password, generates a unique ID and account number, and sends a verification and welcome email.
     *
     * @param {UserDto} user - The user details to be created.
     * @returns {Promise<void>}
     * @throws {InternalError} - If user creation fails.
     */
    static async createUser(user: UserDto): Promise<void> {
        try {
            const account_number = await generateUniqueAccountNumber()

            user.nin_verified = VerificationStatus.VERIFIED
            const password = await EncryptionService.hash(user.password)
            user.password = password
            user.id = uuidv4()

            await UserModel.createUser(user)

            const account: AccountDto = {
                account_number,
                user_id: user.id,
            }

            const subject = 'Verification Code'
            const welcome_subject = 'Account Created Successfully'
            const welcome_message = `Hi ${user.first_name},\n\n Welcome to Demo Credit! Your account was successfully created.\n\n Account Number: ${account_number}`

            await AccountModel.createAccount(account)
            await this.sendVerificationEmail(
                user.email,
                user.first_name,
                subject
            )
            await sendEmail(user.email, welcome_subject, welcome_message)
        } catch (error) {
            console.error('Error creating user account:', error)
            throw new InternalError(
                'User account creation could not be completed'
            )
        }
    }

    /**
     * Sends a verification email with a one-time password (OTP) to the specified user.
     *
     * @param {string} email - The recipient's email address.
     * @param {string} first_name - The recipient's first name.
     * @param {string} subject - The subject of the email.
     * @returns {Promise<void>}
     * @throws {InternalError} - If email sending fails.
     */
    static async sendVerificationEmail(
        email: string,
        first_name: string,
        subject: string
    ): Promise<void> {
        try {
            const code = await generateOtp()
            const text = `Hi ${first_name},\n\n Your ${subject.toLocaleLowerCase()} is: ${code}.\n\n Do not share your code with anyone.`

            await CacheService.setCache(email, code)
            await sendEmail(email, subject, text)
        } catch (error) {
            console.error('Error sending email:', error)
            throw new InternalError('Email could not be sent.')
        }
    }

    /**
     * Retrieves a user by their ID and associated account information, excluding the password.
     *
     * @param {string} id - The unique user ID.
     * @returns {Promise<{ user: Partial<UserDto>; account: AccountDto | null }>} - The user's details and associated account.
     * @throws {InternalError} - If fetching the user fails.
     */
    static async getUserById(
        id: string
    ): Promise<{ user: Partial<UserDto>; account: AccountDto[] | null }> {
        try {
            const user = await UserModel.getUserByIdentifier({ id })
            const account = await AccountModel.getAccountByUserId(
                user?.id as string
            )

            const userData = omitValue(user as UserDto, ['password'])

            return { user: userData, account }
        } catch (error) {
            console.error('Error fetching user account:', error)
            throw new InternalError('User account could not be fetched')
        }
    }

    /**
     * Verifies a user's account by setting email verification status to true and activating the user's account.
     *
     * @param {string} email - The email address of the user to verify.
     * @returns {Promise<void>}
     * @throws {InternalError} - If user verification fails.
     */
    static async verifyUser(email: string): Promise<void> {
        try {
            const user = await UserModel.getUserByIdentifier({ email })

            await UserModel.updateUserById(user?.id as string, {
                email_verified: true,
            })
            await AccountModel.updateAccountByIdOrUserId(
                { user_id: user?.id },
                { status: AccountStatus.ACTIVE }
            )

            await CacheService.invalidateCache(email)
        } catch (error) {
            console.error('Error verifying user account:', error)
            throw new InternalError('User account could not be verified')
        }
    }
}

export default UserService
