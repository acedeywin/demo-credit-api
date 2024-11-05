import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Sends an email with the specified recipient, subject, and message text.
 *
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} text - The body text of the email.
 * @returns {Promise<void>} - A promise that resolves if the email is sent successfully, or rejects with an error if the email fails to send.
 */
const sendEmail = (
    to: string,
    subject: string,
    text: string
): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Set up the transporter configuration using environment variables
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

        // Define the email options
        const mailOptions = {
            from: process.env.EMAIL_SENDER,
            to,
            subject,
            text,
        }

        // Send the email and handle the response
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error)
                reject(error) // Reject the Promise on error
            } else {
                console.log(`Email sent: ${info.response} to ${to}`)
                resolve() // Resolve the Promise on success
            }
        })
    })
}

export default sendEmail
