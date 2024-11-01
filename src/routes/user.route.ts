import { Router } from 'express'
import UserController from '../controllers/user.controller'
import {
    handleUserRegistrationValidationErrors,
    validateFetchingUser,
    validateUserRegistration,
} from '../middleware/user.middleware'

const userRoutes = Router()

userRoutes.post(
    '/register',
    [...validateUserRegistration, handleUserRegistrationValidationErrors],
    UserController.createUser
)

userRoutes.get('/', validateFetchingUser, UserController.getUserById)

export default userRoutes
