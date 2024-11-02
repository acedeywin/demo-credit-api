import { Router } from 'express'
import UserController from '../controllers/user.controller'
import {
    handleUserRegistrationValidationErrors,
    handleFetchingUserValidationErrors,
    validateUserRegistration,
    handleUserVerificationValidationErrors,
    validateUserVerification,
    validateFetchingUser,
} from '../middlewares/user.middleware'
import { authenticateJWT } from '../middlewares/auth.middleware'

const userRoutes = Router()

userRoutes.post(
    '/register',
    [...validateUserRegistration, handleUserRegistrationValidationErrors],
    UserController.createUser
)

userRoutes.put(
    '/verify-user',
    [...validateUserVerification, handleUserVerificationValidationErrors],
    UserController.verifyUser
)

userRoutes.get(
    '/',
    [
        authenticateJWT,
        ...validateFetchingUser,
        handleFetchingUserValidationErrors,
    ],
    UserController.getUserById
)

export default userRoutes
