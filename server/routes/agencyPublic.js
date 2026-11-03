import express from 'express';
import { AgencyController } from '../controllers/agencyController.js';
import { AgencyPublicController } from '../controllers/agencyPublicController.js';

const router = express.Router();

router.use(AgencyController.ensureEnabled);

router.get('/approval/:token', AgencyPublicController.getApprovalPortal);
router.post('/approval/:token/approve/:draftId', AgencyPublicController.approveDraft);
router.post('/approval/:token/reject/:draftId', AgencyPublicController.rejectDraft);
router.post('/approval/:token/comment/:draftId', AgencyPublicController.addComment);

export default router;
