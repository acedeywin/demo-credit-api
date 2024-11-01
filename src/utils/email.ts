import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import { MailOptions } from 'nodemailer/lib/json-transport'

dotenv.config()

const sendEmail = async (to: string, subject: string, text: string) => {
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
    } as SMTPTransport.Options)

    const mailOptions: MailOptions = {
        from: process.env.EMAIL_SENDER,
        to,
        subject,
        text,
    }

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error('Error sending email:', error)
        } else {
            console.log(`Email Sent ${info.response} ${to}`)
        }
    })
}

export default sendEmail
