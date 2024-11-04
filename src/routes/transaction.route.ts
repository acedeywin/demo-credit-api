import { Router } from 'express'
import {
    handleTransactionHistoryValidationErrors,
    handleTransferTransactionValidationErrors,
    handleWithdrawalValidationErrors,
    validateTransaction,
    validateTransactionHistory,
    validateTransferTransaction,
} from '../middlewares/transaction.middleware'
import TransactionController from '../controllers/transaction.controller'

const transactionRoutes = Router()

transactionRoutes.post(
    '/fund-account',
    [...validateTransaction],
    TransactionController.fundAccount
)

transactionRoutes.post(
    '/withdraw-fund',
    [...validateTransaction, handleWithdrawalValidationErrors],
    TransactionController.withdrawFund
)

transactionRoutes.post(
    '/transfer-fund',
    [...validateTransferTransaction, handleTransferTransactionValidationErrors],
    TransactionController.transferFund
)

transactionRoutes.get(
    '/history',
    [...validateTransactionHistory, handleTransactionHistoryValidationErrors],
    TransactionController.transactionHistory
)

export default transactionRoutes
