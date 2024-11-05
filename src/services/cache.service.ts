import redisClient from '../config/redis'

const CACHE_EXPIRY = 3600 // 1 hour

/**
 * CacheService provides methods for caching data, retrieving cached data, and invalidating cache entries using Redis.
 */
class CacheService {
    /**
     * Sets a cache entry with the specified key and data, expiring after a defined time.
     *
     * @param {string} key - The unique key to identify the cached data.
     * @param {string} data - The data to be cached as a string.
     * @returns {Promise<void>}
     */
    static async setCache(key: string, data: string): Promise<void> {
        await redisClient.set(`key:${key}`, data, 'EX', CACHE_EXPIRY)
    }

    /**
     * Retrieves cached data by key.
     *
     * @param {string} key - The unique key for the cached data.
     * @returns {Promise<string | null>} - The cached data as a string, or null if not found.
     */
    static async getCache(key: string): Promise<string | null> {
        const cachedData = await redisClient.get(`key:${key}`)
        return cachedData ? cachedData : null
    }

    /**
     * Invalidates (deletes) cached data by key.
     *
     * @param {string} key - The unique key for the cached data to be invalidated.
     * @returns {Promise<void>}
     */
    static async invalidateCache(key: string): Promise<void> {
        await redisClient.del(`key:${key}`)
    }
}

export default CacheService
