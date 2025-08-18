import express from 'express';
import { body } from 'express-validator';
import CreditController from '../controllers/creditController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Get credit balance
router.get('/balance', authenticateToken, CreditController.getBalance);

// Deduct credits (used by modules)
router.post('/deduct', [
    authenticateToken,
    body('operation').trim().notEmpty().withMessage('Operation is required'),
    body('cost').optional().isFloat({ min: 0.01 }).withMessage('Cost must be positive'),
    body('description').optional().trim(),
    validate
], CreditController.deductCredits);

// Get transaction history
router.get('/history', authenticateToken, CreditController.getTransactionHistory);

// Add credits (for purchases)
router.post('/add', [
    authenticateToken,
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
    body('description').optional().trim(),
    body('costInRupees').optional().isFloat({ min: 0 }),
    body('razorpayOrderId').optional().trim(),
    body('razorpayPaymentId').optional().trim(),
    body('razorpaySignature').optional().trim(),
    validate
], CreditController.addCredits);

// Check if user has sufficient credits
router.get('/check', authenticateToken, CreditController.checkSufficientCredits);

// Get credit costs for operations
router.get('/costs', authenticateToken, CreditController.getCreditCosts);

// Emergency sync (for critical operations)
router.post('/sync', authenticateToken, CreditController.emergencySync);

// Health check
router.get('/health', authenticateToken, CreditController.healthCheck);

// Load user data to Redis (for debugging/admin)
router.post('/load-redis', authenticateToken, CreditController.loadUserToRedis);

export default router;
