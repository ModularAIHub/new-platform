import { createGmailSmtpProvider } from './email/gmailSmtpProvider.js';
import { createResendProvider } from './email/resendProvider.js';

let emailProvider;

function getEmailProvider() {
    if (!emailProvider) {
        const provider = (process.env.EMAIL_PROVIDER || 'smtp').trim().toLowerCase();

        if (provider === 'smtp') {
            emailProvider = createGmailSmtpProvider();
        } else if (provider === 'resend') {
            emailProvider = createResendProvider();
        } else {
            throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}. Use "smtp" or "resend".`);
        }
    }

    return emailProvider;
}

export function sendMail(message) {
    return getEmailProvider().sendMail(message);
}
