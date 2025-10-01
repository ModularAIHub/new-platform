import express from 'express';
import WorkspaceController from '../controllers/workspaceController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All workspace routes require authentication
router.use(authenticateToken);

// Create workspace (Pro+ users only)
router.post('/', WorkspaceController.create);

// List user's workspaces
router.get('/', WorkspaceController.list);

// Switch to workspace
router.post('/:workspaceId/switch', WorkspaceController.switch);

// Get workspace details
router.get('/:workspaceId', WorkspaceController.details);

export default router;