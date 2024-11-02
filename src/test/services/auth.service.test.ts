import jwt from 'jsonwebtoken'
import AuthService from '../../services/auth.service'
import UserModel from '../../models/user.model'
import AccountModel from '../../models/account.model'
import { InternalError } from '../../utils/error.handler'

jest.mock('jsonwebtoken')
jest.mock('../../models/user.model')
jest.mock('../../models/account.model')

describe('AuthService', () => {
    const userId = '1'
    const email = 'user@example.com'
    const token = 'valid.jwt.token'
    const user = {
        id: userId,
        email,
        name: 'John Doe',
        password: 'hashedPassword',
    }
    const account = { id: 'accountId', userId: userId }

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('generateToken', () => {
        it('should generate a JWT token for a valid user ID', async () => {
            ;(jwt.sign as jest.Mock).mockReturnValue(token)

            const generatedToken = await AuthService.generateToken(userId)

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: userId },
                process.env.JWT_SECRET,
                {
                    expiresIn: process.env.JWT_EXPIRY,
                }
            )
            expect(generatedToken).toBe(token)
        })
    })

    describe('verifyToken', () => {
        it('should verify a valid JWT token', async () => {
            ;(jwt.verify as jest.Mock).mockReturnValue({ id: userId })

            const decoded = await AuthService.verifyToken(token)

            expect(jwt.verify).toHaveBeenCalledWith(
                token,
                process.env.JWT_SECRET
            )
            expect(decoded).toEqual({ id: userId })
        })

        it('should throw an error if the token is invalid', async () => {
            ;(jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error('Invalid token')
            })

            await expect(AuthService.verifyToken(token)).rejects.toThrow(
                'Invalid token'
            )
            expect(jwt.verify).toHaveBeenCalledWith(
                token,
                process.env.JWT_SECRET
            )
        })
    })

    describe('login', () => {
        it('should return user and account data on successful login', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockResolvedValue(
                user
            )
            ;(AccountModel.getAccountById as jest.Mock).mockResolvedValue(
                account
            )

            const result = await AuthService.login(email)

            expect(UserModel.getUserByIdentifier).toHaveBeenCalledWith({
                email,
            })
            expect(AccountModel.getAccountById).toHaveBeenCalledWith(
                undefined,
                userId
            )
            expect(result).toEqual({
                user: { id: userId, email, name: 'John Doe' },
                account,
            })
        })

        it('should throw an InternalError if login fails', async () => {
            ;(UserModel.getUserByIdentifier as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            await expect(AuthService.login(email)).rejects.toThrow(
                InternalError
            )
            expect(UserModel.getUserByIdentifier).toHaveBeenCalledWith({
                email,
            })
        })
    })
})
