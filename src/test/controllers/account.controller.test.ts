import { Request, Response, NextFunction } from 'express'
import AccountController from '../../controllers/account.controller'
import AccountService from '../../services/account.service'
import { InternalError } from '../../utils/error.handler'

jest.mock('../../services/account.service')

describe('AccountController Tests', () => {
    let req: Partial<Request>
    let res: Partial<Response>
    let next: NextFunction

    const user_id = '12345'
    const account_number = 'ACC123456789'

    beforeEach(() => {
        req = {
            query: { user_id },
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    it('should create a new account and return a success response', async () => {
        ;(AccountService.createNewAccount as jest.Mock).mockResolvedValue(
            account_number
        )

        await AccountController.createAccount(
            req as Request,
            res as Response,
            next
        )

        expect(AccountService.createNewAccount).toHaveBeenCalledWith(user_id)
        expect(res.status).toHaveBeenCalledWith(201)
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            message: 'User account created successfully',
            data: { account_number },
        })
    })

    it('should call next with an error if account creation fails', async () => {
        const error = new InternalError('Account creation failed')
        ;(AccountService.createNewAccount as jest.Mock).mockRejectedValue(error)

        await AccountController.createAccount(
            req as Request,
            res as Response,
            next
        )

        expect(AccountService.createNewAccount).toHaveBeenCalledWith(user_id)
        expect(next).toHaveBeenCalledWith(error)
    })
})
