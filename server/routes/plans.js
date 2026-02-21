import express from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import PlansController from '../controllers/plansController.js';

const router = express.Router();

// Get plan limits and features
router.get('/', authenticateToken, PlansController.getLimits);
router.get('/limits', authenticateToken, PlansController.getLimits);

// Upgrade plan
router.post('/upgrade', [
    authenticateToken,
    body('planType').isIn(['pro', 'enterprise']).withMessage('Invalid plan type'),
    validate
], PlansController.upgradePlan);

// Get plan comparison
router.get('/comparison', authenticateToken, PlansController.comparison);

// Check feature access
router.get('/feature/:featureName', authenticateToken, PlansController.featureAccess);

// Helper function to determine required plan for a feature
// helpers moved into controller

export default router;
