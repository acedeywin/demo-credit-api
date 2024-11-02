import { Request, Response, NextFunction } from 'express'
import AuthController from '../../controllers/auth.controller'
import AuthService from '../../services/auth.service'

jest.mock('../../services/auth.service')

describe('AuthController', () => {
    let req: Partial<Request>
    let res: Partial<Response>
    let next: NextFunction

    const email = 'user@example.com'
    const token = 'valid.jwt.token'
    const user = { id: '1', email, name: 'John Doe' }

    beforeEach(() => {
        req = { body: { email } }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('login', () => {
        it('should return 200 and token if login is successful', async () => {
            // Mock AuthService.login and AuthService.generateToken to return a user and token
            ;(AuthService.login as jest.Mock).mockResolvedValue({ user })
            ;(AuthService.generateToken as jest.Mock).mockResolvedValue(token)

            await AuthController.login(req as Request, res as Response, next)

            expect(AuthService.login).toHaveBeenCalledWith(email)
            expect(AuthService.generateToken).toHaveBeenCalledWith(user.id)
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Logged in successfully',
                token,
                data: { user },
            })
        })

        it('should call next with an error if login fails', async () => {
            const error = new Error('Login failed')
            ;(AuthService.login as jest.Mock).mockRejectedValue(error)

            await AuthController.login(req as Request, res as Response, next)

            expect(AuthService.login).toHaveBeenCalledWith(email)
            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('logout', () => {
        it('should return 200 and success message on logout', () => {
            AuthController.logout(req as Request, res as Response)

            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                message: 'Logged out successfully',
            })
        })
    })
})
