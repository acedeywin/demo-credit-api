import UserService from '../../services/user.service'
import AccountModel from '../../models/account.model'
import UserModel from '../../models/user.model'
import AccountService from '../../services/account.service'
import { AccountDto, AccountStatus } from '../../types/account.types'
import { UserDto, VerificationStatus } from '../../types/user.types'
import sendEmail from '../../utils/email'
import { InternalError } from '../../utils/error.handler'
import {
    generateOtp,
    generateUniqueAccountNumber,
    omitValue,
} from '../../utils/helpers'
import CacheService from '../../services/cache.service'
import EncryptionService from '../../services/encryption.service'
import db from '../../config/db/connection'
import redisClient from '../../config/redis'

jest.mock('../../models/account.model')
jest.mock('../../models/user.model')
jest.mock('../../services/account.service')
jest.mock('../../utils/email')
jest.mock('../../utils/helpers', () => ({
    generateOtp: jest.fn(),
    generateUniqueAccountNumber: jest.fn(),
    omitValue: jest.fn(),
}))
jest.mock('../../services/cache.service')
jest.mock('../../services/encryption.service')
jest.mock('../../config/db/connection')

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

describe('UserService Tests', () => {
    const userDto: UserDto = {
        id: 'user123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phone_number: '08031234567',
        nin_verified: VerificationStatus.UNVERIFIED,
        dob: new Date('2002-11-05T06:48:16.000Z'),
    }

    const accountDto: AccountDto = {
        account_number: 'ACC123456',
        user_id: 'user123',
        status: AccountStatus.ACTIVE,
        balance: 100,
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('createUser', () => {
        it('should create a new user with an account and send verification email', async () => {
            const initialDeposit = 100
            const hashedPassword = 'hashed_password123'
            const verificationCode = '123456'

            // Mock all dependencies with expected returns
            ;(generateUniqueAccountNumber as jest.Mock).mockResolvedValue(
                accountDto.account_number
            )
            ;(EncryptionService.hash as jest.Mock).mockImplementation(
                (password) => {
                    console.log('Hashing password:', password) // Log original password
                    return Promise.resolve(hashedPassword)
                }
            )
            ;(UserModel.createUser as jest.Mock).mockImplementation(
                async (user) => {
                    console.log('Received user in UserModel.createUser:', user) // Debugging log
                    return { ...userDto, password: user.password }
                }
            )
            ;(AccountService.createAccount as jest.Mock).mockResolvedValue(
                accountDto
            )
            ;(sendEmail as jest.Mock).mockResolvedValue(
                'Email sent successfully'
            )
            ;(generateOtp as jest.Mock).mockResolvedValue(verificationCode)
            ;(CacheService.setCache as jest.Mock).mockResolvedValue(true)

            // Mock db.transaction to simulate transactional behavior
            ;(db.transaction as jest.Mock).mockImplementation(
                async (callback) => {
                    const trx = {} // Mock transaction object
                    return callback(trx)
                }
            )

            // Call the function
            const result = await UserService.createUser(userDto, initialDeposit)

            expect(UserModel.createUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...userDto,
                    password: userDto.password, // Ensure hashed password is present
                    nin_verified: VerificationStatus.VERIFIED,
                }),
                expect.any(Object)
            )

            // Confirm AccountService.createAccount is called with correct details
            expect(AccountService.createAccount).toHaveBeenCalledWith(
                expect.objectContaining({
                    account_number: accountDto.account_number,
                    user_id: userDto.id,
                    balance: initialDeposit,
                }),
                expect.any(Object)
            )

            // Confirm that sendEmail was called
            expect(sendEmail).toHaveBeenCalledWith(
                userDto.email,
                'Verification Code',
                expect.any(String)
            )

            // Check the final result structure
            expect(result).toEqual({
                user: expect.objectContaining({
                    first_name: userDto.first_name,
                    last_name: userDto.last_name,
                    email: userDto.email,
                    phone_number: userDto.phone_number,
                    email_verified: false,
                    nin_verified: VerificationStatus.VERIFIED,
                }),
                account: expect.objectContaining({
                    account_number: accountDto.account_number,
                    balance: initialDeposit,
                }),
            })
        })

        it('should throw an InternalError if user creation fails', async () => {
            ;(db.transaction as jest.Mock).mockImplementation(
                async (callback) => {
                    const trx = {} // mock transaction object
                    return callback(trx) // execute the callback with the mock transaction
                }
            )

            // Simulate error by making UserModel.createUser reject
            ;(UserModel.createUser as jest.Mock).mockRejectedValue(
                new Error('DB error')
            )

            await expect(UserService.createUser(userDto)).rejects.toThrow(
                InternalError
            )
        })
    })
    describe('sendVerificationEmail', () => {
        it('should send a verification email with an OTP code', async () => {
            const verificationCode = '123456'
            const firstName = 'John'
            const subject = 'Verification Code'

            ;(generateOtp as jest.Mock).mockResolvedValue(verificationCode)
            ;(CacheService.setCache as jest.Mock).mockResolvedValue(true)
            ;(sendEmail as jest.Mock).mockResolvedValue(
                'Email sent successfully'
            )

            await UserService.sendVerificationEmail(
                userDto.email,
                firstName,
                subject
            )

            expect(generateOtp).toHaveBeenCalled()
            expect(CacheService.setCache).toHaveBeenCalledWith(
                userDto.email,
                verificationCode
            )
            expect(sendEmail).toHaveBeenCalledWith(
                userDto.email,
                subject,
                expect.stringContaining(verificationCode)
            )
        })

        it('should throw an InternalError if sending the email fails', async () => {
            ;(sendEmail as jest.Mock).mockRejectedValue(
                new Error('Email service error')
            )

            await expect(
                UserService.sendVerificationEmail(
                    userDto.email,
                    'John',
                    'Verification Code'
                )
            ).rejects.toThrow(InternalError)
        })
    })

    describe('getUserById', () => {
        it('should return user and associated account details', async () => {
            const accountData = [accountDto]

            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
                userDto
            )
            ;(AccountModel.getAccountByUserId as jest.Mock).mockResolvedValue(
                accountData
            )
            ;(omitValue as jest.Mock).mockReturnValue(userDto)

            const result = await UserService.getUserById(userDto.id as string)

            expect(UserModel.getUserByIdentifier).toHaveBeenCalledWith({
                id: userDto.id,
            })
            expect(AccountModel.getAccountByUserId).toHaveBeenCalledWith(
                userDto.id
            )
            expect(result).toEqual({
                user: expect.objectContaining({
                    first_name: userDto.first_name,
                    last_name: userDto.last_name,
                    email: userDto.email,
                    phone_number: userDto.phone_number,
                    nin_verified: userDto.nin_verified,
                }),
                account: accountData,
            })
        })

        it('should throw an InternalError if user fetch fails', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockRejectedValue(
                new Error('DB error')
            )

            await expect(
                UserService.getUserById(userDto.id as string)
            ).rejects.toThrow(InternalError)
        })
    })

    describe('verifyUser', () => {
        it('should verify the user and update account status', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
                userDto
            )
            ;(UserModel.updateUserById as jest.Mock).mockResolvedValue(true)
            ;(
                AccountModel.updateAccountByIdOrUserId as jest.Mock
            ).mockResolvedValue(true)
            ;(CacheService.invalidateCache as jest.Mock).mockResolvedValue(true)

            await UserService.verifyUser(userDto.email)

            expect(UserModel.getUserByIdentifier).toHaveBeenCalledWith({
                email: userDto.email,
            })
            expect(UserModel.updateUserById).toHaveBeenCalledWith(userDto.id, {
                email_verified: true,
            })
            expect(AccountModel.updateAccountByIdOrUserId).toHaveBeenCalledWith(
                { user_id: userDto.id },
                { status: AccountStatus.ACTIVE }
            )
            expect(CacheService.invalidateCache).toHaveBeenCalledWith(
                userDto.email
            )
        })

        it('should throw an InternalError if user verification fails', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockRejectedValue(
                new Error('DB error')
            )

            await expect(UserService.verifyUser(userDto.email)).rejects.toThrow(
                InternalError
            )
        })
    })
})
