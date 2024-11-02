import { Router } from 'express'
import UserController from '../controllers/user.controller'
import {
    handleUserRegistrationValidationErrors,
    validateFetchingUser,
    validateUserRegistration,
    validateUserVerification,
} from '../middleware/user.middleware'

const userRoutes = Router()

userRoutes.post(
    '/register',
    [...validateUserRegistration, handleUserRegistrationValidationErrors],
    UserController.createUser
)

userRoutes.put(
    '/verify-user',
    validateUserVerification,
    UserController.verifyUser
)

userRoutes.get('/', validateFetchingUser, UserController.getUserById)

export default userRoutes
