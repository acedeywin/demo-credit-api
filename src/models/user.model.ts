import db from '../config/db/connection'
import { UserDto } from '../types/user.types'

class UserModel {
    public static async createUser(payload: UserDto) {
        await db('users').insert(payload)
    }

    public static async getUserByIdentifier(identifier: {
        email?: string
        id?: string
    }): Promise<UserDto | null> {
        const { email, id } = identifier

        // Build the query based on provided identifier
        const user = await db('users')
            .where((builder) => {
                if (email) builder.where('email', email)
                if (id) builder.where('id', id)
            })
            .first()

        return user || null
    }

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
