import { body, query, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import { compareUserInfo, verifyAge } from '../utils/helpers'
import AdjutorService from '../services/adjutor.service'
import UserModel from '../models/user.model'
import AccountModel from '../models/account.model'
import CacheService from '../services/cache.service'

/**
 * Validation middleware for user data, ensuring valid email, password strength, and matching passwords.
 */
export const validateUserData = [
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password')
        .notEmpty()
        .isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        })
        .withMessage(
            'Password should contain at least 1 uppercase character, 1 lowercase, 1 number, 1 symbol, and should be at least 8 characters long.'
        ),
    body('confirm_password')
        .notEmpty()
        .withMessage('Confirm password is required.')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords do not match.'),
]

/**
 * Validation middleware for user registration, ensuring required fields for registration.
 */
export const validateUserRegistration = [
    body('first_name')
        .isString()
        .notEmpty()
        .withMessage('First name is required.'),
    body('last_name')
        .isString()
        .notEmpty()
        .withMessage('Last name is required.'),
    body('phone_number')
        .isMobilePhone('any')
        .withMessage('A valid phone number is required.'),
    body('nin')
        .isNumeric()
        .notEmpty()
        .isLength({ min: 11, max: 11 })
        .withMessage('NIN should have 11 characters.'),
    body('initial_deposit')
        .isNumeric()
        .optional()
        .withMessage('Deposit must be a number.'),
]

/**
 * Handles validation errors for user registration, including age, NIN verification, and existing account checks.
 *
 * @param {Request} req - The request object containing user details such as name, phone number, and NIN in the body.
 * @param {Response} res - The response object used to send validation error messages or proceed.
 * @param {NextFunction} next - The next middleware function in the stack.
 * @returns {Promise<void>}
 */
export const handleUserRegistrationValidationErrors = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() })
            return
        }

        const {
            dob,
            nin,
            first_name,
            last_name,
            phone_number,
            email,
            initial_deposit,
        } = req.body

        const isLegalAge = await verifyAge(dob)
        const validUser = await AdjutorService.verifyNIN(nin)
        const validKarma = await AdjutorService.karmaCheck(nin)

        const emailExist = await UserModel.getUserByIdentifier({
            email,
            phone_number,
        })
        const phoneExist = await UserModel.getUserByIdentifier({ phone_number })

        if (initial_deposit && Number(initial_deposit) <= 0) {
            res.status(403).json({
                status: 'success',
                message: 'Deposit must be greater than zero.',
            })
            return
        }

        if (phoneExist?.phone_number === phone_number) {
            res.status(403).json({
                status: 'success',
                message: 'Phone number already exists.',
            })
            return
        }

        if (emailExist) {
            res.status(403).json({
                status: 'success',
                message: 'You already have an account.',
            })
            return
        }

        const validateFirstName = await compareUserInfo(
            first_name,
            validUser.first_name
        )
        const validateLastName = await compareUserInfo(
            last_name,
            validUser.last_name
        )
        const validatePhoneNumber = await compareUserInfo(
            phone_number,
            validUser.mobile
        )

        if (!isLegalAge) {
            res.status(403).json({
                status: 'success',
                message: 'Your age is below the legal age of 18.',
            })
            return
        }

        if (!validateFirstName || !validateLastName || !validatePhoneNumber) {
            res.status(400).json({
                status: 'success',
                message:
                    'NIN verification failed. Mismatched information. Account cannot be created.',
            })
            return
        }

        if (validKarma) {
            res.status(403).json({
                status: 'success',
                message: 'You are barred from using this service.',
            })
            return
        }

        next()
    } catch (error) {
        next(error)
    }
}

/**
 * Validation middleware for fetching user details, ensuring the presence of `user_id` in the query.
 */
export const validateFetchingUser = [
    query('user_id')
        .isString()
        .notEmpty()
        .withMessage('user_id query parameter is required.'),
]

/**
 * Handles validation errors when fetching a user, including checking for account existence.
 *
 * @param {Request} req - The request object containing `user_id` in the query.
 * @param {Response} res - The response object used to send validation error messages or proceed.
 * @param {NextFunction} next - The next middleware function in the stack.
 * @returns {Promise<void>}
 */
export const handleUserValidationErrors = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() })
            return
        }

        const { user_id } = req.query

        const user = await UserModel.getUserByIdentifier({
            id: user_id as string,
        })

        if (!user) {
            res.status(404).json({
                status: 'success',
                message: 'User not found',
            })
            return
        }

        const account = await AccountModel.getAccountByUserId(user_id as string)

        if (!account) {
            res.status(404).json({
                status: 'success',
                message: 'Account not found',
            })
            return
        }

        next()
    } catch (error) {
        next(error)
    }
}

/**
 * Validation middleware for user verification, ensuring valid email and verification code.
 */
export const validateUserVerification = [
    body('email').isEmail().withMessage('A valid email is required.'),
    body('code').isString().notEmpty().withMessage('Code is required.'),
]

/**
 * Handles validation errors for user verification, including cache verification for the provided code.
 *
 * @param {Request} req - The request object containing `email` and `code` in the body.
 * @param {Response} res - The response object used to send validation error messages or proceed.
 * @param {NextFunction} next - The next middleware function in the stack.
 * @returns {Promise<void>}
 */
export const handleUserVerificationValidationErrors = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() })
            return
        }

        const { email, code } = req.body

        const cache = await CacheService.getCache(email)

        if (!cache) {
            res.status(404).json({
                message: 'Invalid Request',
                status: 'success',
            })
            return
        }

        if (cache !== code) {
            res.status(404).json({
                message: 'Invalid Request',
                status: 'success',
            })
            return
        }

        const user = await UserModel.getUserByIdentifier({ email })

        if (!user) {
            res.status(404).json({
                message: 'Invalid Request',
                status: 'success',
            })
            return
        }

        next()
    } catch (error) {
        next(error)
    }
}
