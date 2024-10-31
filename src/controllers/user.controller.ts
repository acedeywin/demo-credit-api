import { Request, Response } from 'express';

import UserService from "../services/user.service";

class UserController {

    public static async createUser(req: Request, res: Response) {
        try {
      
          const user = await UserService.createUser(req.body);

          return res.status(201).json({ message: 'User created successfully', user });
        } catch (error) {
          return res.status(500).json({ message: 'Error creating user', error });
        }
      }

}

export default UserController