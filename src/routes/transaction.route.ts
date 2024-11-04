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
import { authenticateJWT } from '../middlewares/auth.middleware'

const transactionRoutes = Router()

transactionRoutes.post(
    '/fund-account',
    [authenticateJWT, ...validateTransaction],
    TransactionController.fundAccount
)

transactionRoutes.post(
    '/withdraw-fund',
    [authenticateJWT,...validateTransaction, handleWithdrawalValidationErrors],
    TransactionController.withdrawFund
)

transactionRoutes.post(
    '/transfer-fund',
    [authenticateJWT, ...validateTransferTransaction, handleTransferTransactionValidationErrors],
    TransactionController.transferFund
)

transactionRoutes.get(
    '/history',
    [authenticateJWT,...validateTransactionHistory, handleTransactionHistoryValidationErrors],
    TransactionController.transactionHistory
)

export default transactionRoutes
