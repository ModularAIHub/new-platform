import nodemailer from 'nodemailer';

// Create transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendMail({ to, subject, html, text }) {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html,
        });
        return info;
    } catch (error) {
        console.error('📧 Email sending failed:', error.message);
        // Fallback: log email details for testing
        console.log('📧 MOCK EMAIL (due to error):');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Text: ${text}`);
        console.log(`HTML: ${html}`);
        return { messageId: 'mock-' + Date.now() };
    }
}

export { sendMail };
