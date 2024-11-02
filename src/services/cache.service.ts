import redisClient from '../config/redis'

const CACHE_EXPIRY = 3600 // 1 hour

class CacheService {
    static async setCache(key: string, data: string): Promise<void> {
        await redisClient.set(
            `key:${key}`,
            JSON.stringify(data),
            'EX',
            CACHE_EXPIRY
        )
    }

    static async getCache(key: string): Promise<string | null> {
        const cachedData = await redisClient.get(`key:${key}`)
        return cachedData ? JSON.parse(cachedData) : null
    }

    static async invalidateCache(key: string): Promise<void> {
        await redisClient.del(`key:${key}`)
    }
}

export default CacheService
