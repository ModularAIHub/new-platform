import { Resend } from 'resend';

function getRequiredSetting(name) {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required email configuration: ${name}`);
    }
    return value;
}

export function createResendProvider() {
    const resend = new Resend(getRequiredSetting('RESEND_API_KEY'));
    const defaultFrom = getRequiredSetting('RESEND_FROM_EMAIL');

    return {
        async sendMail({ to, subject, html, text, from }) {
            if (!to || !subject || (!html && !text)) {
                throw new Error('Email requires to, subject, and html or text content');
            }

            try {
                const { data, error } = await resend.emails.send({
                    from: from || defaultFrom,
                    to,
                    subject,
                    html,
                    text
                });

                if (error) {
                    throw error;
                }

                console.log(`Email sent via Resend: ${data.id}`);
                return data;
            } catch (error) {
                console.error('Resend email delivery failed:', error.message);
                throw error;
            }
        }
    };
}
