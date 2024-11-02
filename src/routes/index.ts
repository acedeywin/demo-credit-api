import { Router } from 'express'
import userRoutes from './user.route'
import authRoutes from './auth.route'

const routes = Router()

routes.use('/user', userRoutes)
routes.use('/auth', authRoutes)

export default routes
