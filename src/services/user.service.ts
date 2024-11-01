import { v4 as uuidv4 } from 'uuid'
import AccountModel from '../models/account.model'
import UserModel from '../models/user.model'
import { AccountDto } from '../types/account.types'
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

class UserService {
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

            await AccountModel.createAccount(account)

            await this.sendVerificationEmail(user.email, user.first_name)
        } catch (error) {
            console.error('Error creating user account:', error)
            throw new InternalError(
                'User account creation could not be completed'
            )
        }
    }

    static async sendVerificationEmail(
        email: string,
        first_name: string
    ): Promise<void> {
        try {
            const code = await generateOtp()

            const text = `Hi ${first_name},\n\n Your verification code is: ${code}.\n Do not share your code with anyone.`
            const subject = 'Verification Code'

            await CacheService.setCache(email, code)
            await sendEmail(email, subject, text)
        } catch (error) {
            console.error('Error sending email:', error)
            throw new InternalError('Email could not be sent.')
        }
    }

    static async getUserById(id: string, account_id: string) {
        try {
            const user = await UserModel.findUserById(id)
            const account = await AccountModel.getAccountById(
                account_id,
                user?.id as string
            )

            const userData = omitValue(user as UserDto, ['password'])

            return { user: userData, account }
        } catch (error) {
            console.error('Error fetching user account:', error)
            throw new InternalError('User account could not be fetched')
        }
    }
}

export default UserService
