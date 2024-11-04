import * as otpGenerator from 'otp-generator'

import db from '../config/db/connection'
import { InternalError } from './error.handler'
import UserModel from '../models/user.model'
import { PaymentType } from '../types/account.types'

/**
 * Verifies if a given date of birth indicates an age of 18 or older.
 * 
 * @param {Date} dob - The date of birth to verify.
 * @returns {Promise<boolean>} - True if the age is 18 or older, false otherwise.
 */
export const verifyAge = async (dob: Date): Promise<boolean> => {
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

/**
 * Compares two strings for equality, ignoring case.
 * 
 * @param {string} value - The first string to compare.
 * @param {string} comparedValue - The second string to compare.
 * @returns {Promise<boolean>} - True if the strings are equal (case-insensitive), false otherwise.
 */
export const compareUserInfo = async (value: string, comparedValue: string): Promise<boolean> =>
    value.toLocaleLowerCase() === comparedValue.toLocaleLowerCase()

/**
 * Generates a 10-digit account number using the current timestamp and random digits.
 * 
 * @returns {Promise<string>} - The generated account number.
 */
export const generateAccountNumber = async (): Promise<string> => {
    const timestamp = Date.now().toString().slice(-4) // Last 4 digits of timestamp
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString() // 6 random digits
    return timestamp + randomDigits // Concatenate for a 10-digit account number
}

/**
 * Generates a unique identifier by checking a specified database table and column.
 * 
 * @param {string} tableName - The name of the database table to check.
 * @param {string} columnName - The column to check for uniqueness.
 * @param {string} [prefix=''] - An optional prefix for the unique identifier.
 * @returns {Promise<string>} - The unique identifier.
 */
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

/**
 * Generates a unique account number by checking for uniqueness in the accounts table.
 * 
 * @returns {Promise<string>} - The generated unique account number.
 */
export const generateUniqueAccountNumber = async (): Promise<string> => {
    const accountNumber = await generateUniqueId('accounts', 'account_number')

    return accountNumber
}

/**
 * Generates a 6-digit OTP (One-Time Password) with digits only.
 * 
 * @returns {Promise<string>} - The generated OTP.
 * @throws {InternalError} - If OTP generation fails.
 */
export const generateOtp = async (): Promise<string> => {
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

/**
 * Omits specified keys from an object and returns a new object.
 * 
 * @template T - The object type.
 * @template K - The keys to omit.
 * @param {T} obj - The object to omit keys from.
 * @param {K[]} keys - An array of keys to omit.
 * @returns {Omit<T, K>} - A new object without the specified keys.
 */
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

/**
 * Masks all but the last three digits of a number string.
 * 
 * @param {string} input - The string to mask.
 * @returns {string} - The masked string.
 */
export const maskNumber = (input: string): string =>
    input.slice(0, 7).replace(/./g, 'X') + input.slice(-3)

/**
 * Formats a date as a string in the format "DD-MMM-YYYY HH:MM".
 * 
 * @param {Date} date - The date to format.
 * @returns {string} - The formatted date string.
 */
export const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = date.toLocaleString('default', { month: 'short' })
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    return `${day}-${month}-${year} ${hours}:${minutes}`
}

/**
 * Generates a unique transaction reference ID based on user initials and transaction type.
 * 
 * @param {string} id - The user ID for generating the reference ID.
 * @param {PaymentType} type - The transaction type (CREDIT or DEBIT).
 * @returns {Promise<string>} - The generated reference ID.
 */
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

/**
 * Formats a number as a currency string with thousands separators.
 * 
 * @param {number} amount - The number to format as currency.
 * @returns {string} - The formatted currency string.
 */
export const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US')
}
