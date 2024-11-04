import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const sendEmail = (
    to: string,
    subject: string,
    text: string
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: Boolean(process.env.EMAIL_SECURE),
            auth: {
                user: process.env.USER_EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: Boolean(process.env.EMAIL_SECURE),
            },
        })

        const mailOptions = {
            from: process.env.EMAIL_SENDER,
            to,
            subject,
            text,
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error)
                reject(error) // Reject the Promise on error
            } else {
                console.log(`Email Sent ${info.response} ${to}`)
                resolve() // Resolve the Promise on success
            }
        })
    })
}

export default sendEmail
