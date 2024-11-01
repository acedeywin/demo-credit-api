import express from 'express'
import routes from './routes'
// import exampleRoutes from './routes/example.routes';

const app = express()
app.use(express.json())

//Expose routes
app.use('/api/v1', routes)

export default app
