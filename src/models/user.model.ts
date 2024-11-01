import db from '../config/db/connection'
import { UserDto } from '../types/user.types'

class UserModel {
    public static async createUser(payload: UserDto) {
        // Insert the payload and retrieve the new user's ID
        const [userId] = await db('users').insert(payload)

        return userId
    }

    public static async findUserByEmail(
        email: string
    ): Promise<UserDto | null> {
        const user = await db('users').where({ email }).first()
        return user || null
    }

    public static async findUserById(id: string): Promise<UserDto | null> {
        const user = await db('users').where({ id }).first()
        return user || null
    }

    public static async updateUserById(
        id: string,
        payload: Partial<UserDto>
    ): Promise<UserDto | null> {
        const [user] = await db('users')
            .update(payload)
            .where({ id })
            .returning('*')
        return user || null
    }
}

export default UserModel
