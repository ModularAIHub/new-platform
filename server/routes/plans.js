import express from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import PlansController from '../controllers/plansController.js';

const router = express.Router();

// Plan configurations
const PLAN_LIMITS = {
    free: {
        credits: 25,
        profilesPerPlatform: 1,
        features: ['basic_ai_generation', 'built_in_keys'],
        support: 'community'
    },
    pro: {
        credits: 150, // 200 with own keys
        profilesPerPlatform: 3,
        features: ['basic_ai_generation', 'built_in_keys', 'own_keys', 'email_support'],
        support: 'email'
    },
    enterprise: {
        credits: 500, // 750 with own keys
        profilesPerPlatform: 6,
        features: ['basic_ai_generation', 'built_in_keys', 'own_keys', 'team_collaboration', 'priority_support'],
        support: 'priority',
        teamMembers: 5
    }
};

// Get plan limits and features
router.get('/', authenticateToken, PlansController.getLimits);

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
