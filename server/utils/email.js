import { Resend } from 'resend';

const EMAIL_DEBUG = process.env.EMAIL_DEBUG === 'true';
const emailEnabled = !!process.env.RESEND_API_KEY;

if (!emailEnabled) {
  console.warn('[EMAIL] RESEND_API_KEY not set - email sending disabled');
}

const resend = emailEnabled ? new Resend(process.env.RESEND_API_KEY) : null;

const emailDebug = (...args) => {
  if (EMAIL_DEBUG) {
    console.log(...args);
  }
};

export async function sendMail({ to, subject, html, text, from }) {
  if (!emailEnabled) {
    console.warn('[EMAIL] Skipping email send - email not configured');
    return null;
  }

  emailDebug('Sending email', { to, subject });

  try {
    const { data, error } = await resend.emails.send({
      from: from || 'suitegenie <noreply@suitegenie.in>',
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
    throw error;
  }
}
