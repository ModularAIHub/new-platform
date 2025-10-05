import express from 'express';
import TeamController from '../controllers/teamController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All team routes require authentication
router.use(authenticateToken);

// Get user's pending invitations
router.get('/invitations/pending', TeamController.pendingInvites);

// Accept team invitation
router.post('/invitations/:inviteId/accept', TeamController.acceptInvite);

// Invite team member to workspace
router.post('/workspaces/:workspaceId/invite', TeamController.invite);

// Update team member role
router.put('/workspaces/:workspaceId/members/:memberId/role', TeamController.updateRole);

// Remove team member
router.delete('/workspaces/:workspaceId/members/:memberId', TeamController.remove);

export default router;