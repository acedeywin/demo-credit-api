import nodemailer from 'nodemailer'
import sendEmail from '../../utils/email'

jest.mock('nodemailer')

const mockSendMail = jest.fn()
;(nodemailer.createTransport as jest.Mock).mockReturnValue({
    sendMail: mockSendMail,
})

describe('sendEmail', () => {
    const to = 'test@example.com'
    const subject = 'Test Subject'
    const text = 'Test Email Content'

    beforeEach(() => {
        mockSendMail.mockClear()
    })

    it('should send an email with the correct options', async () => {
        mockSendMail.mockImplementation((mailOptions, callback) => {
            callback(null, { response: '250 OK' })
        })

        await sendEmail(to, subject, text)

        expect(nodemailer.createTransport).toHaveBeenCalledWith({
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

        expect(mockSendMail).toHaveBeenCalledWith(
            {
                from: process.env.EMAIL_SENDER,
                to,
                subject,
                text,
            },
            expect.any(Function)
        )
    })

    it('should log an error if sending the email fails', async () => {
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {})

        const error = new Error('Failed to send email')
        mockSendMail.mockImplementation((mailOptions, callback) => {
            callback(error, null)
        })

        await expect(sendEmail(to, subject, text)).rejects.toThrow(
            'Failed to send email'
        )

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error sending email:',
            error
        )

        consoleErrorSpy.mockRestore()
    })

    it('should log success message if email is sent successfully', async () => {
        const consoleLogSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {})

        mockSendMail.mockImplementation((mailOptions, callback) => {
            callback(null, { response: '250 OK' })
        })

        await sendEmail(to, subject, text)

        expect(consoleLogSpy).toHaveBeenCalledWith(
            `Email sent: 250 OK to ${to}`
        )

        consoleLogSpy.mockRestore()
    })
})
