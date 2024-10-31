import { ForbiddenError, InternalError } from '../utils/errors'

class AdjutorService {
    static async fetchData(path: string) {
        try {
            const baseUrl = process.env.ADJUTOR_URL

            const myHeaders = new Headers()
            myHeaders.append(
                'Authorization',
                String(process.env.ADJUTOR_API_KEY)
            )

            const requestOptions = {
                method: 'GET',
                headers: myHeaders,
                redirect: 'follow' as RequestRedirect,
            }

            const response = await fetch(`${baseUrl}/${path}`, requestOptions)

            return response
        } catch (error) {
            console.error(error)
            throw new Error('Something went wrong')
        }
    }

    static async karmaCheck(nin: string) {
        try {
            const path = `/karma/${nin}`
            const response = await this.fetchData(path)

            return response.status === 200
        } catch (error) {
            throw new InternalError(`Something went wrong: ${error}`)
        }
    }

    static async verifyNIN(nin: string) {
        try {
            const path = `/karma/${nin}`
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
            throw new InternalError(`Something went wrong: ${error}`)
        }
    }
}

export default AdjutorService
