// routes/ai.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as aiService from '../services/aiService.js';

const router = express.Router();

// Example endpoint: perform an AI request using correct key (BYOK or platform)
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { provider, aiParams } = req.body;
    const result = await aiService.performAIRequest(userId, provider, aiParams);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
