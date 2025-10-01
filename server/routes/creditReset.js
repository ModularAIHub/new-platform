// creditReset.js
// Routes for credit reset operations (admin only)
import express from 'express';
import { CreditResetController } from '../controllers/creditResetController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All credit reset routes require authentication
router.use(authenticateToken);

// Manual monthly credit reset (admin only - add admin middleware in production)
router.post('/manual-reset', CreditResetController.manualMonthlyReset);

// Get credit reset information
router.get('/info', CreditResetController.getResetInfo);

export default router;