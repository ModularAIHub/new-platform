// Onboarding state endpoint
// routes/byok.js
import express from 'express';
import { ByokController } from '../controllers/byokController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
// onboarding endpoint removed

// Set or get BYOK preference
router.post('/preference', authenticateToken, ByokController.setPreference);
router.get('/preference', authenticateToken, ByokController.getPreference);

// Manage user API keys
router.post('/key', authenticateToken, ByokController.addOrUpdateKey);
router.get('/keys', authenticateToken, ByokController.getUserKeys);
router.delete('/key', authenticateToken, ByokController.deleteKey);

export default router;
