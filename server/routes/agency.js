import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { AgencyController } from '../controllers/agencyController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(AgencyController.ensureEnabled);

router.get('/context', AgencyController.getContext);

router.get('/workspaces', AgencyController.listWorkspaces);
router.post('/workspaces', AgencyController.createWorkspace);
router.patch('/workspaces/:workspaceId', AgencyController.updateWorkspace);
router.post('/workspaces/:workspaceId/status', AgencyController.updateWorkspaceStatus);

router.get('/members', AgencyController.listMembers);
router.post('/members/invite', AgencyController.inviteMember);
router.patch('/members/:memberId', AgencyController.updateMemberRole);
router.delete('/members/:memberId', AgencyController.removeMember);

router.get('/workspaces/:workspaceId/members', AgencyController.getWorkspaceMembers);
router.put('/workspaces/:workspaceId/members', AgencyController.replaceWorkspaceMembers);

router.get('/accounts/available', AgencyController.listAvailableAccounts);
router.get('/workspaces/:workspaceId/accounts', AgencyController.listWorkspaceAccounts);
router.post('/workspaces/:workspaceId/accounts', AgencyController.attachWorkspaceAccount);
router.delete('/workspaces/:workspaceId/accounts/:workspaceAccountId', AgencyController.detachWorkspaceAccount);

router.post('/workspaces/:workspaceId/launch-token', AgencyController.createLaunchToken);
router.get('/access-matrix', AgencyController.getAccessMatrix);

export default router;
