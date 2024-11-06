import { Knex } from 'knex'
import dotenv from 'dotenv'

dotenv.config()

/** This is needed to run the migrations
 * since knexfile is not on the same directory level with the .env file
 * Reference: https://stackoverflow.com/questions/49905967/knexfile-not-reading-environment-variables
 */
dotenv.config({ path: '../../.env' })

const config: { [key: string]: Knex.Config } = {
    development: {
        client: 'mysql2',
        connection: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT),
        },
        migrations: {
            directory: 'db/migrations',
        },
        seeds: {
            directory: 'db/seeds',
        },
    },
}

export default config
