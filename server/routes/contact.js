import express from 'express';
import { sendMail } from '../utils/email.js';

const router = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
  const { firstName, lastName, subject, phone, message } = req.body;
  if (!firstName || !lastName || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    await sendMail({
      to: 'suitegenie1@gmail.com',
      subject: `[SuiteGenie Contact] ${subject}`,
      html: `<b>Name:</b> ${firstName} ${lastName}<br/><b>Phone:</b> ${phone || 'N/A'}<br/><b>Message:</b><br/>${message}`,
      text: `Name: ${firstName} ${lastName}\nPhone: ${phone || 'N/A'}\nMessage:\n${message}`
    });
    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

export default router;
