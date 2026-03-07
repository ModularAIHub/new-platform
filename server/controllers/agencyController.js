import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { pool, query } from '../config/database.js';

const AGENCY_LIMITS = Object.freeze({
  workspaceLimit: 6,
  seatLimit: 6,
  workspaceAccountLimit: 8,
});

const EDIT_ROLES = new Set(['owner', 'admin']);
const VALID_MEMBER_ROLES = new Set(['owner', 'admin', 'editor', 'viewer']);
const VALID_ASSIGNABLE_ROLES = new Set(['admin', 'editor', 'viewer']);
const VALID_WORKSPACE_STATUSES = new Set(['active', 'paused', 'archived']);

const TOOL_URLS = Object.freeze({
  twitter: process.env.TWEET_GENIE_URL || process.env.TWEET_API_URL || 'https://tweet.suitegenie.in',
  linkedin: process.env.LINKEDIN_GENIE_URL || process.env.LINKEDIN_API_URL || 'https://linkedin.suitegenie.in',
  social: process.env.SOCIAL_GENIE_URL || process.env.SOCIAL_API_URL || 'https://meta.suitegenie.in',
});

function apiError(message, code = 'BAD_REQUEST', status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function cleanText(value, fallback = null) {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function cleanEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isRelationMissing(error) {
  return error?.code === '42P01' || String(error?.message || '').toLowerCase().includes('does not exist');
}

async function safeQuery(text, params = []) {
  try {
    const result = await query(text, params);
    return result.rows || [];
  } catch (error) {
    if (isRelationMissing(error)) return [];
    throw error;
  }
}

function handleError(res, error, fallback = 'Agency request failed') {
  console.error('[AgencyController] Error:', error?.message || error);
  res.status(error?.status || 500).json({ error: error?.message || fallback, code: error?.code || 'AGENCY_ERROR' });
}

async function logAudit(agencyId, actorUserId, action, entityType, entityId = null, metadata = {}) {
  await query(
    `INSERT INTO agency_audit_logs (agency_id, actor_user_id, action, entity_type, entity_id, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())`,
    [agencyId, actorUserId || null, action, entityType, entityId, JSON.stringify(metadata || {})]
  );
}

async function getMembership(userId) {
  const result = await query(
    `SELECT
       am.id AS member_id,
       am.agency_id,
       am.user_id,
       am.email,
       am.role,
       am.status,
       aa.owner_id,
       aa.name AS agency_name,
       aa.status AS agency_status,
       aa.seat_limit,
       aa.workspace_limit,
       aa.workspace_account_limit
     FROM agency_members am
     JOIN agency_accounts aa ON aa.id = am.agency_id
     WHERE am.user_id = $1
       AND am.status = 'active'
       AND aa.status != 'archived'
     ORDER BY CASE am.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, am.created_at ASC
     LIMIT 1`,
    [userId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    member: { id: row.member_id, agencyId: row.agency_id, userId: row.user_id, email: row.email, role: row.role, status: row.status },
    agency: {
      id: row.agency_id,
      ownerId: row.owner_id,
      name: row.agency_name,
      status: row.agency_status,
      seatLimit: Number(row.seat_limit || AGENCY_LIMITS.seatLimit),
      workspaceLimit: Number(row.workspace_limit || AGENCY_LIMITS.workspaceLimit),
      workspaceAccountLimit: Number(row.workspace_account_limit || AGENCY_LIMITS.workspaceAccountLimit),
    },
  };
}

async function bootstrapAgencyOwner(userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query('SELECT id, email, name, plan_type FROM users WHERE id = $1 FOR UPDATE', [userId]);
    if (userResult.rows.length === 0) throw apiError('User not found', 'USER_NOT_FOUND', 404);
    const user = userResult.rows[0];
    if (user.plan_type !== 'agency') {
      await client.query('ROLLBACK');
      return null;
    }

    let agencyId = null;
    const accountResult = await client.query('SELECT id FROM agency_accounts WHERE owner_id = $1 LIMIT 1', [userId]);
    if (accountResult.rows.length > 0) {
      agencyId = accountResult.rows[0].id;
    } else {
      const created = await client.query(
        `INSERT INTO agency_accounts (owner_id, name, status, seat_limit, workspace_limit, workspace_account_limit, created_at, updated_at)
         VALUES ($1, $2, 'active', $3, $4, $5, NOW(), NOW()) RETURNING id`,
        [userId, `${cleanText(user.name, user.email)} Workspace Hub`, AGENCY_LIMITS.seatLimit, AGENCY_LIMITS.workspaceLimit, AGENCY_LIMITS.workspaceAccountLimit]
      );
      agencyId = created.rows[0].id;
    }

    const ownerMember = await client.query(
      `SELECT id FROM agency_members WHERE agency_id = $1 AND user_id = $2 AND role = 'owner' LIMIT 1`,
      [agencyId, userId]
    );
    if (ownerMember.rows.length === 0) {
      await client.query(
        `INSERT INTO agency_members (agency_id, user_id, email, role, status, invited_at, joined_at, created_at, updated_at)
         VALUES ($1, $2, $3, 'owner', 'active', NOW(), NOW(), NOW(), NOW())`,
        [agencyId, userId, cleanEmail(user.email)]
      );
    } else {
      await client.query(
        `UPDATE agency_members
         SET email = $1, status = 'active', role = 'owner', joined_at = COALESCE(joined_at, NOW()), updated_at = NOW()
         WHERE id = $2`,
        [cleanEmail(user.email), ownerMember.rows[0].id]
      );
    }

    await client.query('COMMIT');
    await logAudit(agencyId, userId, 'agency_owner_bootstrap', 'agency_account', agencyId, {});
    return agencyId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getAgencyContext(userId) {
  let membership = await getMembership(userId);
  if (!membership) {
    await bootstrapAgencyOwner(userId);
    membership = await getMembership(userId);
  }
  if (!membership) throw apiError('Agency access is not enabled for this account', 'AGENCY_ACCESS_DENIED', 403);
  return membership;
}

async function getWorkspace(workspaceId, agencyId) {
  const result = await query('SELECT * FROM agency_workspaces WHERE id = $1 AND agency_id = $2 LIMIT 1', [workspaceId, agencyId]);
  if (result.rows.length === 0) throw apiError('Workspace not found', 'WORKSPACE_NOT_FOUND', 404);
  return result.rows[0];
}

export const AgencyController = {
  async ensureEnabled(req, res, next) {
    if (process.env.AGENCY_HUB_ENABLED !== 'true') {
      return res.status(503).json({ error: 'Agency Hub is disabled', code: 'AGENCY_HUB_DISABLED' });
    }
    next();
  },

  async getContext(req, res) {
    try {
      const context = await getAgencyContext(req.user.id);
      const workspaceCount = await query(
        `SELECT COUNT(*) FILTER (WHERE status IN ('active', 'paused')) AS active_like,
                COUNT(*) FILTER (WHERE status = 'archived') AS archived
         FROM agency_workspaces WHERE agency_id = $1`,
        [context.agency.id]
      );
      const seatCount = await query(
        `SELECT COUNT(*) AS active_seats
         FROM agency_members
         WHERE agency_id = $1 AND status = 'active'`,
        [context.agency.id]
      );
      return res.json({
        agency: context.agency,
        member: context.member,
        limits: {
          workspaceLimit: context.agency.workspaceLimit,
          seatLimit: context.agency.seatLimit,
          workspaceAccountLimit: context.agency.workspaceAccountLimit,
        },
        usage: {
          workspaceCount: Number(workspaceCount.rows[0]?.active_like || 0),
          archivedWorkspaceCount: Number(workspaceCount.rows[0]?.archived || 0),
          activeSeatCount: Number(seatCount.rows[0]?.active_seats || 0),
        },
      });
    } catch (error) {
      return handleError(res, error, 'Failed to load agency context');
    }
  },

  async listWorkspaces(req, res) {
    try {
      const { agency } = await getAgencyContext(req.user.id);
      const includeArchived = String(req.query.includeArchived || '').toLowerCase() === 'true';
      const summary = await query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'active') AS active,
           COUNT(*) FILTER (WHERE status = 'paused') AS paused,
           COUNT(*) FILTER (WHERE status = 'archived') AS archived
         FROM agency_workspaces WHERE agency_id = $1`,
        [agency.id]
      );
      const rows = await query(
        `SELECT aw.*,
                COALESCE(m.member_count, 0) AS member_count,
                COALESCE(a.account_count, 0) AS account_count
         FROM agency_workspaces aw
         LEFT JOIN (
           SELECT workspace_id, COUNT(*) AS member_count FROM agency_workspace_members GROUP BY workspace_id
         ) m ON m.workspace_id = aw.id
         LEFT JOIN (
           SELECT workspace_id, COUNT(*) AS account_count FROM agency_workspace_accounts WHERE is_active = true GROUP BY workspace_id
         ) a ON a.workspace_id = aw.id
         WHERE aw.agency_id = $1 AND ($2::boolean = true OR aw.status != 'archived')
         ORDER BY aw.created_at DESC`,
        [agency.id, includeArchived]
      );
      return res.json({
        summary: {
          active: Number(summary.rows[0]?.active || 0),
          paused: Number(summary.rows[0]?.paused || 0),
          archived: Number(summary.rows[0]?.archived || 0),
        },
        workspaces: rows.rows,
      });
    } catch (error) {
      return handleError(res, error, 'Failed to list agency workspaces');
    }
  },

  async createWorkspace(req, res) {
    try {
      const { agency, member } = await getAgencyContext(req.user.id);
      if (!EDIT_ROLES.has(member.role)) throw apiError('Only owner/admin can create workspaces', 'INSUFFICIENT_PERMISSIONS', 403);

      const name = cleanText(req.body.name);
      if (!name) throw apiError('Workspace name is required', 'WORKSPACE_NAME_REQUIRED', 400);

      const currentCount = await query(
        `SELECT COUNT(*) AS count FROM agency_workspaces WHERE agency_id = $1 AND status IN ('active', 'paused')`,
        [agency.id]
      );
      if (Number(currentCount.rows[0]?.count || 0) >= agency.workspaceLimit) {
        throw apiError(`Workspace limit reached (${agency.workspaceLimit})`, 'WORKSPACE_LIMIT_REACHED', 400);
      }

      const created = await query(
        `INSERT INTO agency_workspaces
         (agency_id, name, brand_name, logo_url, timezone, status, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', $6, NOW(), NOW())
         RETURNING *`,
        [
          agency.id,
          name,
          cleanText(req.body.brand_name, name),
          cleanText(req.body.logo_url, null),
          cleanText(req.body.timezone, 'UTC'),
          req.user.id,
        ]
      );
      await logAudit(agency.id, req.user.id, 'workspace_created', 'agency_workspace', created.rows[0].id, { name });
      return res.status(201).json({ workspace: created.rows[0] });
    } catch (error) {
      return handleError(res, error, 'Failed to create workspace');
    }
  },

  async updateWorkspace(req, res) {
    try {
      const { agency, member } = await getAgencyContext(req.user.id);
      if (!EDIT_ROLES.has(member.role)) throw apiError('Only owner/admin can update workspaces', 'INSUFFICIENT_PERMISSIONS', 403);
      const workspaceId = req.params.workspaceId;
      const workspace = await getWorkspace(workspaceId, agency.id);
      if (workspace.status === 'archived') throw apiError('Archived workspace cannot be edited', 'WORKSPACE_ARCHIVED', 400);

      const fields = [];
      const values = [];
      const pushField = (field, value) => {
        if (value === undefined) return;
        values.push(value);
        fields.push(`${field} = $${values.length}`);
      };

      pushField('name', cleanText(req.body.name, workspace.name));
      pushField('brand_name', cleanText(req.body.brand_name, workspace.brand_name));
      pushField('timezone', cleanText(req.body.timezone, workspace.timezone));
      if (req.body.logo_url !== undefined) pushField('logo_url', req.body.logo_url === null ? null : cleanText(req.body.logo_url, null));

      if (fields.length === 0) return res.json({ workspace });
      values.push(workspaceId, agency.id);
      const updated = await query(
        `UPDATE agency_workspaces SET ${fields.join(', ')}, updated_at = NOW()
         WHERE id = $${values.length - 1} AND agency_id = $${values.length}
         RETURNING *`,
        values
      );
      await logAudit(agency.id, req.user.id, 'workspace_updated', 'agency_workspace', workspaceId, req.body);
      return res.json({ workspace: updated.rows[0] });
    } catch (error) {
      return handleError(res, error, 'Failed to update workspace');
    }
  },

  async updateWorkspaceStatus(req, res) {
    try {
      const { agency, member } = await getAgencyContext(req.user.id);
      if (!EDIT_ROLES.has(member.role)) throw apiError('Only owner/admin can update workspace status', 'INSUFFICIENT_PERMISSIONS', 403);
      const status = cleanText(req.body.status);
      if (!VALID_WORKSPACE_STATUSES.has(status)) throw apiError('Invalid workspace status', 'INVALID_WORKSPACE_STATUS', 400);

      const workspace = await getWorkspace(req.params.workspaceId, agency.id);
      const updated = await query(
        `UPDATE agency_workspaces SET status = $1, updated_at = NOW() WHERE id = $2 AND agency_id = $3 RETURNING *`,
        [status, workspace.id, agency.id]
      );
      await logAudit(agency.id, req.user.id, 'workspace_status_changed', 'agency_workspace', workspace.id, { from: workspace.status, to: status });
      return res.json({ workspace: updated.rows[0] });
    } catch (error) {
      return handleError(res, error, 'Failed to update workspace status');
    }
  },

  async listMembers(req, res) {
    try {
      const { agency } = await getAgencyContext(req.user.id);
      const members = await query(
        `SELECT
           am.id, am.user_id, am.email, am.role, am.status, am.invited_at, am.joined_at,
           COALESCE(u.name, SPLIT_PART(am.email, '@', 1)) AS display_name,
           COUNT(awm.id)::int AS workspace_assignment_count
         FROM agency_members am
         LEFT JOIN users u ON u.id = am.user_id
         LEFT JOIN agency_workspace_members awm ON awm.agency_member_id = am.id
         WHERE am.agency_id = $1
           AND am.status IN ('active', 'pending')
         GROUP BY am.id, u.name
         ORDER BY CASE am.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'editor' THEN 2 ELSE 3 END, am.created_at ASC`,
        [agency.id]
      );
      const seatCount = await query(
        `SELECT COUNT(*) AS active_seats FROM agency_members WHERE agency_id = $1 AND status = 'active'`,
        [agency.id]
      );
      return res.json({
        seatUsage: Number(seatCount.rows[0]?.active_seats || 0),
        seatLimit: agency.seatLimit,
        members: members.rows,
      });
    } catch (error) {
      return handleError(res, error, 'Failed to list agency members');
    }
  },

  async inviteMember(req, res) {
    try {
      const { agency, member } = await getAgencyContext(req.user.id);
      if (!EDIT_ROLES.has(member.role)) throw apiError('Only owner/admin can invite members', 'INSUFFICIENT_PERMISSIONS', 403);

      const email = cleanEmail(req.body.email);
      const role = cleanText(req.body.role, 'editor');
      if (!email) throw apiError('Invite email is required', 'EMAIL_REQUIRED', 400);
      if (!VALID_ASSIGNABLE_ROLES.has(role)) throw apiError('Invalid role. Use admin/editor/viewer', 'INVALID_ROLE', 400);

      const seatCount = await query(`SELECT COUNT(*) AS count FROM agency_members WHERE agency_id = $1 AND status = 'active'`, [agency.id]);
      if (Number(seatCount.rows[0]?.count || 0) >= agency.seatLimit) {
        throw apiError(`Seat limit reached (${agency.seatLimit})`, 'SEAT_LIMIT_REACHED', 400);
      }

      const existing = await query(
        `SELECT id, status FROM agency_members WHERE agency_id = $1 AND email = $2 ORDER BY created_at DESC LIMIT 1`,
        [agency.id, email]
      );
      let memberId = null;
      let isResend = false;
      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        if (row.status === 'active') throw apiError('Member is already active', 'MEMBER_ALREADY_ACTIVE', 400);
        await query(
          `UPDATE agency_members
           SET role = $1, status = 'pending', invited_by = $2, invited_at = NOW(), updated_at = NOW()
           WHERE id = $3`,
          [role, req.user.id, row.id]
        );
        memberId = row.id;
        isResend = true;
      } else {
        const createdMember = await query(
          `INSERT INTO agency_members (agency_id, email, role, status, invited_by, invited_at, created_at, updated_at)
           VALUES ($1, $2, $3, 'pending', $4, NOW(), NOW(), NOW()) RETURNING id`,
          [agency.id, email, role, req.user.id]
        );
        memberId = createdMember.rows[0].id;
      }

      await query(
        `UPDATE agency_invitations
         SET status = 'cancelled', updated_at = NOW()
         WHERE agency_id = $1 AND email = $2 AND status = 'pending'`,
        [agency.id, email]
      );
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const invitation = await query(
        `INSERT INTO agency_invitations (agency_id, email, role, invited_by, token, expires_at, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
         RETURNING id, email, role, token, expires_at, status, created_at`,
        [agency.id, email, role, req.user.id, token, expiresAt]
      );

      await logAudit(agency.id, req.user.id, isResend ? 'member_invite_resent' : 'member_invited', 'agency_member', memberId, { email, role });
      return res.json({ isResend, memberId, invitation: invitation.rows[0] });
    } catch (error) {
      return handleError(res, error, 'Failed to invite agency member');
    }
  },

  async updateMemberRole(req, res) {
    try {
      const { agency, member } = await getAgencyContext(req.user.id);
      const targetRole = cleanText(req.body.role);
      if (!VALID_ASSIGNABLE_ROLES.has(targetRole)) throw apiError('Invalid role. Use admin/editor/viewer', 'INVALID_ROLE', 400);
      if (!EDIT_ROLES.has(member.role)) throw apiError('Only owner/admin can update roles', 'INSUFFICIENT_PERMISSIONS', 403);

      const target = await query(`SELECT id, role FROM agency_members WHERE id = $1 AND agency_id = $2 LIMIT 1`, [req.params.memberId, agency.id]);
      if (target.rows.length === 0) throw apiError('Member not found', 'MEMBER_NOT_FOUND', 404);
      if (target.rows[0].role === 'owner') throw apiError('Owner role cannot be changed', 'OWNER_ROLE_IMMUTABLE', 400);
      if (member.role === 'admin' && target.rows[0].role === 'admin') throw apiError('Admins cannot edit another admin', 'INSUFFICIENT_PERMISSIONS', 403);

      const updated = await query(
        `UPDATE agency_members SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [targetRole, req.params.memberId]
      );
      await logAudit(agency.id, req.user.id, 'member_role_updated', 'agency_member', req.params.memberId, { to: targetRole });
      return res.json({ member: updated.rows[0] });
    } catch (error) {
      return handleError(res, error, 'Failed to update member role');
    }
  },

  async removeMember(req, res) {
    try {
      const { agency, member } = await getAgencyContext(req.user.id);
      if (!EDIT_ROLES.has(member.role)) throw apiError('Only owner/admin can remove members', 'INSUFFICIENT_PERMISSIONS', 403);

      const target = await query(
        `SELECT id, email, role FROM agency_members WHERE id = $1 AND agency_id = $2 LIMIT 1`,
        [req.params.memberId, agency.id]
      );
      if (target.rows.length === 0) throw apiError('Member not found', 'MEMBER_NOT_FOUND', 404);
      if (target.rows[0].role === 'owner') throw apiError('Owner cannot be removed', 'OWNER_REMOVAL_FORBIDDEN', 400);
      if (member.role === 'admin' && target.rows[0].role === 'admin') throw apiError('Admins cannot remove another admin', 'INSUFFICIENT_PERMISSIONS', 403);

      await query(`DELETE FROM agency_workspace_members WHERE agency_member_id = $1`, [req.params.memberId]);
      await query(`UPDATE agency_members SET status = 'removed', updated_at = NOW() WHERE id = $1`, [req.params.memberId]);
      await query(
        `UPDATE agency_invitations SET status = 'cancelled', updated_at = NOW() WHERE agency_id = $1 AND email = $2 AND status = 'pending'`,
        [agency.id, target.rows[0].email]
      );
      await logAudit(agency.id, req.user.id, 'member_removed', 'agency_member', req.params.memberId, { email: target.rows[0].email });
      return res.json({ success: true });
    } catch (error) {
      return handleError(res, error, 'Failed to remove member');
    }
  },

  async getWorkspaceMembers(req, res) {
    try {
      const { agency } = await getAgencyContext(req.user.id);
      const workspace = await getWorkspace(req.params.workspaceId, agency.id);

      const assigned = await query(
        `SELECT am.id, am.user_id, am.email, am.role, am.status, COALESCE(u.name, SPLIT_PART(am.email, '@', 1)) AS display_name
         FROM agency_workspace_members awm
         JOIN agency_members am ON am.id = awm.agency_member_id
         LEFT JOIN users u ON u.id = am.user_id
         WHERE awm.workspace_id = $1 AND am.status = 'active'
         ORDER BY CASE am.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'editor' THEN 2 ELSE 3 END, am.created_at ASC`,
        [workspace.id]
      );

      const available = await query(
        `SELECT am.id, am.user_id, am.email, am.role, am.status, COALESCE(u.name, SPLIT_PART(am.email, '@', 1)) AS display_name,
                EXISTS(SELECT 1 FROM agency_workspace_members x WHERE x.workspace_id = $2 AND x.agency_member_id = am.id) AS is_assigned
         FROM agency_members am
         LEFT JOIN users u ON u.id = am.user_id
         WHERE am.agency_id = $1 AND am.status = 'active'
         ORDER BY CASE am.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'editor' THEN 2 ELSE 3 END, am.created_at ASC`,
        [agency.id, workspace.id]
      );

      return res.json({ assignedMembers: assigned.rows, availableMembers: available.rows });
    } catch (error) {
      return handleError(res, error, 'Failed to load workspace members');
    }
  },

  async replaceWorkspaceMembers(req, res) {
    try {
      const { agency, member } = await getAgencyContext(req.user.id);
      if (!EDIT_ROLES.has(member.role)) throw apiError('Only owner/admin can update workspace access', 'INSUFFICIENT_PERMISSIONS', 403);
      const workspace = await getWorkspace(req.params.workspaceId, agency.id);
      if (workspace.status === 'archived') throw apiError('Archived workspace assignments cannot be changed', 'WORKSPACE_ARCHIVED', 400);

      const memberIds = Array.isArray(req.body.memberIds) ? [...new Set(req.body.memberIds.filter(Boolean))] : [];
      if (memberIds.length > 0) {
        const valid = await query(
          `SELECT id FROM agency_members WHERE agency_id = $1 AND status = 'active' AND id = ANY($2::uuid[])`,
          [agency.id, memberIds]
        );
        if (valid.rows.length !== memberIds.length) throw apiError('Invalid workspace member selection', 'INVALID_WORKSPACE_MEMBER_SELECTION', 400);
      }

      await query(`DELETE FROM agency_workspace_members WHERE workspace_id = $1`, [workspace.id]);
      for (const memberId of memberIds) {
        await query(
          `INSERT INTO agency_workspace_members (workspace_id, agency_member_id, assigned_by, created_at)
           VALUES ($1, $2, $3, NOW()) ON CONFLICT (workspace_id, agency_member_id) DO NOTHING`,
          [workspace.id, memberId, req.user.id]
        );
      }
      await logAudit(agency.id, req.user.id, 'workspace_members_replaced', 'agency_workspace', workspace.id, { memberIds });
      return res.json({ assignedMemberIds: memberIds });
    } catch (error) {
      return handleError(res, error, 'Failed to update workspace members');
    }
  },

  async listAvailableAccounts(req, res) {
    try {
      await getAgencyContext(req.user.id);
      const accounts = [];
      const pushRows = (rows, sourceType) => {
        for (const row of rows) {
          accounts.push({
            sourceType,
            sourceId: String(row.source_id || row.id || ''),
            platform: row.platform || null,
            accountId: row.account_id || null,
            accountUsername: row.account_username || null,
            accountDisplayName: row.account_display_name || null,
            profileImageUrl: row.profile_image_url || null,
            metadata: row.metadata || {},
          });
        }
      };

      const registry = await safeQuery(
        `SELECT sca.id::text AS source_id, sca.platform, sca.account_id, sca.account_username, sca.account_display_name, sca.profile_image_url, sca.metadata
         FROM social_connected_accounts sca
         WHERE sca.is_active = true
           AND (sca.user_id::text = $1::text OR sca.connected_by::text = $1::text)`,
        [req.user.id]
      );
      pushRows(registry, 'social_connected_accounts');

      const personal = await safeQuery(
        `SELECT usa.id::text AS source_id, usa.platform, usa.account_id, usa.account_username, usa.account_display_name, usa.profile_image_url,
                jsonb_build_object('team_id', usa.team_id) AS metadata
         FROM user_social_accounts usa
         WHERE usa.is_active = true AND usa.user_id::text = $1::text`,
        [req.user.id]
      );
      pushRows(personal, 'user_social_accounts');

      const teamTwitter = await safeQuery(
        `SELECT ta.id::text AS source_id, 'twitter' AS platform, ta.twitter_user_id AS account_id, ta.twitter_username AS account_username,
                ta.twitter_display_name AS account_display_name, ta.twitter_profile_image_url AS profile_image_url,
                jsonb_build_object('team_id', ta.team_id) AS metadata
         FROM team_accounts ta
         JOIN team_members tm ON tm.team_id::text = ta.team_id::text AND tm.user_id::text = $1::text AND tm.status = 'active'
         WHERE ta.active = true`,
        [req.user.id]
      );
      pushRows(teamTwitter, 'team_accounts');

      const teamLinkedIn = await safeQuery(
        `SELECT lta.id::text AS source_id, 'linkedin' AS platform, lta.linkedin_user_id AS account_id, lta.linkedin_username AS account_username,
                lta.linkedin_display_name AS account_display_name, lta.linkedin_profile_image_url AS profile_image_url,
                jsonb_build_object('team_id', lta.team_id, 'account_type', lta.account_type, 'organization_id', lta.organization_id) AS metadata
         FROM linkedin_team_accounts lta
         JOIN team_members tm ON tm.team_id::text = lta.team_id::text AND tm.user_id::text = $1::text AND tm.status = 'active'
         WHERE lta.active = true`,
        [req.user.id]
      );
      pushRows(teamLinkedIn, 'linkedin_team_accounts');

      const deduped = [];
      const seen = new Set();
      for (const account of accounts) {
        if (!account.sourceId || !account.platform) continue;
        const key = `${account.sourceType}:${account.sourceId}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(account);
      }

      return res.json({ accounts: deduped });
    } catch (error) {
      return handleError(res, error, 'Failed to list available accounts');
    }
  },

  async listWorkspaceAccounts(req, res) {
    try {
      const { agency } = await getAgencyContext(req.user.id);
      const workspace = await getWorkspace(req.params.workspaceId, agency.id);
      const accounts = await query(
        `SELECT * FROM agency_workspace_accounts
         WHERE workspace_id = $1 AND is_active = true
         ORDER BY created_at DESC`,
        [workspace.id]
      );
      return res.json({ accounts: accounts.rows });
    } catch (error) {
      return handleError(res, error, 'Failed to list workspace accounts');
    }
  },

  async attachWorkspaceAccount(req, res) {
    try {
      const { agency, member } = await getAgencyContext(req.user.id);
      if (!EDIT_ROLES.has(member.role)) throw apiError('Only owner/admin can attach accounts', 'INSUFFICIENT_PERMISSIONS', 403);
      const workspace = await getWorkspace(req.params.workspaceId, agency.id);
      if (workspace.status === 'archived') throw apiError('Cannot attach accounts to archived workspace', 'WORKSPACE_ARCHIVED', 400);

      const sourceType = cleanText(req.body.sourceType);
      const sourceId = cleanText(req.body.sourceId);
      const platform = cleanText(req.body.platform);
      if (!sourceType || !sourceId || !platform) throw apiError('sourceType, sourceId, and platform are required', 'ACCOUNT_SOURCE_REQUIRED', 400);

      const activeCount = await query(
        `SELECT COUNT(*) AS count FROM agency_workspace_accounts WHERE workspace_id = $1 AND is_active = true`,
        [workspace.id]
      );
      if (Number(activeCount.rows[0]?.count || 0) >= agency.workspaceAccountLimit) {
        throw apiError(`Workspace account limit reached (${agency.workspaceAccountLimit})`, 'WORKSPACE_ACCOUNT_LIMIT_REACHED', 400);
      }

      const duplicate = await query(
        `SELECT id FROM agency_workspace_accounts
         WHERE workspace_id = $1 AND source_type = $2 AND source_id = $3 AND is_active = true LIMIT 1`,
        [workspace.id, sourceType, sourceId]
      );
      if (duplicate.rows.length > 0) throw apiError('Account is already attached to this workspace', 'WORKSPACE_ACCOUNT_DUPLICATE', 409);

      const inserted = await query(
        `INSERT INTO agency_workspace_accounts
         (workspace_id, platform, source_type, source_id, account_id, account_username, account_display_name, profile_image_url, metadata, attached_by, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, true, NOW(), NOW())
         RETURNING *`,
        [
          workspace.id,
          platform,
          sourceType,
          sourceId,
          cleanText(req.body.accountId, null),
          cleanText(req.body.accountUsername, null),
          cleanText(req.body.accountDisplayName, null),
          cleanText(req.body.profileImageUrl, null),
          JSON.stringify(req.body.metadata || {}),
          req.user.id,
        ]
      );
      await logAudit(agency.id, req.user.id, 'workspace_account_attached', 'agency_workspace_account', inserted.rows[0].id, { workspaceId: workspace.id, sourceType, sourceId, platform });
      return res.status(201).json({ account: inserted.rows[0] });
    } catch (error) {
      return handleError(res, error, 'Failed to attach workspace account');
    }
  },

  async detachWorkspaceAccount(req, res) {
    try {
      const { agency, member } = await getAgencyContext(req.user.id);
      if (!EDIT_ROLES.has(member.role)) throw apiError('Only owner/admin can detach accounts', 'INSUFFICIENT_PERMISSIONS', 403);
      const workspace = await getWorkspace(req.params.workspaceId, agency.id);
      const detached = await query(
        `UPDATE agency_workspace_accounts
         SET is_active = false, updated_at = NOW()
         WHERE id = $1 AND workspace_id = $2 AND is_active = true
         RETURNING *`,
        [req.params.workspaceAccountId, workspace.id]
      );
      if (detached.rows.length === 0) throw apiError('Workspace account not found', 'WORKSPACE_ACCOUNT_NOT_FOUND', 404);
      await logAudit(agency.id, req.user.id, 'workspace_account_detached', 'agency_workspace_account', req.params.workspaceAccountId, { workspaceId: workspace.id });
      return res.json({ account: detached.rows[0] });
    } catch (error) {
      return handleError(res, error, 'Failed to detach workspace account');
    }
  },

  async createLaunchToken(req, res) {
    try {
      const { agency, member } = await getAgencyContext(req.user.id);
      const workspace = await getWorkspace(req.params.workspaceId, agency.id);
      if (workspace.status === 'archived') throw apiError('Cannot launch from archived workspace', 'WORKSPACE_ARCHIVED', 400);

      const assignment = await query(
        `SELECT 1 FROM agency_workspace_members WHERE workspace_id = $1 AND agency_member_id = $2 LIMIT 1`,
        [workspace.id, member.id]
      );
      if (assignment.rows.length === 0 && !EDIT_ROLES.has(member.role)) {
        throw apiError('You do not have access to this workspace', 'WORKSPACE_ACCESS_DENIED', 403);
      }

      const assignedAccounts = await query(
        `SELECT source_type, source_id, account_id
         FROM agency_workspace_accounts
         WHERE workspace_id = $1 AND is_active = true`,
        [workspace.id]
      );
      const allowedAccountIds = assignedAccounts.rows.map((row) => row.account_id || `${row.source_type}:${row.source_id}`);
      const payload = {
        agencyId: agency.id,
        workspaceId: workspace.id,
        userId: req.user.id,
        role: member.role,
        allowedAccountIds,
        iss: 'suitegenie-platform',
        aud: ['tweet-genie', 'linkedin-genie', 'social-genie'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 60),
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'development-secret');
      const selectedTool = cleanText(req.body.tool, 'twitter');
      const launchUrls = {
        twitter: `${String(TOOL_URLS.twitter).replace(/\/+$/, '')}/?agency_token=${encodeURIComponent(token)}&workspace_id=${encodeURIComponent(workspace.id)}&tool=twitter`,
        linkedin: `${String(TOOL_URLS.linkedin).replace(/\/+$/, '')}/?agency_token=${encodeURIComponent(token)}&workspace_id=${encodeURIComponent(workspace.id)}&tool=linkedin`,
        social: `${String(TOOL_URLS.social).replace(/\/+$/, '')}/?agency_token=${encodeURIComponent(token)}&workspace_id=${encodeURIComponent(workspace.id)}&tool=social`,
      };

      await logAudit(agency.id, req.user.id, 'workspace_launch_token_created', 'agency_workspace', workspace.id, { selectedTool });
      return res.json({
        token,
        expiresIn: 30 * 60,
        selectedTool,
        launchUrl: launchUrls[selectedTool] || launchUrls.twitter,
        launchUrls,
      });
    } catch (error) {
      return handleError(res, error, 'Failed to create launch token');
    }
  },

  async getAccessMatrix(req, res) {
    try {
      const { agency } = await getAgencyContext(req.user.id);
      const members = await query(
        `SELECT id, user_id, email, role, status
         FROM agency_members
         WHERE agency_id = $1 AND status = 'active'
         ORDER BY CASE role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'editor' THEN 2 ELSE 3 END, created_at ASC`,
        [agency.id]
      );
      const workspaces = await query(
        `SELECT id, name, brand_name, status FROM agency_workspaces WHERE agency_id = $1 ORDER BY created_at DESC`,
        [agency.id]
      );
      const assignments = await query(
        `SELECT awm.workspace_id, awm.agency_member_id
         FROM agency_workspace_members awm
         JOIN agency_members am ON am.id = awm.agency_member_id
         WHERE am.agency_id = $1 AND am.status = 'active'`,
        [agency.id]
      );
      const assigned = new Set(assignments.rows.map((row) => `${row.workspace_id}:${row.agency_member_id}`));
      const matrix = workspaces.rows.map((workspace) => ({
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        workspaceStatus: workspace.status,
        members: members.rows.map((member) => ({
          memberId: member.id,
          email: member.email,
          role: member.role,
          hasAccess: member.role === 'owner' || member.role === 'admin' || assigned.has(`${workspace.id}:${member.id}`),
        })),
      }));

      return res.json({ members: members.rows, workspaces: workspaces.rows, assignments: assignments.rows, matrix });
    } catch (error) {
      return handleError(res, error, 'Failed to get access matrix');
    }
  },
};
