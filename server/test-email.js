import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('Testing Resend email...');
  console.log('API Key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'SuiteGenie Security <noreply@suitegenie.in>',
      to: 'kanishksaraswat@suitegenie.in', // Change this to your email
      subject: 'Test Email from SuiteGenie',
      html: '<h1>Test Email</h1><p>If you receive this, your email is working!</p>',
    });

    if (error) {
      console.error('❌ Email failed:', error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', data.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEmail();
