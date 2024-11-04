import app from './app'
import dotenv from 'dotenv'

dotenv.config()

const APP_PORT = process.env.PORT || 8250

app.listen(APP_PORT, () => {
    console.log(`Server is running on PORT ${APP_PORT}`)
})
