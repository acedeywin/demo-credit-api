import redisClient from '../../config/redis'
import CacheService from '../../services/cache.service'

jest.mock('../../config/redis', () => ({
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
}))

describe('CacheService', () => {
    const key = 'testKey'
    const data = 'testData'

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('setCache', () => {
        it('should set cache with the correct key and data', async () => {
            await CacheService.setCache(key, data)

            expect(redisClient.set).toHaveBeenCalledWith(
                `key:${key}`,
                JSON.stringify(data),
                'EX',
                3600
            )
        })
    })

    describe('getCache', () => {
        it('should return cached data if present', async () => {
            ;(redisClient.get as jest.Mock).mockResolvedValueOnce(
                JSON.stringify(data)
            )

            const result = await CacheService.getCache(key)
            expect(redisClient.get).toHaveBeenCalledWith(`key:${key}`)
            expect(result).toBe(data)
        })

        it('should return null if no cached data is present', async () => {
            ;(redisClient.get as jest.Mock).mockResolvedValueOnce(null)

            const result = await CacheService.getCache(key)
            expect(redisClient.get).toHaveBeenCalledWith(`key:${key}`)
            expect(result).toBeNull()
        })
    })

    describe('invalidateCache', () => {
        it('should delete the cache for the given key', async () => {
            await CacheService.invalidateCache(key)

            expect(redisClient.del).toHaveBeenCalledWith(`key:${key}`)
        })
    })
})
