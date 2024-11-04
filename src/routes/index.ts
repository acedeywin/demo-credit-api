import { Router } from 'express'
import userRoutes from './user.route'
import authRoutes from './auth.route'
import accountRoutes from './account.route'
import transactionRoutes from './transaction.route'

const routes = Router()

routes.use('/user', userRoutes)
routes.use('/auth', authRoutes)
routes.use('/account', accountRoutes)
routes.use('/transaction', transactionRoutes)

export default routes
