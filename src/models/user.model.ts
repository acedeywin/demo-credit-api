import db from "../config/db/connection";
import { UserDto } from "../types/user.types";

class UserModel {

    public static async createUser(payload: UserDto): Promise<UserDto>{
        const [user] = await db('users').insert(payload).returning('*')
        return user
    }
    
      public static async findUserById(id: string): Promise<UserDto | null> {
        const user = await db('users').where({ id }).first();
        return user || null;
      }

      public static async updateUserById(id: string, payload: Partial<UserDto>): Promise<UserDto | null>{
        const [user] = await db('users').update(payload).where({id}).returning('*')
        return user || null
      }

}

export default UserModel