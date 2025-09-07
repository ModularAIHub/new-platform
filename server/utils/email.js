
import { Resend } from 'resend';

// Debug: Show which API key is loaded (first 10 chars only)
if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in environment variables');
    process.exit(1);
}
console.log('🔑 Current API Key:', process.env.RESEND_API_KEY.substring(0, 10) + '...');
console.log('🔑 Expected Autoverse Key starts with: re_EN7Lckbi...');

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMail({ to, subject, html, text }) {
    console.log('📧 Sending email...');
    console.log('From: Autoverse <noreply@kanishksaraswat.me>');
    console.log('To:', to);
    try {
        const { data, error } = await resend.emails.send({
            from: 'Autoverse <noreply@kanishksaraswat.me>',
            to,
            subject,
            html,
            text,
        });
        if (error) {
            console.error('📧 Resend API Error:', error);
            throw error;
        }
        console.log('✅ Email sent successfully!');
        console.log('📧 Email ID:', data.id);
        return data;
    } catch (error) {
        console.error('❌ Email Error Details:');
        console.error('- Name:', error.name);
        console.error('- Message:', error.message);
        console.error('- Status:', error.status);
        // Fallback logging
        console.log('📧 MOCK EMAIL (due to error):');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        return { messageId: 'mock-' + Date.now() };
    }
}
