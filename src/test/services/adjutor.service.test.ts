import AdjutorService from '../../services/adjutor.service'
import { ForbiddenError, InternalError } from '../../utils/error.handler'

// Mocking fetch
global.fetch = jest.fn()

// Mocking environment variables
process.env.ADJUTOR_URL = 'https://api.adjutor.com'
process.env.ADJUTOR_API_KEY = 'test-api-key'

describe('AdjutorService', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('fetchData', () => {
        it('should call fetch with correct URL and headers', async () => {
            const mockResponse = new Response(JSON.stringify({}), {
                status: 200,
            })
            ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

            const path = 'test-path'
            await AdjutorService.fetchData(path)

            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.ADJUTOR_URL}/${path}`,
                {
                    method: 'GET',
                    headers: expect.any(Headers),
                }
            )
        })

        it('should throw InternalError on fetch failure', async () => {
            ;(global.fetch as jest.Mock).mockRejectedValueOnce(
                new Error('Fetch failed')
            )

            await expect(AdjutorService.fetchData('test-path')).rejects.toThrow(
                InternalError
            )
        })
    })

    describe('karmaCheck', () => {
        it('should return true if the status code is 200', async () => {
            const mockResponse = new Response(JSON.stringify({}), {
                status: 200,
            })
            ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

            const result = await AdjutorService.karmaCheck('123456789')
            expect(result).toBe(true)
        })

        it('should return false if the status code is not 200', async () => {
            const mockResponse = new Response(JSON.stringify({}), {
                status: 404,
            })
            ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

            const result = await AdjutorService.karmaCheck('123456789')
            expect(result).toBe(false)
        })

        it('should throw InternalError if fetchData fails', async () => {
            ;(global.fetch as jest.Mock).mockRejectedValueOnce(
                new Error('Fetch failed')
            )

            await expect(
                AdjutorService.karmaCheck('123456789')
            ).rejects.toThrow(InternalError)
        })
    })

    describe('verifyNIN', () => {
        it('should return user data if the NIN is valid', async () => {
            const mockResponseData = {
                data: {
                    first_name: 'John',
                    last_name: 'Doe',
                    mobile: '1234567890',
                },
            }
            const mockResponse = new Response(
                JSON.stringify(mockResponseData),
                { status: 200 }
            )
            ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

            const result = await AdjutorService.verifyNIN('123456789')

            expect(result).toEqual({
                first_name: 'John',
                last_name: 'Doe',
                mobile: '1234567890',
            })
        })

        it('should throw ForbiddenError if NIN is invalid', async () => {
            const mockResponse = new Response(JSON.stringify({}), {
                status: 403,
            })
            ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

            await expect(AdjutorService.verifyNIN('123456789')).rejects.toThrow(
                ForbiddenError
            )
        })

        it('should throw ForbiddenError if fetchData fails', async () => {
            ;(global.fetch as jest.Mock).mockRejectedValueOnce(
                new InternalError('Fetch failed')
            )

            await expect(AdjutorService.verifyNIN('123456789')).rejects.toThrow(
                InternalError
            )
        })
    })
})
