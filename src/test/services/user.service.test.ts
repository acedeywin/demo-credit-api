import UserService from '../../services/user.service'
import UserModel from '../../models/user.model'
import AccountModel from '../../models/account.model'
import { UserDto, VerificationStatus } from '../../types/user.types'
import sendEmail from '../../utils/email'
import CacheService from '../../services/cache.service'
import EncryptionService from '../../services/encryption.service'
import {
    generateOtp,
    generateUniqueAccountNumber,
    omitValue,
} from '../../utils/helpers'
import { InternalError } from '../../utils/error.handler'
import redisClient from '../../config/redis'
import { AccountStatus } from '../../types/account.types'

jest.mock('../../models/user.model')
jest.mock('../../models/account.model')
jest.mock('../../utils/email')
jest.mock('../../services/cache.service')
jest.mock('../../services/encryption.service')
jest.mock('../../utils/helpers')

// Mock ioredis directly
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        quit: jest.fn().mockResolvedValue('OK'),
    }))
})

afterAll(async () => {
    await redisClient.quit()
})

describe('UserService', () => {
    const mockUser: UserDto = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        password: 'plaintextpassword',
        nin_verified: VerificationStatus.UNVERIFIED,
        id: '94cc-4310-b376',
        phone_number: '04354492123',
        dob: new Date('2024-11-01T14:45:35.000Z'),
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('createUser', () => {
        it('should create a user and send verification email', async () => {
            const plaintextpassword = 'plaintextpassword'
            const generatedAccountNumber = '1234567890'

            // Mock functions
            ;(generateUniqueAccountNumber as jest.Mock).mockResolvedValue(
                generatedAccountNumber
            )
            ;(EncryptionService.hash as jest.Mock).mockResolvedValue(
                plaintextpassword
            )
            ;(UserModel.createUser as jest.Mock).mockResolvedValue(true)
            ;(AccountModel.createAccount as jest.Mock).mockResolvedValue(true)
            ;(UserModel.createUser as jest.Mock).mockResolvedValue(true)
            ;(sendEmail as jest.Mock).mockResolvedValue(true)

            await UserService.createUser(mockUser)

            expect(generateUniqueAccountNumber).toHaveBeenCalled()
            expect(EncryptionService.hash).toHaveBeenCalledWith(
                mockUser.password
            )
            expect(UserModel.createUser).toHaveBeenCalledWith({
                ...mockUser,
                password: plaintextpassword,
                id: expect.any(String),
                nin_verified: VerificationStatus.VERIFIED,
            })
            expect(AccountModel.createAccount).toHaveBeenCalledWith({
                account_number: generatedAccountNumber,
                user_id: expect.any(String),
            })
            expect(sendEmail).toHaveBeenCalledWith(
                mockUser.email,
                expect.any(String),
                expect.any(String)
            )
        })

        it('should throw an InternalError if there is an error', async () => {
            ;(UserModel.createUser as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            await expect(UserService.createUser(mockUser)).rejects.toThrow(
                InternalError
            )
        })
    })

    describe('sendVerificationEmail', () => {
        it('should generate OTP, cache it, and send email', async () => {
            const generatedOtp = '123456'
            ;(generateOtp as jest.Mock).mockResolvedValue(generatedOtp)
            ;(CacheService.setCache as jest.Mock).mockResolvedValue(true)
            ;(sendEmail as jest.Mock).mockResolvedValue(true)

            await UserService.sendVerificationEmail(
                mockUser.email,
                mockUser.first_name
            )

            expect(generateOtp).toHaveBeenCalled()
            expect(CacheService.setCache).toHaveBeenCalledWith(
                mockUser.email,
                generatedOtp
            )
            expect(sendEmail).toHaveBeenCalledWith(
                mockUser.email,
                'Verification Code',
                expect.stringContaining(generatedOtp)
            )
        })

        it('should throw an InternalError if email sending fails', async () => {
            ;(sendEmail as jest.Mock).mockRejectedValue(
                new Error('Email error')
            )

            await expect(
                UserService.sendVerificationEmail(
                    mockUser.email,
                    mockUser.first_name
                )
            ).rejects.toThrow(InternalError)
        })
    })

    describe('getUserById', () => {
        it('should return user data and account information', async () => {
            const userData = { ...mockUser, password: 'plaintextpassword' }
            const accountData = {
                account_number: '1234567890',
                user_id: userData.id,
            }

            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
                userData
            )
            ;(AccountModel.getAccountById as jest.Mock).mockResolvedValue(
                accountData
            )
            ;(omitValue as jest.Mock).mockReturnValue({
                ...userData,
                password: undefined,
            })

            const result = await UserService.getUserById(
                userData.id as string,
                accountData.account_number
            )

            expect(UserModel.getUserByIdentifier).toHaveBeenCalledWith({
                id: userData.id,
            })
            expect(AccountModel.getAccountById).toHaveBeenCalledWith(
                accountData.account_number,
                userData.id
            )
            expect(omitValue).toHaveBeenCalledWith(userData, ['password'])
            expect(result).toEqual({
                user: { ...userData, password: undefined },
                account: accountData,
            })
        })

        it('should throw an InternalError if fetching user fails', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            await expect(
                UserService.getUserById('invalid_id', 'invalid_account_id')
            ).rejects.toThrow(InternalError)
        })
    })

    describe('verifyUser', () => {
        const email = 'user@example.com'
        const userId = '123'
        const mockUser = { id: userId, email, email_verified: false }

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it('should successfully verify the user, update the account, and clear the cache', async () => {
            // Mock the responses for each method
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
                mockUser
            )
            ;(UserModel.updateUserById as jest.Mock).mockResolvedValue(true)
            ;(
                AccountModel.updateAccountByIdOrUserId as jest.Mock
            ).mockResolvedValue(true)
            ;(CacheService.invalidateCache as jest.Mock).mockResolvedValue(true)

            // Call the function
            await UserService.verifyUser(email)

            // Verify each method was called with the correct parameters
            expect(UserModel.getUserByIdentifier).toHaveBeenCalledWith({
                email,
            })
            expect(UserModel.updateUserById).toHaveBeenCalledWith(userId, {
                email_verified: true,
            })
            expect(AccountModel.updateAccountByIdOrUserId).toHaveBeenCalledWith(
                { user_id: userId },
                { status: AccountStatus.ACTIVE }
            )
            expect(CacheService.invalidateCache).toHaveBeenCalledWith(email)
        })

        it('should throw an InternalError if any part of the process fails', async () => {
            // Mock `getUserByIdentifier` to throw an error
            ;(UserModel.getUserByIdentifier as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            await expect(UserService.verifyUser(email)).rejects.toThrow(
                InternalError
            )

            // Ensure no further calls are made if an error occurs
            expect(UserModel.updateUserById).not.toHaveBeenCalled()
            expect(
                AccountModel.updateAccountByIdOrUserId
            ).not.toHaveBeenCalled()
            expect(CacheService.invalidateCache).not.toHaveBeenCalled()
        })
    })
})
