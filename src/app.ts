import express, { Request, Response, NextFunction } from 'express'
import timeout from 'connect-timeout'

import routes from './routes'

const app = express()
app.use(express.json())

// Middleware to set timeout for all requests
app.use(timeout('16s')) // Set timeout to 16 seconds

// Middleware to handle timed-out requests
app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.timedout) next() // If request did not time out, proceed
})

// Error handler for timed-out requests
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (err && req.timedout) {
        res.status(408).json({
            message: 'Request timed out. Check your network connection.',
        })
        return
    } else {
        next(err)
    }
})

// Software accessibility test
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Welcome to Demo Credit!' })
    return
})

//Expose routes
app.use('/api/v1', routes)

export default app
