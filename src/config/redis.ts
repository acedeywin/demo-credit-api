import Redis from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

/**
 * It's certain that REDIS_URL will always be defined, so we can use
 * the non-null assertion (!) to tell TypeScript that it’s safe to use.
 */
const redisClient = new Redis(process.env.REDIS_URL!)

redisClient.on('connect', () => console.log('Connected to Redis'))
redisClient.on('error', (error) => console.error('Redis error', error))

export default redisClient
