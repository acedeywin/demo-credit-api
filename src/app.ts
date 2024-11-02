import express from 'express'
import routes from './routes'
import { errorHandler } from './middlewares/errorHandler.middleware'

const app = express()
app.use(express.json())
app.use(errorHandler)

//Expose routes
app.use('/api/v1', routes)

export default app
