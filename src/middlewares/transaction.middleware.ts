import { body, query, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import AccountModel from '../models/account.model'
import { AccountStatus } from '../types/account.types'

export const validateTransaction = [
    body('account_number')
        .isNumeric()
        .isLength({ min: 10, max: 10 })
        .notEmpty()
        .withMessage('Account number is required.'),

    body('amount').isNumeric().notEmpty().withMessage('Amount is required.'),
    body('description')
        .isString()
        .optional()
        .withMessage('Description should be a string.'),

    (req: Request, res: Response, next: NextFunction) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() })
                return
            }

            const { amount } = req.body

            if (amount <= 0) {
                res.status(403).json({
                    status: 'success',
                    message: 'Amount must be greater than zero.',
                })
                return
            }

            next()
        } catch (error) {
            next(error)
        }
    },
]

export const handleWithdrawalValidationErrors = async (
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

        const { account_number, amount } = req.body

        const account = await AccountModel.getAccountDetils(account_number)

        if (!account) {
            res.status(403).json({
                status: 'success',
                message: 'Account does not exist.',
            })
            return
        }

        if (account.status === AccountStatus.DORMANT) {
            res.status(403).json({
                status: 'success',
                message:
                    'Transaction cannot be completed. Account not verified',
            })
            return
        }

        if (account?.balance && amount > account?.balance) {
            res.status(403).json({
                status: 'success',
                message: 'Insufficient funds.',
            })
            return
        }

        next()
    } catch (error) {
        next(error)
    }
}

export const validateTransferTransaction = [
    body('sender_account')
        .isNumeric()
        .isLength({ min: 10, max: 10 })
        .notEmpty()
        .withMessage('Sender account number is required.'),

    body('receiver_account')
        .isNumeric()
        .isLength({ min: 10, max: 10 })
        .notEmpty()
        .withMessage('Receiver account number is required.'),

    body('amount').isNumeric().notEmpty().withMessage('Amount is required.'),
    body('description')
        .isString()
        .optional()
        .withMessage('Description should be a string.'),
]

export const handleTransferTransactionValidationErrors = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() })
            return
        }

        const { sender_account, receiver_account, amount } = req.body

        const sender = await AccountModel.getAccountDetils(sender_account)
        const receiver = await AccountModel.getAccountDetils(receiver_account)

        if (!sender) {
            res.status(403).json({
                status: 'success',
                message: "Sender's account does not exist.",
            })
            return
        }

        if (sender.status === AccountStatus.DORMANT) {
            res.status(403).json({
                status: 'success',
                message:
                    "Transaction cannot be completed. Sender's account not verified",
            })
            return
        }

        if (!receiver) {
            res.status(403).json({
                status: 'success',
                message: "Receiver's account does not exist.",
            })
            return
        }

        if (amount <= 0) {
            res.status(403).json({
                status: 'success',
                message: 'Amount must be greater than zero.',
            })
            return
        }

        if (sender?.balance && amount > sender?.balance) {
            res.status(403).json({
                status: 'success',
                message: 'Insufficient funds.',
            })
            return
        }

        next()
    } catch (error) {
        next(error)
    }
}

export const validateTransactionHistory = [
    query('account_number')
        .isNumeric()
        .isLength({ min: 10, max: 10 })
        .notEmpty()
        .withMessage('account_number query is required.'),
]

export const handleTransactionHistoryValidationErrors = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() })
            return
        }

        const { account_number } = req.query

        const account = await AccountModel.getAccountDetils(
            account_number as string
        )

        if (!account) {
            res.status(403).json({
                status: 'success',
                message: 'Account does not exist.',
            })
            return
        }
        next()
    } catch (error) {
        next(error)
    }
}
