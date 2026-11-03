import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

const APPROVAL_JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

function cleanText(value, fallback = null) {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function isRelationMissing(error) {
  return error?.code === '42P01';
}

function normalizeStringArray(value, maxItems = 12) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => cleanText(item, null)).filter(Boolean))].slice(0, maxItems);
}

function normalizePostingPreferences(value) {
  const raw = value && typeof value === 'object' ? value : {};
  return {
    brand_colors: normalizeStringArray(raw.brand_colors || raw.brandColors || [], 8),
    industry: cleanText(raw.industry, null),
    target_audience: cleanText(raw.target_audience || raw.targetAudience, null),
    portal_title: cleanText(raw.portal_title || raw.portalTitle, null),
    portal_message: cleanText(raw.portal_message || raw.portalMessage, null),
  };
}

function resolvePortalAccentColor(colors = []) {
  const palette = Array.isArray(colors) ? colors : [];
  const match = palette.find((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(color || '').trim()));
  return match || '#2563eb';
}

async function touchApprovalToken(token) {
  try {
    await query(
      `UPDATE agency_approval_tokens
       SET last_used_at = NOW(),
           updated_at = NOW()
       WHERE token = $1`,
      [token]
    );
  } catch (error) {
    if (isRelationMissing(error)) return;
    throw error;
  }
}

async function resolveApprovalTokenContext(token) {
  const normalizedToken = cleanText(token, null);
  if (!normalizedToken) {
    const error = new Error('Approval link is invalid or expired');
    error.status = 401;
    error.code = 'INVALID_APPROVAL_TOKEN';
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(normalizedToken, APPROVAL_JWT_SECRET);
  } catch (error) {
    const invalidTokenError = new Error('Approval link is invalid or expired');
    invalidTokenError.status = 401;
    invalidTokenError.code = 'INVALID_APPROVAL_TOKEN';
    throw invalidTokenError;
  }

  if (decoded?.scope !== 'client_approval_portal') {
    const scopeError = new Error('Invalid token scope');
    scopeError.status = 403;
    scopeError.code = 'INVALID_SCOPE';
    throw scopeError;
  }

  let tokenRow = null;
  try {
    const tokenResult = await query(
      `SELECT id, workspace_id, agency_id, label, is_active, created_at, last_used_at
       FROM agency_approval_tokens
       WHERE token = $1
       LIMIT 1`,
      [normalizedToken]
    );
    tokenRow = tokenResult.rows[0] || null;
  } catch (error) {
    if (!isRelationMissing(error)) throw error;
  }

  if (tokenRow && !tokenRow.is_active) {
    const revokedError = new Error('Approval link has been revoked');
    revokedError.status = 403;
    revokedError.code = 'APPROVAL_LINK_REVOKED';
    throw revokedError;
  }

  await touchApprovalToken(normalizedToken);

  return {
    token: normalizedToken,
    tokenLabel: tokenRow?.label || null,
    workspaceId: tokenRow?.workspace_id || decoded.workspaceId,
    agencyId: tokenRow?.agency_id || decoded.agencyId,
    tokenCreatedAt: tokenRow?.created_at || null,
    tokenLastUsedAt: tokenRow?.last_used_at || null,
  };
}

async function fetchCommentsByDraftIds(draftIds) {
  if (!Array.isArray(draftIds) || draftIds.length === 0) return {};

  try {
    const result = await query(
      `SELECT id, draft_id, workspace_id, author_type, author_name, author_user_id, content, created_at
       FROM agency_draft_comments
       WHERE draft_id = ANY($1::uuid[])
       ORDER BY created_at ASC`,
      [draftIds]
    );

    return result.rows.reduce((acc, row) => {
      if (!acc[row.draft_id]) acc[row.draft_id] = [];
      acc[row.draft_id].push(row);
      return acc;
    }, {});
  } catch (error) {
    if (isRelationMissing(error)) return {};
    throw error;
  }
}

async function logPublicAudit(agencyId, action, entityId, metadata = {}) {
  try {
    await query(
      `INSERT INTO agency_audit_logs
       (agency_id, actor_user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, NULL, $2, 'agency_workspace_draft', $3, $4::jsonb, NOW())`,
      [agencyId, action, entityId, JSON.stringify(metadata)]
    );
  } catch (error) {
    if (isRelationMissing(error)) return;
    throw error;
  }
}

export const AgencyPublicController = {
  async getApprovalPortal(req, res) {
    try {
      const context = await resolveApprovalTokenContext(req.params.token);

      const workspaceResult = await query(
        `SELECT aw.id, aw.name, aw.brand_name, aw.logo_url, aw.status, aa.name AS agency_name,
                aws.posting_preferences
         FROM agency_workspaces aw
         JOIN agency_accounts aa ON aa.id = aw.agency_id
         LEFT JOIN agency_workspace_settings aws ON aws.workspace_id = aw.id
         WHERE aw.id = $1 AND aw.agency_id = $2 AND aw.status != 'archived'
         LIMIT 1`,
        [context.workspaceId, context.agencyId]
      );

      if (workspaceResult.rows.length === 0) {
        return res.status(404).json({ error: 'Workspace not found', code: 'WORKSPACE_NOT_FOUND' });
      }

      const draftsResult = await query(
        `SELECT
           id,
           title,
           content,
           platform_targets,
           media_urls,
           status,
           scheduled_for,
           created_at,
           updated_at,
           generation_source,
           rejected_reason,
           reviewed_at
         FROM agency_workspace_drafts
         WHERE workspace_id = $1
           AND status IN ('pending_approval', 'approved', 'rejected')
         ORDER BY
           CASE status
             WHEN 'pending_approval' THEN 0
             WHEN 'approved' THEN 1
             ELSE 2
           END,
           COALESCE(scheduled_for, updated_at, created_at) DESC,
           created_at DESC
         LIMIT 80`,
        [context.workspaceId]
      );

      const draftIds = draftsResult.rows.map((draft) => draft.id);
      const commentsByDraft = await fetchCommentsByDraftIds(draftIds);

      const workspaceRow = workspaceResult.rows[0];
      const postingPreferences = normalizePostingPreferences(workspaceRow.posting_preferences);
      const branding = {
        brandName: cleanText(workspaceRow.brand_name, workspaceRow.name),
        workspaceName: workspaceRow.name,
        logoUrl: cleanText(workspaceRow.logo_url, null),
        accentColor: resolvePortalAccentColor(postingPreferences.brand_colors),
        brandColors: postingPreferences.brand_colors,
        audience: postingPreferences.target_audience,
        industry: postingPreferences.industry,
        portalTitle: postingPreferences.portal_title,
        portalMessage: postingPreferences.portal_message,
      };

      return res.json({
        workspace: workspaceRow,
        branding,
        drafts: draftsResult.rows.map((draft) => ({
          ...draft,
          comments: commentsByDraft[draft.id] || [],
        })),
        portalMeta: {
          label: context.tokenLabel,
          pendingCount: draftsResult.rows.filter((draft) => draft.status === 'pending_approval').length,
          approvedCount: draftsResult.rows.filter((draft) => draft.status === 'approved').length,
          rejectedCount: draftsResult.rows.filter((draft) => draft.status === 'rejected').length,
        },
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to load approval portal',
        code: error.code || 'APPROVAL_PORTAL_LOAD_FAILED',
      });
    }
  },

  async approveDraft(req, res) {
    try {
      const context = await resolveApprovalTokenContext(req.params.token);
      const clientName = cleanText(req.body.clientName, 'Client');

      const result = await query(
        `UPDATE agency_workspace_drafts
         SET status = 'approved',
             rejected_reason = NULL,
             reviewed_by = NULL,
             reviewed_at = NOW(),
             updated_at = NOW()
         WHERE id = $1
           AND workspace_id = $2
           AND status = 'pending_approval'
         RETURNING id, status, title, reviewed_at`,
        [req.params.draftId, context.workspaceId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Draft not found or already processed', code: 'DRAFT_NOT_FOUND' });
      }

      await logPublicAudit(context.agencyId, 'client_approved_draft', req.params.draftId, {
        clientName,
        via: 'approval_portal',
      });

      return res.json({ success: true, draft: result.rows[0] });
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to approve draft',
        code: error.code || 'APPROVAL_ACTION_FAILED',
      });
    }
  },

  async rejectDraft(req, res) {
    try {
      const context = await resolveApprovalTokenContext(req.params.token);
      const reason = cleanText(req.body.reason, null);
      const clientName = cleanText(req.body.clientName, 'Client');

      if (!reason || reason.length < 3) {
        return res.status(400).json({
          error: 'Please provide a rejection reason with at least 3 characters',
          code: 'REJECTION_REASON_REQUIRED',
        });
      }

      const result = await query(
        `UPDATE agency_workspace_drafts
         SET status = 'rejected',
             rejected_reason = $1,
             reviewed_by = NULL,
             reviewed_at = NOW(),
             updated_at = NOW()
         WHERE id = $2
           AND workspace_id = $3
           AND status = 'pending_approval'
         RETURNING id, status, title, rejected_reason, reviewed_at`,
        [reason, req.params.draftId, context.workspaceId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Draft not found or already processed', code: 'DRAFT_NOT_FOUND' });
      }

      await logPublicAudit(context.agencyId, 'client_rejected_draft', req.params.draftId, {
        clientName,
        reason,
        via: 'approval_portal',
      });

      return res.json({ success: true, draft: result.rows[0] });
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to reject draft',
        code: error.code || 'REJECTION_ACTION_FAILED',
      });
    }
  },

  async addComment(req, res) {
    try {
      const context = await resolveApprovalTokenContext(req.params.token);
      const content = cleanText(req.body.comment || req.body.content, null);
      const clientName = cleanText(req.body.clientName, 'Client');

      if (!content) {
        return res.status(400).json({ error: 'Comment cannot be empty', code: 'COMMENT_REQUIRED' });
      }

      const draftCheck = await query(
        `SELECT id
         FROM agency_workspace_drafts
         WHERE id = $1 AND workspace_id = $2
         LIMIT 1`,
        [req.params.draftId, context.workspaceId]
      );

      if (draftCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Draft not found', code: 'DRAFT_NOT_FOUND' });
      }

      const inserted = await query(
        `INSERT INTO agency_draft_comments
         (draft_id, workspace_id, author_type, author_name, content, created_at)
         VALUES ($1, $2, 'client', $3, $4, NOW())
         RETURNING id, draft_id, workspace_id, author_type, author_name, author_user_id, content, created_at`,
        [req.params.draftId, context.workspaceId, clientName, content]
      );

      await logPublicAudit(context.agencyId, 'client_commented_on_draft', req.params.draftId, {
        clientName,
        via: 'approval_portal',
      });

      return res.status(201).json({ success: true, comment: inserted.rows[0] });
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to add comment',
        code: error.code || 'COMMENT_CREATE_FAILED',
      });
    }
  },
};
