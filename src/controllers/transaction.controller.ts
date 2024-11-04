import { NextFunction, Request, Response } from 'express'
import TransactionService from '../services/transaction.service'

class TransactionController {
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

    static async transactionHistory(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { account_number } = req.query

            const transactions = await TransactionService.transactionHistory(
                account_number as string
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
