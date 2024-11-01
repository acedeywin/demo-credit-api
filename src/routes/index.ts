import { Router } from 'express'
import userRoutes from './user.route'

const routes = Router()

routes.use('/user', userRoutes)

export default routes
