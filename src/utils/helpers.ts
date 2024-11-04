import * as otpGenerator from 'otp-generator'

import db from '../config/db/connection'
import { InternalError } from './error.handler'
import UserModel from '../models/user.model'
import { PaymentType } from '../types/account.types'

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

export const generateAccountNumber = async (): Promise<string> => {
    const timestamp = Date.now().toString().slice(-4) // Last 4 digits of timestamp
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString() // 6 random digits
    return timestamp + randomDigits // Concatenate for a 10-digit account number
}

export const generateUniqueId = async (
    tableName: string,
    columnName: string,
    prefix: string = ''
): Promise<string> => {
    let uniqueId = ''
    let isUnique = false

    while (!isUnique) {
        const digit = await generateAccountNumber()
        uniqueId = prefix ? `${prefix}-${digit}`.toUpperCase() : digit

        const existingRecord = await db(tableName)
            .where({ [columnName]: uniqueId })
            .first()

        isUnique = !existingRecord // Only exit loop if no existing record is found
    }

    return uniqueId
}

export const generateUniqueAccountNumber = async (): Promise<string> => {
    const accountNumber = await generateUniqueId('accounts', 'account_number')

    return accountNumber
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

export const maskNumber = (input: string): string =>
    input.slice(0, 7).replace(/./g, 'X') + input.slice(-3)

export const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = date.toLocaleString('default', { month: 'short' })
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    return `${day}-${month}-${year} ${hours}:${minutes}`
}

export const generateReferenceId = async (
    id: string,
    type: PaymentType
): Promise<string> => {
    const user = await UserModel.getUserByIdentifier({ id })
    const prefix = `${user?.first_name[0]}${user?.last_name[0]}${type[0]}`

    const referenceId = await generateUniqueId(
        'transactions',
        'reference_id',
        prefix
    )

    return referenceId
}

export const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US')
}
