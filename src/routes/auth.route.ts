import express from 'express'
import AuthController from '../controllers/auth.controller'
import {
    resetPasswordValidation,
    handleLoginValidatationErrors,
    validateLogin,
    validateCode,
} from '../middlewares/auth.middleware'
import {
    handleUserVerificationValidationErrors,
    validateUserVerification,
} from '../middlewares/user.middleware'

const authRoutes = express.Router()

authRoutes.post(
    '/login',
    [...validateLogin, handleLoginValidatationErrors],
    AuthController.login
)

authRoutes.post('/logout', AuthController.logout)

authRoutes.post(
    '/reset-password',
    resetPasswordValidation,
    AuthController.resetPassword
)

authRoutes.put(
    '/change-password',
    [
        ...validateCode,
        ...validateUserVerification,
        handleUserVerificationValidationErrors,
    ],
    AuthController.changePassword
)

export default authRoutes
