import { Knex } from 'knex'
import db from '../config/db/connection'
import { UserDto } from '../types/user.types'

/**
 * UserModel provides data access methods for user-related operations.
 */
class UserModel {
    /**
     * Creates a new user with the specified details.
     *
     * @param {UserDto} payload - The user details to be inserted into the database.
     * @returns {Promise<void>}
     */
    public static async createUser(
        payload: UserDto,
        trx: Knex.Transaction
    ): Promise<UserDto> {
        await trx('users').insert(payload)

        const user = await trx('users')
            .where({ email: payload.email })
            .select('*')
            .first()

        return user
    }

    /**
     * Retrieves a user by a unique identifier, which could be an email, ID, or phone number.
     *
     * @param {Object} identifier - An object containing one or more of the unique identifiers: `email`, `id`, or `phone_number`.
     * @param {string} [identifier.email] - The email of the user.
     * @param {string} [identifier.id] - The unique ID of the user.
     * @param {string} [identifier.phone_number] - The phone number of the user.
     * @returns {Promise<UserDto | null>} - The user details or null if not found.
     */
    public static async getUserByIdentifier(identifier: {
        email?: string
        id?: string
        phone_number?: string
    }): Promise<UserDto | null> {
        const { email, id, phone_number } = identifier

        // Build the query based on provided identifier
        const user = await db('users')
            .where((builder) => {
                if (email) builder.where('email', email)
                if (id) builder.where('id', id)
                if (phone_number) builder.where('phone_number', phone_number)
            })
            .first()

        return user || null
    }

    /**
     * Updates a user by ID with the specified fields.
     *
     * @param {string} id - The unique ID of the user to update.
     * @param {Partial<UserDto>} payload - The fields to update in the user record.
     * @returns {Promise<UserDto | null>} - The updated user details or null if the update failed.
     */
    public static async updateUserById(
        id: string,
        payload: Partial<UserDto>
    ): Promise<UserDto | null> {
        const rowsAffected = await db('users').where({ id }).update(payload)

        if (!rowsAffected) {
            return null
        }

        const user = await db('users').where({ id }).first()
        return user || null
    }
}

export default UserModel
