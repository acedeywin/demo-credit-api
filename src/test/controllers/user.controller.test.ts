import { Request, Response, NextFunction } from 'express'
import UserController from '../../controllers/user.controller'
import UserService from '../../services/user.service'
import { omitValue } from '../../utils/helpers'
import redisClient from '../../config/redis'

jest.mock('../../services/user.service')
jest.mock('../../utils/helpers')

// Mock ioredis directly
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        quit: jest.fn().mockResolvedValue('OK'),
    }))
})

afterAll(async () => {
    await redisClient.quit()
})

describe('UserController', () => {
    let req: Partial<Request>
    let res: Partial<Response>
    let next: NextFunction

    beforeEach(() => {
        req = {
            body: {
                name: 'John Doe',
                email: 'john@example.com',
                confirm_password: 'password',
                nin: '123456789',
            },
            query: { user_id: '1', account_id: '2' },
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        next = jest.fn()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('createUser', () => {
        it('should create a user and return success message', async () => {
            ;(omitValue as jest.Mock).mockReturnValue({
                name: 'John Doe',
                email: 'john@example.com',
            })
            ;(UserService.createUser as jest.Mock).mockResolvedValue(true)

            await UserController.createUser(
                req as Request,
                res as Response,
                next
            )

            expect(omitValue).toHaveBeenCalledWith(req.body, [
                'confirm_password',
                'nin',
            ])
            expect(UserService.createUser).toHaveBeenCalledWith({
                name: 'John Doe',
                email: 'john@example.com',
            })
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                message:
                    'Account successfully created. Verification code sent to john@example.com',
            })
        })

        it('should call next with an error if creation fails', async () => {
            const error = new Error('Creation failed')
            ;(omitValue as jest.Mock).mockReturnValue({
                name: 'John Doe',
                email: 'john@example.com',
            })
            ;(UserService.createUser as jest.Mock).mockRejectedValue(error)

            await UserController.createUser(
                req as Request,
                res as Response,
                next
            )

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('getUserById', () => {
        it('should fetch user by ID and return success message', async () => {
            const userData = {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
            }
            ;(UserService.getUserById as jest.Mock).mockResolvedValue(userData)

            await UserController.getUserById(
                req as Request,
                res as Response,
                next
            )

            expect(UserService.getUserById).toHaveBeenCalledWith('1')
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'User account fetched successfully.',
                data: userData,
            })
        })

        it('should call next with an error if fetching fails', async () => {
            const error = new Error('Fetching failed')
            ;(UserService.getUserById as jest.Mock).mockRejectedValue(error)

            await UserController.getUserById(
                req as Request,
                res as Response,
                next
            )

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('verifyUser', () => {
        it('should return 201 and success message when user verification is successful', async () => {
            // Mock UserService.verifyUser to resolve successfully
            ;(UserService.verifyUser as jest.Mock).mockResolvedValue(true)

            await UserController.verifyUser(
                req as Request,
                res as Response,
                next
            )

            expect(UserService.verifyUser).toHaveBeenCalledWith(req.body.email)
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Account successfully verified. Proceed to login.',
            })
        })

        it('should call next with an error if user verification fails', async () => {
            const error = new Error('Verification failed')
            // Mock UserService.verifyUser to throw an error
            ;(UserService.verifyUser as jest.Mock).mockRejectedValue(error)

            await UserController.verifyUser(
                req as Request,
                res as Response,
                next
            )

            expect(UserService.verifyUser).toHaveBeenCalledWith(req.body.email)
            expect(next).toHaveBeenCalledWith(error)
        })
    })
})
