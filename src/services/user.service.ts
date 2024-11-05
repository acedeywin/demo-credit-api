import AccountModel from '../models/account.model'
import UserModel from '../models/user.model'
import { AccountDto, AccountStatus } from '../types/account.types'
import {
    UserAccountResponse,
    UserDto,
    VerificationStatus,
} from '../types/user.types'
import sendEmail from '../utils/email'
import { InternalError } from '../utils/error.handler'
import {
    generateOtp,
    generateUniqueAccountNumber,
    omitValue,
} from '../utils/helpers'
import CacheService from './cache.service'
import EncryptionService from './encryption.service'
import db from '../config/db/connection'
import AccountService from './account.service'

/**
 * UserService provides methods to manage user accounts, including creation, verification,
 * and communication with users through email notifications.
 */
class UserService {
    /**
     * Creates a new user account, hashes the user password, generates a unique user ID and account number,
     * and sends an email verification code to the user's registered email address.
     *
     * @param {UserDto} user - The user details for account creation.
     * @param {number} initial_deposit - The optional initial deposit amount for the user's account.
     * @returns {Promise<Partial<UserAccountResponse>>} - An object containing the created user and account information.
     * @throws {InternalError} - If account creation fails.
     */
    static async createUser(
        user: UserDto,
        initial_deposit?: number
    ): Promise<Partial<UserAccountResponse>> {
        try {
            const account_number = await generateUniqueAccountNumber()

            const account = await db.transaction(async (trx) => {
                user.nin_verified = VerificationStatus.VERIFIED
                const password = await EncryptionService.hash(user.password)
                user.password = password

                const created_user = await UserModel.createUser(user, trx)

                const account: AccountDto = {
                    account_number,
                    user_id: created_user?.id,
                    balance: Number(initial_deposit) || 0.0,
                }

                const subject = 'Verification Code'

                const created_account = await AccountService.createAccount(
                    account,
                    trx
                )
                if (created_account?.account_number) {
                    await this.sendVerificationEmail(
                        user.email,
                        user.first_name,
                        subject
                    )
                }

                return {
                    user: {
                        first_name: created_user.first_name,
                        last_name: created_user.last_name,
                        email: created_user.email,
                        phone_number: created_user.phone_number,
                        email_verified: Boolean(created_user.email_verified),
                        nin_verified: created_user.nin_verified,
                    },
                    account: {
                        account_number: created_account.account_number,
                        balance: created_account.balance,
                    },
                } as Partial<UserAccountResponse>
            })

            return account
        } catch (error) {
            console.error('Error creating user account:', error)
            throw new InternalError(
                'User account creation could not be completed'
            )
        }
    }

    /**
     * Sends an OTP-based verification email to the specified user.
     *
     * @param {string} email - The recipient's email address.
     * @param {string} first_name - The recipient's first name.
     * @param {string} subject - The email subject.
     * @returns {Promise<void>}
     * @throws {InternalError} - If sending the verification email fails.
     */
    static async sendVerificationEmail(
        email: string,
        first_name: string,
        subject: string
    ): Promise<void> {
        try {
            const code = await generateOtp()
            const text = `Hi ${first_name},\n\n Your ${subject.toLowerCase()} is: ${code}.\n\n Do not share your code with anyone.`

            await CacheService.setCache(email, code)
            await sendEmail(email, subject, text)
        } catch (error) {
            console.error('Error sending email:', error)
            throw new InternalError('Email could not be sent.')
        }
    }

    /**
     * Retrieves user information by user ID, including associated account details, with the password excluded.
     *
     * @param {string} id - The unique user ID.
     * @returns {Promise<{ user: Partial<UserDto>; account: AccountDto[] | null }>} - The user's profile and associated account(s).
     * @throws {InternalError} - If fetching user details fails.
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
     * Verifies a user's email and activates their account by setting the email verification status to true
     * and updating the account status to active.
     *
     * @param {string} email - The email address of the user to verify.
     * @returns {Promise<void>}
     * @throws {InternalError} - If the user verification process fails.
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
