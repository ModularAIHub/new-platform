

import express from 'express';

import authRoutes from './auth.js';
import creditRoutes from './credits.js';
import planRoutes from './plans.js';
import paymentRoutes from './payments.js';
import aiRoutes from './ai.js';
import byokRoutes from './byok.js';
import contactRoutes from './contact.js';
import creditResetRoutes from './creditReset.js';
import workspaceRoutes from './workspace.js';
import teamRoutes from './team.js';
import proTeamRoutes from './proTeam.js';

const router = express.Router();



router.use('/auth', authRoutes);
router.use('/credits', creditRoutes);
router.use('/plans', planRoutes);
router.use('/payments', paymentRoutes);
router.use('/ai', aiRoutes);
router.use('/byok', byokRoutes);
router.use('/contact', contactRoutes);
router.use('/credit-reset', creditResetRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/team', teamRoutes);
router.use('/pro-team', proTeamRoutes);

export default router;


