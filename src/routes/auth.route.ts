import express from 'express'
import AuthController from '../controllers/auth.controller'
import {
    handleLoginValidatationErrors,
    validateLogin,
} from '../middlewares/auth.middleware'

const authRoutes = express.Router()

authRoutes.post(
    '/login',
    [...validateLogin, handleLoginValidatationErrors],
    AuthController.login
)

authRoutes.post('/logout', AuthController.logout)

export default authRoutes
