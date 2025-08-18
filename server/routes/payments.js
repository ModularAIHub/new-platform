import express from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import PaymentsController from '../controllers/paymentsController.js';

const router = express.Router();

// Create Razorpay order
router.post('/create-order', [
    authenticateToken,
    body('type').isIn(['credits', 'plan']).withMessage('Invalid order type'),
    body('package').notEmpty().withMessage('Package is required'),
    validate
], PaymentsController.createOrder);

// Verify payment
router.post('/verify', [
    authenticateToken,
    body('razorpayOrderId').trim().notEmpty().withMessage('Order ID is required'),
    body('razorpayPaymentId').trim().notEmpty().withMessage('Payment ID is required'),
    body('razorpaySignature').trim().notEmpty().withMessage('Signature is required'),
    validate
], PaymentsController.verify);

// Webhook endpoints are intentionally removed for MVP per requirements

// Get available packages
router.get('/packages', authenticateToken, PaymentsController.packages);

// Get payment history
router.get('/history', authenticateToken, PaymentsController.history);

export default router;
