import express from 'express';
import authRoutes from './auth.js';
import creditRoutes from './credits.js';
import apiKeyRoutes from './apiKeys.js';
import planRoutes from './plans.js';
import paymentRoutes from './payments.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/credits', creditRoutes);
router.use('/user/api-keys', apiKeyRoutes);
router.use('/user/plan-limits', planRoutes);
router.use('/payments', paymentRoutes);

export default router;


