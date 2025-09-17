

import express from 'express';

import authRoutes from './auth.js';
import creditRoutes from './credits.js';
import planRoutes from './plans.js';
import paymentRoutes from './payments.js';
import aiRoutes from './ai.js';
import byokRoutes from './byok.js';
import contactRoutes from './contact.js';

const router = express.Router();



router.use('/auth', authRoutes);
router.use('/credits', creditRoutes);
router.use('/user/plan-limits', planRoutes);
router.use('/payments', paymentRoutes);
router.use('/ai', aiRoutes);
router.use('/byok', byokRoutes);
router.use('/contact', contactRoutes);

export default router;


