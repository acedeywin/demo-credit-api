import UserModel from "../models/user.model";
import { UserDto, VerificationStatus } from "../types/user.types";
import { InternalError } from "../utils/errors";

class UserService {
    public static async createUser(payload: UserDto): Promise<UserDto> {
       try {

        payload.nin_verified = VerificationStatus.VERIFIED

        const user = await UserModel.createUser(payload);
        return user;
        
       } catch (error) {
        throw new InternalError(`Something went wrong: ${error}`) 
       }
      }
}

export default UserService