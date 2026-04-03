import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { AgencyController } from '../controllers/agencyController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const requireInternalApiKey = (req, res, next) => {
  const expected = String(process.env.INTERNAL_API_KEY || '').trim();
  const provided = String(req.headers['x-internal-api-key'] || '').trim();
  if (!expected || !provided || expected !== provided) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED_INTERNAL_CALL' });
  }
  next();
};

// Authenticated invitation listing for current user.
router.get('/invitations/pending', authenticateToken, AgencyController.ensureEnabled, AgencyController.listPendingInvitations);

// Public invitation routes (token-based).
router.get('/invitations/:token', AgencyController.getInvitationByToken);
router.post('/invitations/:token/decline', AgencyController.declineInvitationByToken);
router.get('/client/onboarding/:token', AgencyController.ensureEnabled, AgencyController.getClientOnboardingStatus);
router.post('/client/onboarding/:token/connect', AgencyController.ensureEnabled, AgencyController.initiateClientOAuth);
router.post('/client-oauth-callback', AgencyController.ensureEnabled, requireInternalApiKey, AgencyController.handleClientOAuthCallback);

router.use(authenticateToken);
router.use(AgencyController.ensureEnabled);

router.post('/invitations/:token/accept', AgencyController.acceptInvitationByToken);

router.get('/context', AgencyController.getContext);

router.get('/workspaces', AgencyController.listWorkspaces);
router.post('/workspaces', AgencyController.createWorkspace);
router.get('/workspaces/:workspaceId', AgencyController.requireWorkspaceReadRole, AgencyController.getWorkspaceDetail);
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
router.post('/workspaces/:workspaceId/onboarding-link', AgencyController.createClientOnboardingLink);
router.get('/workspaces/:workspaceId/onboarding-links', AgencyController.listClientOnboardingLinks);
router.delete('/workspaces/:workspaceId/onboarding-link/:linkId', AgencyController.revokeClientOnboardingLink);
router.post('/workspaces/:workspaceId/onboarding-link/:linkId/complete', AgencyController.markClientOnboardingComplete);
router.get('/workspaces/:workspaceId/approval-links', AgencyController.requireWorkspaceApproveRole, AgencyController.listApprovalTokens);
router.get('/workspaces/:workspaceId/approval-token', AgencyController.requireWorkspaceApproveRole, AgencyController.getApprovalToken);
router.post('/workspaces/:workspaceId/approval-token', AgencyController.requireWorkspaceApproveRole, AgencyController.createApprovalToken);
router.delete('/workspaces/:workspaceId/approval-link/:tokenId', AgencyController.requireWorkspaceApproveRole, AgencyController.revokeApprovalToken);
router.get('/workspaces/:workspaceId/settings', AgencyController.requireWorkspaceReadRole, AgencyController.getWorkspaceSettings);
router.put('/workspaces/:workspaceId/settings', AgencyController.requireWorkspaceWriteRole, AgencyController.upsertWorkspaceSettings);
router.get('/workspaces/:workspaceId/drafts', AgencyController.requireWorkspaceReadRole, AgencyController.listWorkspaceDrafts);
router.post('/workspaces/:workspaceId/drafts', AgencyController.requireWorkspaceWriteRole, AgencyController.createWorkspaceDraft);
router.post('/workspaces/:workspaceId/drafts/generate', AgencyController.requireWorkspaceWriteRole, AgencyController.generateWorkspaceDraft);
router.post('/workspaces/:workspaceId/drafts/refine', AgencyController.requireWorkspaceWriteRole, AgencyController.refineWorkspaceContent);
router.post('/workspaces/:workspaceId/media/upload', AgencyController.requireWorkspaceWriteRole, upload.single('file'), AgencyController.uploadWorkspaceMedia);
router.post('/workspaces/:workspaceId/drafts/:draftId/comments', AgencyController.requireWorkspaceReadRole, AgencyController.addWorkspaceDraftComment);
router.patch('/workspaces/:workspaceId/drafts/:draftId', AgencyController.requireWorkspaceWriteRole, AgencyController.updateWorkspaceDraft);
router.delete('/workspaces/:workspaceId/drafts/:draftId', AgencyController.requireWorkspaceWriteRole, AgencyController.deleteWorkspaceDraft);
router.post('/workspaces/:workspaceId/drafts/:draftId/approve', AgencyController.requireWorkspaceApproveRole, AgencyController.approveWorkspaceDraft);
router.post('/workspaces/:workspaceId/drafts/:draftId/reject', AgencyController.requireWorkspaceApproveRole, AgencyController.rejectWorkspaceDraft);
router.post('/workspaces/:workspaceId/drafts/:draftId/schedule', AgencyController.requireWorkspaceApproveRole, AgencyController.scheduleWorkspaceDraft);
router.post('/workspaces/:workspaceId/drafts/:draftId/publish', AgencyController.requireWorkspaceApproveRole, AgencyController.publishWorkspaceDraft);
router.post('/workspaces/:workspaceId/publish', AgencyController.requireWorkspaceApproveRole, AgencyController.publishWorkspacePost);
router.get('/workspaces/:workspaceId/operations/snapshot', AgencyController.requireWorkspaceReadRole, AgencyController.getWorkspaceOperationsSnapshot);
router.get('/workspaces/:workspaceId/analytics/summary', AgencyController.requireWorkspaceReadRole, AgencyController.getWorkspaceAnalyticsSummary);
router.get('/workspaces/:workspaceId/insights/summary', AgencyController.requireWorkspaceReadRole, AgencyController.getWorkspaceInsightsSummary);
router.get('/workspaces/:workspaceId/analysis/summary', AgencyController.requireWorkspaceReadRole, AgencyController.getWorkspaceAnalysisSummary);

router.post('/workspaces/:workspaceId/launch-token', AgencyController.createLaunchToken);
router.get('/access-matrix', AgencyController.getAccessMatrix);

export default router;
