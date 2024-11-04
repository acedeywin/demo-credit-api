import express from 'express'
import AuthController from '../controllers/auth.controller'
import {
    resetPasswordValidation,
    handleLoginValidatationErrors,
    validateLogin,
} from '../middlewares/auth.middleware'
import { handleUserVerificationValidationErrors, validateUserData, validateUserVerification } from '../middlewares/user.middleware'

const authRoutes = express.Router()

authRoutes.post(
    '/login',
    [...validateLogin, handleLoginValidatationErrors],
    AuthController.login
)

authRoutes.post('/logout', AuthController.logout)

authRoutes.post('/reset-password', resetPasswordValidation, AuthController.resetPassword)

authRoutes.put('/change-password', [...validateUserData, ...validateUserVerification, handleUserVerificationValidationErrors ],  AuthController.changePassword)

export default authRoutes
