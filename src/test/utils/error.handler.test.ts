import {
    ApplicationError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    InternalError,
} from '../../utils/error.handler'

describe('Custom Error Classes', () => {
    describe('ApplicationError', () => {
        it('should create an error with a code and message', () => {
            const error = new ApplicationError(
                400,
                'Application error occurred'
            )
            expect(error).toBeInstanceOf(ApplicationError)
            expect(error.statusCode).toBe(400)
            expect(error.message).toBe('Application error occurred')
        })
    })

    describe('BadRequestError', () => {
        it('should create a BadRequestError with code 400', () => {
            const error = new BadRequestError('Bad request error')
            expect(error).toBeInstanceOf(BadRequestError)
            expect(error.statusCode).toBe(400)
            expect(error.message).toBe('Bad request error')
        })
    })

    describe('UnauthorizedError', () => {
        it('should create an UnauthorizedError with code 401', () => {
            const error = new UnauthorizedError('Unauthorized access')
            expect(error).toBeInstanceOf(UnauthorizedError)
            expect(error.statusCode).toBe(401)
            expect(error.message).toBe('Unauthorized access')
        })
    })

    describe('ForbiddenError', () => {
        it('should create a ForbiddenError with code 403', () => {
            const error = new ForbiddenError('Forbidden access')
            expect(error).toBeInstanceOf(ForbiddenError)
            expect(error.statusCode).toBe(403)
            expect(error.message).toBe('Forbidden access')
        })
    })

    describe('NotFoundError', () => {
        it('should create a NotFoundError with code 404', () => {
            const error = new NotFoundError('Resource not found')
            expect(error).toBeInstanceOf(NotFoundError)
            expect(error.statusCode).toBe(404)
            expect(error.message).toBe('Resource not found')
        })
    })

    describe('InternalError', () => {
        it('should create an InternalError with code 500', () => {
            const error = new InternalError('Internal server error')
            expect(error).toBeInstanceOf(InternalError)
            expect(error.statusCode).toBe(500)
            expect(error.message).toBe('Internal server error')
        })
    })
})
