import * as otpGenerator from 'otp-generator'

import db from '../config/db/connection'
import { InternalError } from './error.handler'

export const verifyAge = async (dob: Date) => {
    const enteredDate = new Date(dob)
    const today = new Date()

    // Calculate the date exactly 18 years ago from today
    const cutoffDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
    )

    // Check if cutoff date is greater than the entered date
    return cutoffDate > enteredDate
}

export const compareUserInfo = async (value: string, compareValue: string) =>
    value.toLocaleLowerCase() === compareValue.toLocaleLowerCase()

const generateAccountNumber = async (): Promise<string> => {
    const timestamp = Date.now().toString().slice(-4) // Last 4 digits of timestamp
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString() // 6 random digits
    return timestamp + randomDigits // Concatenate for a 10-digit account number
}

export const generateUniqueAccountNumber = async (): Promise<string> => {
    let accountNumber
    let isUnique = false

    while (!isUnique) {
        accountNumber = await generateAccountNumber() // Use any of the generation functions above
        const existingAccount = await db('accounts')
            .where({ account_number: accountNumber })
            .first()
        isUnique = !existingAccount // Only exit loop if no existing account is found
    }

    return accountNumber as string
}

export const generateOtp = async () => {
    try {
        return otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            digits: true,
            lowerCaseAlphabets: false,
        })
    } catch (error) {
        console.error('Error generating OTP:', error)
        throw new InternalError('OTP generation failed.')
    }
}

export const omitValue = <T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
): Omit<T, K> => {
    const clone = { ...obj }
    keys.forEach((key) => {
        delete clone[key]
    })
    return clone
}
