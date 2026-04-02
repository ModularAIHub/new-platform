import express from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import PaymentsController from '../controllers/paymentsController.js';
import AgencyPaymentsController from '../controllers/agencyPaymentsController.js';

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

// Agency recurring billing
router.post('/agency/subscribe', authenticateToken, AgencyPaymentsController.subscribe);

router.post('/agency/confirm', [
    authenticateToken,
    body('razorpaySubscriptionId').optional().trim().notEmpty(),
    body('razorpay_subscription_id').optional().trim().notEmpty(),
    validate
], AgencyPaymentsController.confirm);

router.get('/agency/status', authenticateToken, AgencyPaymentsController.status);
router.post('/agency/cancel', authenticateToken, AgencyPaymentsController.cancel);
router.post('/agency/resume', authenticateToken, AgencyPaymentsController.resume);
router.get('/agency/invoices', authenticateToken, AgencyPaymentsController.invoices);

router.post('/webhooks/razorpay', AgencyPaymentsController.webhook);

// Get available packages
router.get('/packages', authenticateToken, PaymentsController.packages);

// Get payment history
router.get('/history', authenticateToken, PaymentsController.history);

export default router;
