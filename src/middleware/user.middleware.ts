import { body, query, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import { compareUserInfo, verifyAge } from '../utils/helpers'
import AdjutorService from '../services/adjutor.service'
import UserModel from '../models/user.model'
import AccountModel from '../models/account.model'
import CacheService from '../services/cache.service'

export const validateUserRegistration = [
    body('first_name')
        .isString()
        .notEmpty()
        .withMessage('First name is required.'),
    body('last_name')
        .isString()
        .notEmpty()
        .withMessage('Last name is required.'),
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
    body('phone_number')
        .isMobilePhone('any')
        .withMessage('A valid phone number is required.'),
    body('nin')
        .isNumeric()
        .notEmpty()
        .isLength({ min: 11, max: 11 })
        .withMessage('NIN should have 11 character.'),
]

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

        const { dob, nin, first_name, last_name, phone_number, email } =
            req.body

        const isLegalAge = await verifyAge(dob)
        const validUser = await AdjutorService.verifyNIN(nin)
        const validKarma = await AdjutorService.karmaCheck(nin)

        const userExist = await UserModel.getUserByIdentifier({ email })

        if (userExist) {
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

export const validateFetchingUser = [
    query('user_id')
        .isString()
        .notEmpty()
        .withMessage('user_id query parameter is required.'),

    query('account_id')
        .isString()
        .notEmpty()
        .withMessage('account_id query parameter is required.'),
]

export const handleFetchingUserValidationErrors = async (
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

        const { user_id, account_id } = req.query

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
        const account = await AccountModel.getAccountById(
            account_id as string,
            user_id as string
        )

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

export const validateUserVerification = [
    body('email').isString().notEmpty().withMessage('Email is required.'),

    body('code').isString().notEmpty().withMessage('Code is required.'),
]

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
                message: 'Invalid code supplied',
                status: 'success',
            })
            return
        }

        const user = await UserModel.getUserByIdentifier({ email })

        if (!user) {
            res.status(404).json({
                message: 'Invalid email supplied',
                status: 'success',
            })
            return
        }
        next()
    } catch (error) {
        next(error)
    }
}
