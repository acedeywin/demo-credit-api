import { ForbiddenError, InternalError } from '../utils/error.handler'
import dotenv from 'dotenv'

dotenv.config()

/**
 * AdjutorService provides methods for interacting with the Adjutor API, including data fetching, karma checks, and NIN verification.
 */
class AdjutorService {
    /**
     * Fetches data from the Adjutor API based on the specified path.
     * 
     * @param {string} path - The API endpoint path to fetch data from.
     * @returns {Promise<Response>} - The API response.
     * @throws {InternalError} - If the data fetch operation fails.
     */
    static async fetchData(path: string): Promise<Response> {
        try {
            const baseUrl = process.env.ADJUTOR_URL

            const myHeaders = new Headers()
            myHeaders.append(
                'Authorization',
                `Bearer ${process.env.ADJUTOR_API_KEY}`
            )

            const requestOptions = {
                method: 'GET',
                headers: myHeaders,
                // redirect: 'follow' as RequestRedirect,
            }

            const response = await fetch(`${baseUrl}/${path}`, requestOptions)
            return response
        } catch (error) {
            console.error('Error fetching data:', error)
            throw new InternalError('Data could not be fetched.')
        }
    }

    /**
     * Checks the karma status of a user based on their NIN.
     * 
     * @param {string} nin - The National Identification Number of the user.
     * @returns {Promise<boolean>} - True if the karma check is successful, otherwise false.
     * @throws {InternalError} - If the karma check operation fails.
     */
    static async karmaCheck(nin: string): Promise<boolean> {
        try {
            const path = `karma/${nin}`
            const response = await this.fetchData(path)
            return response.status === 200
        } catch (error) {
            console.error('Karma check failed:', error)
            throw new InternalError('Karma check could not be completed.')
        }
    }

    /**
     * Verifies the NIN (National Identification Number) of a user and retrieves user details.
     * 
     * @param {string} nin - The National Identification Number to verify.
     * @returns {Promise<{ first_name: string; last_name: string; mobile: string }>} - The user's verified information including first name, last name, and mobile number.
     * @throws {ForbiddenError} - If the NIN is not valid.
     * @throws {InternalError} - If the NIN verification operation fails.
     */
    static async verifyNIN(nin: string): Promise<{ first_name: string; last_name: string; mobile: string }> {
        try {
            const path = `nin/${nin}`
            const response = await this.fetchData(path)

            if (response.status !== 200) {
                throw new ForbiddenError(`${nin} is not a valid NIN`)
            }

            const result = await response.json()

            return {
                first_name: result.data.first_name,
                last_name: result.data.last_name,
                mobile: result.data.mobile,
            }
        } catch (error) {
            if (error instanceof ForbiddenError) {
                throw error
            }
            console.error('NIN verification failed:', error)
            throw new InternalError('NIN verification could not be completed.')
        }
    }
}

export default AdjutorService
