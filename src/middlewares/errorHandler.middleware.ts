import { Request, Response } from 'express'
import { ApplicationError } from '../utils/error.handler'

export const errorHandler = (
    err: ApplicationError,
    req: Request,
    res: Response
) => {
    const statusCode = err.statusCode || 500

    console.error(`Error: ${err.message}`)

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message: err.message || 'Internal Server Error',
    })
}
