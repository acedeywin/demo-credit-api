import { NextFunction, Request, Response } from 'express'
import TransactionService from '../services/transaction.service'

/**
 * TransactionController handles transaction-related requests such as funding, withdrawing, transferring funds, and fetching transaction history.
 */
class TransactionController {
    /**
     * Funds a user's account by adding a specified amount.
     *
     * @param {Request} req - The request object containing `amount`, `description`, and `account_number` in the body.
     * @param {Response} res - The response object used to send back the result.
     * @param {NextFunction} next - The next middleware function in the stack.
     */
    static async fundAccount(req: Request, res: Response, next: NextFunction) {
        try {
            const { amount, description, account_number } = req.body

            await TransactionService.fundAccount(
                account_number,
                amount,
                description
            )

            res.status(201).json({
                status: 'success',
                message: 'Account funding successful.',
            })
            return
        } catch (error) {
            next(error)
        }
    }

    /**
     * Withdraws funds from a user's account.
     *
     * @param {Request} req - The request object containing `amount`, `description`, and `account_number` in the body.
     * @param {Response} res - The response object used to send back the result.
     * @param {NextFunction} next - The next middleware function in the stack.
     */
    static async withdrawFund(req: Request, res: Response, next: NextFunction) {
        try {
            const { amount, description, account_number } = req.body

            await TransactionService.withdrawFund(
                account_number,
                amount,
                description
            )

            res.status(201).json({
                status: 'success',
                message: 'Fund withdrawal successful.',
            })
            return
        } catch (error) {
            next(error)
        }
    }

    /**
     * Transfers funds from one account to another.
     *
     * @param {Request} req - The request object containing `amount`, `description`, `sender_account`, and `receiver_account` in the body.
     * @param {Response} res - The response object used to send back the result.
     * @param {NextFunction} next - The next middleware function in the stack.
     */
    static async transferFund(req: Request, res: Response, next: NextFunction) {
        try {
            const { amount, description, sender_account, receiver_account } =
                req.body

            await TransactionService.transferFund(
                sender_account,
                receiver_account,
                amount,
                description
            )

            res.status(201).json({
                status: 'success',
                message: 'Fund transfer successful.',
            })
            return
        } catch (error) {
            next(error)
        }
    }

    /**
     * Fetches the transaction history for a specified account.
     *
     * @param {Request} req - The request object containing `account_number` in the query.
     * @param {Response} res - The response object used to send back the result.
     * @param {NextFunction} next - The next middleware function in the stack.
     */
    static async transactionHistory(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { account_number, page, size } = req.query

            const transactions = await TransactionService.transactionHistory(
                account_number as string,
                Number(page),
                Number(size)
            )
            res.status(201).json({
                status: 'success',
                message: 'Transactions fetched successfully.',
                data: transactions,
            })
            return
        } catch (error) {
            next(error)
        }
    }
}

export default TransactionController
