import nodemailer from 'nodemailer';

function getRequiredSetting(name) {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required email configuration: ${name}`);
    }
    return value;
}

function getSmtpPort() {
    const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error('SMTP_PORT must be a positive integer');
    }
    return port;
}

export function createGmailSmtpProvider() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = getSmtpPort();
    const user = getRequiredSetting('SMTP_USER');
    const password = getRequiredSetting('SMTP_PASS');
    const defaultFrom = process.env.SMTP_FROM || `SuiteGenie <${user}>`;
    const secure = process.env.SMTP_SECURE
        ? process.env.SMTP_SECURE.toLowerCase() === 'true'
        : port === 465;

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass: password }
    });

    return {
        async sendMail({ to, subject, html, text, from }) {
            if (!to || !subject || (!html && !text)) {
                throw new Error('Email requires to, subject, and html or text content');
            }

            try {
                const info = await transporter.sendMail({
                    from: from || defaultFrom,
                    to,
                    subject,
                    html,
                    text
                });
                console.log(`Email sent via Gmail SMTP: ${info.messageId}`);
                return info;
            } catch (error) {
                console.error('Gmail SMTP email delivery failed:', error.message);
                throw error;
            }
        }
    };
}
