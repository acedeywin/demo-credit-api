import * as bcrypt from 'bcrypt'

/**
 * EncryptionService provides methods for hashing passwords and comparing plain passwords with hashed passwords.
 */
class EncryptionService {
    /**
     * Compares a plain password with a hashed password to check if they match.
     * 
     * @param {string} plainPassword - The plain text password to compare.
     * @param {string} hashedPassword - The hashed password to compare against.
     * @returns {Promise<boolean>} - True if the passwords match, false otherwise.
     */
    static async compare(
        plainPassword: string,
        hashedPassword: string
    ): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword)
    }

    /**
     * Hashes a plain password using bcrypt with a generated salt.
     * 
     * @param {string} plain - The plain text password to hash.
     * @returns {Promise<string>} - The hashed password.
     */
    static async hash(plain: string): Promise<string> {
        const salt = bcrypt.genSaltSync(10)
        return bcrypt.hashSync(plain, salt)
    }
}

export default EncryptionService
