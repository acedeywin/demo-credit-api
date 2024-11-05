import { body, query, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import AccountModel from '../models/account.model'
import { AccountStatus } from '../types/account.types'

/**
 * Validation middleware for transactions, ensuring valid account number, amount, and optional description.
 * If validation passes, proceeds to the next middleware.
 */
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

    /**
     * Middleware to handle validation errors and additional checks for transaction.
     * Checks if amount is greater than zero; otherwise, responds with an error message.
     *
     * @param {Request} req - The request object containing transaction details in the body.
     * @param {Response} res - The response object used to send validation error messages or proceed.
     * @param {NextFunction} next - The next middleware function in the stack.
     */
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

/**
 * Handles validation errors for withdrawal transactions, checking account details and balance.
 *
 * @param {Request} req - The request object containing account details and amount in the body.
 * @param {Response} res - The response object used to send validation error messages or proceed.
 * @param {NextFunction} next - The next middleware function in the stack.
 * @returns {Promise<void>}
 */
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

        if (Number(amount) > Number(account?.balance)) {
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

/**
 * Validation middleware for transfer transactions, ensuring valid sender and receiver account numbers, amount, and optional description.
 */
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

/**
 * Handles validation errors for transfer transactions, checking account details and balance.
 *
 * @param {Request} req - The request object containing transaction details such as sender and receiver accounts, and amount in the body.
 * @param {Response} res - The response object used to send validation error messages or proceed.
 * @param {NextFunction} next - The next middleware function in the stack.
 */
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
        const balance = sender?.balance

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

        if (Number(amount) > Number(balance)) {

            res.status(403).json({
                status: 'success',
                message: 'Insufficient funds.',
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

        next()
    } catch (error) {
        next(error)
    }
}

/**
 * Validation middleware for transaction history, ensuring valid account number in the query parameter.
 */
export const validateTransactionHistory = [
    query('account_number')
        .isNumeric()
        .isLength({ min: 10, max: 10 })
        .notEmpty()
        .withMessage('account_number query is required.'),
]

/**
 * Handles validation errors for transaction history retrieval.
 * Checks if the account exists; otherwise, responds with an error message.
 *
 * @param {Request} req - The request object containing `account_number` in the query.
 * @param {Response} res - The response object used to send validation error messages or proceed.
 * @param {NextFunction} next - The next middleware function in the stack.
 */
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
