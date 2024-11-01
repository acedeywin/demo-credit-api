import * as bcrypt from 'bcrypt'

class EncryptionService {
    static async compare(
        plainPassword: string,
        hashedPassword: string
    ): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword)
    }

    static async hash(plain: string): Promise<string> {
        const salt = bcrypt.genSaltSync(10)
        return bcrypt.hashSync(plain, salt)
    }
}

export default EncryptionService
