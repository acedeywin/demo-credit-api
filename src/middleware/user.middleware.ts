import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { compareUserInfo, verifyAge } from '../utils/helpers';
import AdjutorService from '../services/adjutor.service';

export const validateUserRegistration = [
  body('first_name').isString().notEmpty().withMessage('First name is required.'),
  body('last_name').isString().notEmpty().withMessage('Last name is required.'),
  body('email').isEmail().withMessage('A valid email is required.'),
  body('password').isStrongPassword(
    {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      }
  ).withMessage('Password should contain at least 1 uppercase character, 1 lowercase, 1 number, 1 symbol, and should be at least 8 characters long.'),
  body('confirm_password')
    .notEmpty().withMessage('Confirm password is required.')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match.'),
  body('phone_number').isMobilePhone('any').withMessage('A valid phone number is required.'),
  body('nin').isNumeric().notEmpty().isLength({min: 11, max: 11}).withMessage('NIN should have 11 character.'),

  
 async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dob, nin, first_name, last_name, phone_number } = req.body

    const isLegalAge = await verifyAge(dob)
    const validUser = await AdjutorService.verifyNIN(nin)
    const validKarma = await AdjutorService.karmaCheck(nin)

    const validateFirstName = await compareUserInfo(first_name, validUser.first_name)
    const validateLastName = await compareUserInfo(last_name, validUser.last_name)
    const validatePhoneNumber = await compareUserInfo(phone_number, validUser.mobile)

    if(!isLegalAge){
        return res.status(403).json({ message: "Your age is below the legal age of 18." });
    }

    if(!validateFirstName && !validateLastName && !validatePhoneNumber){
        return res.status(400).json({ message: "NIN verification failed." });
    }

    if(validKarma){
        return res.status(403).json({ message: "You are barred from using this service." });
    }

    next();
  },
];
