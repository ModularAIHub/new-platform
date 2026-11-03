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

// Public routes for token-based invitations
router.get('/invitations/token/:token', TeamController.getInvitationByToken);
router.post('/invitations/token/:token/accept', TeamController.acceptInvitationByToken);
router.post('/invitations/token/:token/decline', TeamController.declineInvitationByToken);

// Invite team member to team
router.post('/teams/:teamId/invite', TeamController.invite);

// Update team member role
router.put('/teams/:teamId/members/:memberId/role', TeamController.updateRole);

// Remove team member by team_members.id (pending or active)
router.delete('/members/:memberId', TeamController.removeByMemberId);
// Remove team member by user_id (legacy/active)
router.delete('/teams/:teamId/members/:memberId', TeamController.remove);

export default router;