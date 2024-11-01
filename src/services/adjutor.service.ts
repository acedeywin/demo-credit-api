import { ForbiddenError, InternalError } from '../utils/error.handler'
import dotenv from 'dotenv'

dotenv.config()

class AdjutorService {
    static async fetchData(path: string) {
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

    static async karmaCheck(nin: string) {
        try {
            const path = `karma/${nin}`
            const response = await this.fetchData(path)

            return response.status === 200
        } catch (error) {
            console.error('Karma check failed:', error)
            throw new InternalError('Karma check could not be completed.')
        }
    }

    static async verifyNIN(nin: string) {
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
            console.error('NIN verification failed:', error)
            throw new InternalError('NIN verification could not be completed.')
        }
    }
}

export default AdjutorService
