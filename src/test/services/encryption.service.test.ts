import * as bcrypt from 'bcrypt'
import EncryptionService from '../../services/encryption.service'

jest.mock('bcrypt')

describe('EncryptionService', () => {
    const plainPassword = 'testPassword'
    const hashedPassword = 'hashedPassword123'

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('compare', () => {
        it('should return true if passwords match', async () => {
            ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

            const result = await EncryptionService.compare(
                plainPassword,
                hashedPassword
            )
            expect(bcrypt.compare).toHaveBeenCalledWith(
                plainPassword,
                hashedPassword
            )
            expect(result).toBe(true)
        })

        it('should return false if passwords do not match', async () => {
            ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

            const result = await EncryptionService.compare(
                plainPassword,
                hashedPassword
            )
            expect(bcrypt.compare).toHaveBeenCalledWith(
                plainPassword,
                hashedPassword
            )
            expect(result).toBe(false)
        })
    })

    describe('hash', () => {
        it('should return a hashed password', async () => {
            const salt = 'testSalt'
            const hashedValue = 'hashedValue'
            ;(bcrypt.genSaltSync as jest.Mock).mockReturnValue(salt)
            ;(bcrypt.hashSync as jest.Mock).mockReturnValue(hashedValue)

            const result = await EncryptionService.hash(plainPassword)

            expect(bcrypt.genSaltSync).toHaveBeenCalledWith(10)
            expect(bcrypt.hashSync).toHaveBeenCalledWith(plainPassword, salt)
            expect(result).toBe(hashedValue)
        })
    })
})
