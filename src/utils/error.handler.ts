/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Base class for application-specific errors.
 * Extends the built-in `Error` class to include an HTTP status code and a custom message.
 */
export class ApplicationError extends Error {
    public statusCode: number

    /**
     * Constructs an ApplicationError.
     *
     * @param {number} statusCode - The HTTP status code associated with the error.
     * @param {string} message - A descriptive error message.
     * @param {...any} args - Additional arguments to be passed to the `Error` constructor.
     */
    constructor(statusCode: number, message: string, ...args: any) {
        super(...args)
        this.statusCode = statusCode
        this.message = message
    }
}

/**
 * Represents a 400 Bad Request error.
 * Used when the client sends an invalid request.
 */
export class BadRequestError extends ApplicationError {
    /**
     * Constructs a BadRequestError.
     *
     * @param {string} message - A descriptive error message.
     * @param {...any} args - Additional arguments to be passed to the `ApplicationError` constructor.
     */
    constructor(message: string, ...args: any) {
        super(400, message, ...args)
    }
}

/**
 * Represents a 401 Unauthorized error.
 * Used when authentication is required and has failed or has not yet been provided.
 */
export class UnauthorizedError extends ApplicationError {
    /**
     * Constructs an UnauthorizedError.
     *
     * @param {string} message - A descriptive error message.
     * @param {...any} args - Additional arguments to be passed to the `ApplicationError` constructor.
     */
    constructor(message: string, ...args: any) {
        super(401, message, args)
    }
}

/**
 * Represents a 403 Forbidden error.
 * Used when the client does not have permission to access the requested resource.
 */
export class ForbiddenError extends ApplicationError {
    /**
     * Constructs a ForbiddenError.
     *
     * @param {string} message - A descriptive error message.
     * @param {...any} args - Additional arguments to be passed to the `ApplicationError` constructor.
     */
    constructor(message: string, ...args: any) {
        super(403, message, args)
    }
}

/**
 * Represents a 404 Not Found error.
 * Used when the requested resource could not be found.
 */
export class NotFoundError extends ApplicationError {
    /**
     * Constructs a NotFoundError.
     *
     * @param {string} message - A descriptive error message.
     * @param {...any} args - Additional arguments to be passed to the `ApplicationError` constructor.
     */
    constructor(message: string, ...args: any) {
        super(404, message, args)
    }
}

/**
 * Represents a 500 Internal Server error.
 * Used when an unexpected condition was encountered.
 */
export class InternalError extends ApplicationError {
    /**
     * Constructs an InternalError.
     *
     * @param {string} message - A descriptive error message.
     * @param {...any} args - Additional arguments to be passed to the `ApplicationError` constructor.
     */
    constructor(message: string, ...args: any) {
        super(500, message, args)
    }
}
