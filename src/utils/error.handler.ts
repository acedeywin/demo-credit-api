/* eslint-disable @typescript-eslint/no-explicit-any */
export class ApplicationError extends Error {
    public statusCode: number
    constructor(statusCode: number, message: string, ...args: any) {
        super(...args)
        this.statusCode = statusCode
        this.message = message
    }
}

export class BadRequestError extends ApplicationError {
    constructor(message: string, ...args: any) {
        super(400, message, ...args)
    }
}

export class UnauthorizedError extends ApplicationError {
    constructor(message: string, ...args: any) {
        super(401, message, args)
    }
}

export class ForbiddenError extends ApplicationError {
    constructor(message: string, ...args: any) {
        super(403, message, args)
    }
}

export class NotFoundError extends ApplicationError {
    constructor(message: string, ...args: any) {
        super(404, message, args)
    }
}

export class InternalError extends ApplicationError {
    constructor(message: string, ...args: any) {
        super(500, message, args)
    }
}
