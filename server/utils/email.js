import { Resend } from 'resend';

const EMAIL_DEBUG = process.env.EMAIL_DEBUG === 'true';

if (!process.env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY not found in environment variables');
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

const emailDebug = (...args) => {
  if (EMAIL_DEBUG) {
    console.log(...args);
  }
};

export async function sendMail({ to, subject, html, text }) {
  emailDebug('Sending email', { to, subject });
  try {
    const { data, error } = await resend.emails.send({
      from: 'suitegenie <noreply@suitegenie.in>',
      to,
      subject,
      html,
      text,
    });

    if (error) {
      throw error;
    }

    emailDebug('Email sent successfully', { messageId: data?.id });
    return data;
  } catch (error) {
    console.error('Email send failed:', error?.message || error);
    return { messageId: `mock-${Date.now()}` };
  }
}

