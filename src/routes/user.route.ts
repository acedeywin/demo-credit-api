import { Router } from 'express'
import UserController from '../controllers/user.controller'
import {
    handleUserRegistrationValidationErrors,
    handleUserValidationErrors,
    validateUserRegistration,
    handleUserVerificationValidationErrors,
    validateUserVerification,
    validateFetchingUser,
    validateUserData,
} from '../middlewares/user.middleware'
import { authenticateJWT } from '../middlewares/auth.middleware'

const userRoutes = Router()

userRoutes.post(
    '/register',
    [...validateUserData, ...validateUserRegistration, handleUserRegistrationValidationErrors],
    UserController.createUser
)

userRoutes.put(
    '/verify-user',
    [...validateUserVerification, handleUserVerificationValidationErrors],
    UserController.verifyUser
)

userRoutes.get(
    '/',
    [authenticateJWT, ...validateFetchingUser, handleUserValidationErrors],
    UserController.getUserById
)

export default userRoutes
