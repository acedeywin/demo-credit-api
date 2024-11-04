import express from 'express'
import {
    handleAccountCreationValidationError,
    validateAccountCreation,
} from '../middlewares/account.middleware'
import AccountController from '../controllers/account.controller'
import { authenticateJWT } from '../middlewares/auth.middleware'

const accountRoutes = express.Router()

accountRoutes.post(
    '/create-account',
    authenticateJWT,
    [...validateAccountCreation, handleAccountCreationValidationError],
    AccountController.createAccount
)

export default accountRoutes
