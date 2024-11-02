import { Request } from 'express'

export interface CustomRequest extends Request {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: any
}
