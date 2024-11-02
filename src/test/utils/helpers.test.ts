/* eslint-disable @typescript-eslint/no-explicit-any */
import * as otpGenerator from 'otp-generator'
import db from '../../config/db/connection'
import {
    verifyAge,
    compareUserInfo,
    generateUniqueAccountNumber,
    generateOtp,
    omitValue,
} from '../../utils/helpers'

jest.mock('otp-generator')
jest.mock('../../config/db/connection')

describe('Helper Functions', () => {
    describe('verifyAge', () => {
        it('should return true if user is 18 or older', async () => {
            const dob = new Date('2000-01-01')
            const result = await verifyAge(dob)
            expect(result).toBe(true)
        })

        it('should return false if user is younger than 18', async () => {
            const dob = new Date()
            dob.setFullYear(dob.getFullYear() - 17)
            const result = await verifyAge(dob)
            expect(result).toBe(false)
        })
    })

    describe('compareUserInfo', () => {
        it('should return true if values are the same ignoring case', async () => {
            const result = await compareUserInfo('Example', 'example')
            expect(result).toBe(true)
        })

        it('should return false if values are different', async () => {
            const result = await compareUserInfo('Example', 'Different')
            expect(result).toBe(false)
        })
    })

    describe('generateUniqueAccountNumber', () => {
        const mockAccountNumber = '1234567890'

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it('should return a unique account number', async () => {
            ;(db as jest.MockedFunction<typeof db>).mockReturnValue({
                where: jest.fn().mockReturnValue({
                    first: jest.fn().mockResolvedValue(null), // Mock that no account exists
                }),
            } as any)

            const result = await generateUniqueAccountNumber()
            expect(result).toHaveLength(10)
            expect(db).toHaveBeenCalledWith('accounts')
        })

        it('should retry if account number is not unique', async () => {
            ;(db as jest.MockedFunction<typeof db>)
                .mockReturnValueOnce({
                    where: jest.fn().mockReturnValue({
                        first: jest.fn().mockResolvedValue({
                            account_number: mockAccountNumber,
                        }),
                    }),
                } as any)
                .mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        first: jest.fn().mockResolvedValue(null),
                    }),
                } as any)

            const result = await generateUniqueAccountNumber()
            expect(result).toHaveLength(10)
            expect(db).toHaveBeenCalledTimes(2) // Called twice due to retry
        })
    })

    describe('generateOtp', () => {
        it('should generate a 6-digit OTP', async () => {
            ;(otpGenerator.generate as jest.Mock).mockReturnValue('123456')
            const otp = await generateOtp()
            expect(otp).toBe('123456')
            expect(otpGenerator.generate).toHaveBeenCalledWith(6, {
                upperCaseAlphabets: false,
                specialChars: false,
                digits: true,
                lowerCaseAlphabets: false,
            })
        })

        it('should throw InternalError if OTP generation fails', async () => {
            ;(otpGenerator.generate as jest.Mock).mockImplementation(() => {
                throw new Error('OTP generation error')
            })
            await expect(generateOtp()).rejects.toThrow(
                'OTP generation failed.'
            )
        })
    })

    describe('omitValue', () => {
        it('should omit specified keys from an object', () => {
            const user = { name: 'John', age: 30, password: 'secret' }
            const result = omitValue(user, ['password'])
            expect(result).toEqual({ name: 'John', age: 30 })
        })

        it('should return the same object if no keys are specified', () => {
            const user = { name: 'John', age: 30 }
            const result = omitValue(user, [])
            expect(result).toEqual(user)
        })

        it('should return empty object if all keys are omitted', () => {
            const user = { name: 'John' }
            const result = omitValue(user, ['name'])
            expect(result).toEqual({})
        })
    })
})
