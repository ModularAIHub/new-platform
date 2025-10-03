// proTeam.js - Routes for Pro plan team collaboration
import express from 'express';
import { ProTeamController } from '../controllers/proTeamController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/invitations/:token', ProTeamController.getInvitationByToken);
router.post('/invitations/:token/decline', ProTeamController.declineInvitationByToken);

// Routes requiring authentication
router.use(authenticateToken);

// Get current user's team
router.get('/', ProTeamController.getTeam);

// Create a team (Pro users only)
router.post('/', ProTeamController.createTeam);

// Invite user to team
router.post('/invite', ProTeamController.inviteUser);

// Accept team invitation
router.post('/accept/:token', ProTeamController.acceptInvitation);

// Accept team invitation by token (authenticated)
router.post('/invitations/:token/accept', ProTeamController.acceptInvitationByToken);

// Remove team member
router.delete('/members/:memberId', ProTeamController.removeMember);

// Update team member role
router.put('/members/:memberId/role', ProTeamController.updateMemberRole);

// Get team's social accounts
router.get('/social-accounts', ProTeamController.getTeamSocialAccounts);

// Social accounts management routes
router.post('/social-accounts/connect', ProTeamController.connectAccount);
router.delete('/social-accounts/:accountId', ProTeamController.disconnectAccount);

// Leave team
router.post('/leave', ProTeamController.leaveTeam);

// Get user's role permissions and limits
router.get('/permissions', ProTeamController.getUserPermissions);

// Check specific permission
router.get('/permissions/:action', ProTeamController.checkPermission);

// Generate SSO token for subdomain access
router.post('/sso-token', ProTeamController.generateSSOToken);

export default router;