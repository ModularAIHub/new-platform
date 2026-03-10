import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { pool, query } from '../config/database.js';
import EmailService from '../services/emailService.js';

const AGENCY_LIMITS = Object.freeze({
  workspaceLimit: 6,
  seatLimit: 6,
  workspaceAccountLimit: 8,
});

const EDIT_ROLES = new Set(['owner', 'admin']);
const VALID_MEMBER_ROLES = new Set(['owner', 'admin', 'editor', 'viewer']);
const VALID_ASSIGNABLE_ROLES = new Set(['admin', 'editor', 'viewer']);
const VALID_WORKSPACE_STATUSES = new Set(['active', 'paused', 'archived']);

const TOOL_FRONTEND_HOST_BY_KEY = Object.freeze({
  twitter: 'tweet.suitegenie.in',
  linkedin: 'linkedin.suitegenie.in',
  social: 'meta.suitegenie.in',
});
const TOOL_API_HOSTS_BY_KEY = Object.freeze({
  twitter: new Set(['tweetapi.suitegenie.in', 'api.tweet.suitegenie.in']),
  linkedin: new Set(['apilinkedin.suitegenie.in', 'api.linkedin.suitegenie.in']),
  social: new Set(['metaapi.suitegenie.in', 'api.meta.suitegenie.in']),
});
const LOCAL_TOOL_FRONTEND_URLS = Object.freeze({
  twitter: process.env.TWEET_GENIE_FRONTEND_LOCAL_URL || 'http://localhost:5174',
  linkedin: process.env.LINKEDIN_GENIE_FRONTEND_LOCAL_URL || 'http://localhost:5175',
  social: process.env.SOCIAL_GENIE_FRONTEND_LOCAL_URL || 'http://localhost:5176',
});

const RAW_TOOL_URLS = Object.freeze({
  twitter:
    process.env.TWEET_GENIE_FRONTEND_URL ||
    process.env.TWEET_GENIE_URL ||
    process.env.TWEET_API_URL ||
    'https://tweet.suitegenie.in',
  linkedin:
    process.env.LINKEDIN_GENIE_FRONTEND_URL ||
    process.env.LINKEDIN_GENIE_URL ||
    process.env.LINKEDIN_WEB_URL ||
    process.env.LINKEDIN_API_URL ||
    'https://linkedin.suitegenie.in',
  social:
    process.env.SOCIAL_GENIE_FRONTEND_URL ||
    process.env.SOCIAL_GENIE_URL ||
    process.env.SOCIAL_API_URL ||
    'https://meta.suitegenie.in',
});
const TOOL_API_BASE_URLS = Object.freeze({
  twitter:
    process.env.TWEET_API_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : 'https://tweetapi.suitegenie.in'),
  linkedin:
    process.env.LINKEDIN_API_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3004' : 'https://apilinkedin.suitegenie.in'),
  social:
    process.env.SOCIAL_API_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3006' : 'https://metaapi.suitegenie.in'),
});
const AGENCY_INVITE_URL_BASE = process.env.CLIENT_URL || process.env.BASE_URL || 'https://suitegenie.in';
const TOOL_TARGET_PATHS = Object.freeze({
  twitter: Object.freeze({
    dashboard: '/',
    compose: '/compose',
    scheduling: '/scheduling',
    calendar: '/scheduling?view=calendar',
    analytics: '/analytics',
    settings: '/settings',
    connections: '/settings',
    history: '/history',
  }),
  linkedin: Object.freeze({
    dashboard: '/',
    compose: '/compose',
    scheduling: '/scheduling',
    calendar: '/scheduling?view=calendar',
    analytics: '/analytics',
    settings: '/settings',
    connections: '/settings',
    history: '/history',
    engagement: '/engagement',
  }),
  social: Object.freeze({
    dashboard: '/',
    compose: '/compose',
    scheduling: '/scheduling',
    calendar: '/scheduling?view=calendar',
    analytics: '/analytics',
    settings: '/settings',
    connections: '/settings',
    history: '/history',
  }),
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

function getAgencyInviteUrl(token) {
  const base = String(AGENCY_INVITE_URL_BASE || 'https://suitegenie.in').replace(/\/+$/, '');
  return `${base}/agency/invite/${encodeURIComponent(String(token || '').trim())}`;
}

function resolveToolBaseUrl(toolKey) {
  const normalizedTool = cleanText(toolKey, 'twitter')?.toLowerCase() || 'twitter';
  const fallbackHost = TOOL_FRONTEND_HOST_BY_KEY[normalizedTool] || TOOL_FRONTEND_HOST_BY_KEY.twitter;
  const rawValue = cleanText(RAW_TOOL_URLS[normalizedTool], '') || `https://${fallbackHost}`;

  let parsed = null;
  try {
    parsed = new URL(rawValue.includes('://') ? rawValue : `https://${rawValue}`);
  } catch (error) {
    return `https://${fallbackHost}`;
  }

  const knownApiHosts = TOOL_API_HOSTS_BY_KEY[normalizedTool];
  if (knownApiHosts?.has(parsed.hostname)) {
    parsed.hostname = fallbackHost;
    parsed.port = '';
  }

  if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
    try {
      const localFrontend = LOCAL_TOOL_FRONTEND_URLS[normalizedTool] || `http://localhost:5173`;
      const localParsed = new URL(localFrontend.includes('://') ? localFrontend : `http://${localFrontend}`);
      parsed.protocol = localParsed.protocol;
      parsed.hostname = localParsed.hostname;
      parsed.port = localParsed.port;
    } catch {
      // Keep original localhost URL if configured frontend URL is invalid.
    }
  }

  parsed.pathname = '/';
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString().replace(/\/+$/, '');
}

const TOOL_URLS = Object.freeze({
  twitter: resolveToolBaseUrl('twitter'),
  linkedin: resolveToolBaseUrl('linkedin'),
  social: resolveToolBaseUrl('social'),
});

function resolveTargetPath(tool, target) {
  const normalizedTool = cleanText(tool, 'twitter')?.toLowerCase() || 'twitter';
  const normalizedTarget = cleanText(target, 'dashboard')?.toLowerCase() || 'dashboard';
  const toolMap = TOOL_TARGET_PATHS[normalizedTool] || TOOL_TARGET_PATHS.twitter;
  const path = toolMap[normalizedTarget] || toolMap.dashboard || '/';
  return { target: toolMap[normalizedTarget] ? normalizedTarget : 'dashboard', path };
}

function buildToolLaunchUrl(baseUrl, targetPath, params = {}) {
  const base = String(baseUrl || '').trim();
  if (!base) return null;

  const [rawPath, rawQuery = ''] = String(targetPath || '/').split('?');
  const url = new URL(base.endsWith('/') ? base : `${base}/`);
  url.pathname = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

  const search = new URLSearchParams(rawQuery);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  url.search = search.toString();
  return url.toString();
}

function ensureApiBaseUrl(value, fallback) {
  const raw = cleanText(value, fallback) || fallback;
  if (!raw) return null;

  try {
    const parsed = new URL(raw.includes('://') ? raw : `https://${raw}`);
    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return cleanText(fallback, null);
  }
}

function normalizeWorkspacePlatform(value) {
  const normalized = cleanText(value, '')?.toLowerCase() || '';
  if (normalized === 'x') return 'twitter';
  if (normalized === 'tweet') return 'twitter';
  if (normalized === 'ig') return 'instagram';
  return normalized;
}

function normalizeMediaInputs(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 9);
}

function normalizeWorkspaceAccountIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((id) => cleanText(id)).filter(Boolean))];
}

function parseMetadataObject(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function resolveAccountTeamId(account = {}) {
  const metadata = parseMetadataObject(account.metadata);
  return (
    cleanText(metadata.team_id, null) ||
    cleanText(metadata.teamId, null) ||
    cleanText(account.team_id, null) ||
    null
  );
}

function resolveTwitterTargetAccountId(account = {}) {
  const metadata = parseMetadataObject(account.metadata);
  return (
    cleanText(metadata.source_id, null) ||
    cleanText(metadata.sourceId, null) ||
    cleanText(account.source_id, null) ||
    cleanText(account.account_id, null) ||
    null
  );
}

function resolveLinkedInTargetPayload(account = {}) {
  const sourceType = cleanText(account.source_type, '')?.toLowerCase() || '';
  const targetAccountId =
    cleanText(account.source_id, null) ||
    cleanText(account.account_id, null) ||
    null;
  const teamId = resolveAccountTeamId(account);

  if (!targetAccountId) return { teamId, bodyTarget: {}, targetLabel: null };

  if (teamId || sourceType === 'linkedin_team_accounts') {
    return {
      teamId,
      bodyTarget: { targetLinkedinTeamAccountId: targetAccountId },
      targetLabel: targetAccountId,
    };
  }

  return {
    teamId: null,
    bodyTarget: { targetAccountId },
    targetLabel: targetAccountId,
  };
}

function buildWorkspacePublishHeaders({ userId, teamId }) {
  const internalApiKey = cleanText(process.env.INTERNAL_API_KEY, null);
  if (!internalApiKey) {
    throw apiError('INTERNAL_API_KEY is not configured', 'INTERNAL_API_KEY_NOT_CONFIGURED', 500);
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-internal-api-key': internalApiKey,
    'x-platform-user-id': String(userId),
    'x-internal-caller': 'suitegenie-platform-agency',
  };

  if (teamId) {
    headers['x-platform-team-id'] = String(teamId);
  }

  return headers;
}

async function invokeInternalPublishEndpoint({ tool, path, userId, teamId = null, body = {} }) {
  const rawBase = TOOL_API_BASE_URLS[tool];
  if (!rawBase) {
    throw apiError(`Unsupported downstream tool "${tool}"`, 'UNSUPPORTED_DOWNSTREAM_TOOL', 400);
  }

  const baseUrl = ensureApiBaseUrl(rawBase, null);
  if (!baseUrl) {
    throw apiError(`Downstream API URL is missing for "${tool}"`, 'DOWNSTREAM_API_URL_MISSING', 500);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: buildWorkspacePublishHeaders({ userId, teamId }),
    body: JSON.stringify(body || {}),
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const err = apiError(
      cleanText(payload?.error, `Downstream ${tool} publish failed`) || `Downstream ${tool} publish failed`,
      cleanText(payload?.code, 'DOWNSTREAM_PUBLISH_FAILED') || 'DOWNSTREAM_PUBLISH_FAILED',
      response.status >= 400 && response.status < 500 ? response.status : 502
    );
    err.downstream = {
      tool,
      path,
      status: response.status,
      payload,
    };
    throw err;
  }

  return payload;
}

async function publishToWorkspaceAccount({ userId, account, content, postMode = 'single', threadParts = [], media = [] }) {
  const platform = normalizeWorkspacePlatform(account?.platform);
  const teamId = resolveAccountTeamId(account);

  if (!platform) {
    throw apiError('Workspace account platform is missing', 'WORKSPACE_ACCOUNT_PLATFORM_MISSING', 400);
  }

  const normalizedBody = {
    content,
    postMode: String(postMode || 'single').toLowerCase() === 'thread' ? 'thread' : 'single',
    threadParts: Array.isArray(threadParts) ? threadParts : [],
    mediaDetected: Array.isArray(media) && media.length > 0,
    media,
  };

  if (platform === 'twitter') {
    const targetAccountId = resolveTwitterTargetAccountId(account);
    if (targetAccountId) normalizedBody.targetAccountId = targetAccountId;
    const payload = await invokeInternalPublishEndpoint({
      tool: 'twitter',
      path: '/api/internal/twitter/cross-post',
      userId,
      teamId,
      body: normalizedBody,
    });
    return {
      platform,
      teamId,
      target: targetAccountId,
      payload,
      postId: payload?.tweetId || null,
      postUrl: payload?.tweetUrl || null,
    };
  }

  if (platform === 'linkedin') {
    const linkedInTarget = resolveLinkedInTargetPayload(account);
    const payload = await invokeInternalPublishEndpoint({
      tool: 'linkedin',
      path: '/api/internal/cross-post',
      userId,
      teamId: linkedInTarget.teamId,
      body: {
        content,
        media,
        ...linkedInTarget.bodyTarget,
      },
    });
    return {
      platform,
      teamId: linkedInTarget.teamId,
      target: linkedInTarget.targetLabel,
      payload,
      postId: payload?.linkedinPostId || null,
      postUrl: null,
    };
  }

  if (platform === 'threads' || platform === 'instagram') {
    const targetAccountId =
      cleanText(account?.source_id, null) ||
      cleanText(account?.account_id, null) ||
      null;
    if (targetAccountId) normalizedBody.targetAccountId = targetAccountId;

    const path =
      platform === 'threads'
        ? '/api/internal/threads/cross-post'
        : '/api/internal/instagram/cross-post';
    const payload = await invokeInternalPublishEndpoint({
      tool: 'social',
      path,
      userId,
      teamId,
      body: normalizedBody,
    });
    return {
      platform,
      teamId,
      target: targetAccountId,
      payload,
      postId: payload?.publishId || payload?.threadsPostId || null,
      postUrl: payload?.postUrl || null,
    };
  }

  throw apiError(`Unsupported workspace platform "${platform}"`, 'WORKSPACE_PLATFORM_UNSUPPORTED', 400);
}

function resolveSnapshotChannel(platform) {
  const normalized = normalizeWorkspacePlatform(platform);
  if (normalized === 'twitter') return 'twitter';
  if (normalized === 'linkedin') return 'linkedin';
  if (normalized === 'threads' || normalized === 'instagram' || normalized === 'social') return 'social';
  return null;
}

function resolveSnapshotPath(channel) {
  if (channel === 'twitter') return '/api/internal/twitter/workspace/snapshot';
  if (channel === 'linkedin') return '/api/internal/workspace/snapshot';
  if (channel === 'social') return '/api/internal/threads/workspace/snapshot';
  return null;
}

function buildWorkspaceSnapshotGroups(workspaceAccounts = []) {
  const groups = new Map();

  for (const account of Array.isArray(workspaceAccounts) ? workspaceAccounts : []) {
    const normalizedPlatform = normalizeWorkspacePlatform(account?.platform);
    const channel = resolveSnapshotChannel(normalizedPlatform);
    if (!channel) continue;

    const teamId = resolveAccountTeamId(account);
    const key = `${channel}|${teamId || 'personal'}`;
    const current = groups.get(key) || {
      key,
      channel,
      teamId: teamId || null,
      targetAccountIds: new Set(),
      platforms: new Set(),
      workspaceAccountIds: new Set(),
      labels: [],
    };

    current.platforms.add(normalizedPlatform);
    current.workspaceAccountIds.add(String(account.id));
    [account.source_id, account.account_id, account.id].forEach((value) => {
      const normalized = cleanText(value, null);
      if (normalized) current.targetAccountIds.add(normalized);
    });

    const label =
      cleanText(account.account_display_name, null) ||
      cleanText(account.account_username, null) ||
      cleanText(account.account_id, null) ||
      cleanText(account.source_id, null) ||
      'Account';
    current.labels.push(label);

    groups.set(key, current);
  }

  return [...groups.values()].map((group) => ({
    ...group,
    targetAccountIds: [...group.targetAccountIds],
    platforms: [...group.platforms],
    workspaceAccountIds: [...group.workspaceAccountIds],
  }));
}

function sortByMostRecentTimestamp(items = []) {
  return [...items].sort((a, b) => {
    const aTs = new Date(a?.scheduledFor || a?.createdAt || 0).getTime();
    const bTs = new Date(b?.scheduledFor || b?.createdAt || 0).getTime();
    return bTs - aTs;
  });
}

function sortByUpcomingTimestamp(items = []) {
  return [...items].sort((a, b) => {
    const aTs = new Date(a?.scheduledFor || a?.createdAt || 0).getTime();
    const bTs = new Date(b?.scheduledFor || b?.createdAt || 0).getTime();
    return aTs - bTs;
  });
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

async function sendAgencyInviteEmail({
  recipientEmail,
  invitationToken,
  inviterName,
  inviterEmail,
  agencyName,
  role,
  expiresAt,
} = {}) {
  try {
    const emailService = new EmailService();
    await emailService.sendAgencyInvitation({
      recipientEmail,
      recipientName: recipientEmail,
      inviterName,
      inviterEmail,
      agencyName,
      role,
      invitationToken,
      expiresAt,
    });
    return { sent: true, provider: 'resend' };
  } catch (error) {
    console.warn('[AgencyController] Failed to send agency invite email (continuing with link flow):', error?.message || error);
    return { sent: false, provider: 'resend', error: error?.message || String(error) };
  }
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

  const normalizedOwnerId = String(membership.agency?.ownerId || '').trim();
  const normalizedMemberUserId = String(membership.member?.userId || '').trim();
  const isAgencyOwner = normalizedOwnerId && normalizedMemberUserId && normalizedOwnerId === normalizedMemberUserId;

  if (isAgencyOwner) {
    const ownerPlanResult = await query('SELECT plan_type FROM users WHERE id = $1 LIMIT 1', [membership.member.userId]);
    const ownerPlanType = cleanText(ownerPlanResult.rows[0]?.plan_type, 'free');
    if (ownerPlanType !== 'agency') {
      throw apiError('Agency owner access requires an active Agency plan', 'AGENCY_PLAN_REQUIRED', 403);
    }
  }

  return membership;
}

async function getWorkspace(workspaceId, agencyId) {
  const result = await query('SELECT * FROM agency_workspaces WHERE id = $1 AND agency_id = $2 LIMIT 1', [workspaceId, agencyId]);
  if (result.rows.length === 0) throw apiError('Workspace not found', 'WORKSPACE_NOT_FOUND', 404);
  return result.rows[0];
}

function isAgencyHubEnabled() {
  const raw = String(process.env.AGENCY_HUB_ENABLED || '').trim().toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

export const AgencyController = {
  async ensureEnabled(req, res, next) {
    if (!isAgencyHubEnabled()) {
      return res.status(503).json({ error: 'Agency Hub is disabled', code: 'AGENCY_HUB_DISABLED' });
    }
    next();
  },

  async getInvitationByToken(req, res) {
    try {
      if (!isAgencyHubEnabled()) {
        return res.status(503).json({ success: false, error: 'Agency Hub is disabled', code: 'AGENCY_HUB_DISABLED' });
      }

      const token = cleanText(req.params.token, '');
      if (!token) throw apiError('Invitation token is required', 'INVITATION_TOKEN_REQUIRED', 400);

      const result = await query(
        `SELECT
           ai.id, ai.agency_id, ai.email, ai.role, ai.status, ai.token, ai.expires_at, ai.created_at,
           aa.name AS agency_name, aa.status AS agency_status,
           COALESCE(inviter.name, inviter.email) AS inviter_name,
           inviter.email AS inviter_email
         FROM agency_invitations ai
         JOIN agency_accounts aa ON aa.id = ai.agency_id
         LEFT JOIN users inviter ON inviter.id = ai.invited_by
         WHERE ai.token = $1
         LIMIT 1`,
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Invitation not found', code: 'INVITATION_NOT_FOUND' });
      }

      const invitation = result.rows[0];
      const isExpired = new Date(invitation.expires_at).getTime() <= Date.now();

      if (invitation.status !== 'pending' || isExpired) {
        if (invitation.status === 'pending' && isExpired) {
          await query(
            `UPDATE agency_invitations
             SET status = 'expired', updated_at = NOW()
             WHERE id = $1 AND status = 'pending'`,
            [invitation.id]
          );
        }
        return res.status(404).json({ success: false, error: 'Invitation not found or expired', code: 'INVITATION_NOT_AVAILABLE' });
      }

      if (invitation.agency_status === 'archived') {
        return res.status(400).json({ success: false, error: 'This agency is archived', code: 'AGENCY_ARCHIVED' });
      }

      return res.json({
        success: true,
        invitation: {
          id: invitation.id,
          agency_id: invitation.agency_id,
          agency_name: invitation.agency_name,
          inviter_name: invitation.inviter_name,
          inviter_email: invitation.inviter_email,
          email: invitation.email,
          role: invitation.role,
          created_at: invitation.created_at,
          expires_at: invitation.expires_at,
          invite_url: getAgencyInviteUrl(token),
        },
      });
    } catch (error) {
      return handleError(res, error, 'Failed to load agency invitation');
    }
  },

  async listPendingInvitations(req, res) {
    try {
      const userEmail = cleanEmail(req.user?.email);
      if (!userEmail) throw apiError('User email is missing', 'EMAIL_REQUIRED', 400);

      const result = await query(
        `SELECT
           ai.id, ai.token, ai.role, ai.created_at, ai.expires_at,
           aa.id AS agency_id, aa.name AS agency_name,
           COALESCE(inviter.name, inviter.email) AS inviter_name,
           inviter.email AS inviter_email
         FROM agency_invitations ai
         JOIN agency_accounts aa ON aa.id = ai.agency_id
         LEFT JOIN users inviter ON inviter.id = ai.invited_by
         WHERE ai.email = $1
           AND ai.status = 'pending'
           AND ai.expires_at > NOW()
         ORDER BY ai.created_at DESC`,
        [userEmail]
      );

      return res.json({
        invitations: result.rows.map((row) => ({
          id: row.id,
          agency_id: row.agency_id,
          agency_name: row.agency_name,
          inviter_name: row.inviter_name,
          inviter_email: row.inviter_email,
          role: row.role,
          created_at: row.created_at,
          expires_at: row.expires_at,
          invite_url: getAgencyInviteUrl(row.token),
        })),
      });
    } catch (error) {
      return handleError(res, error, 'Failed to list pending agency invitations');
    }
  },

  async acceptInvitationByToken(req, res) {
    const client = await pool.connect();
    try {
      const token = cleanText(req.params.token, '');
      if (!token) throw apiError('Invitation token is required', 'INVITATION_TOKEN_REQUIRED', 400);

      const userId = req.user?.id;
      const userEmail = cleanEmail(req.user?.email);
      if (!userId || !userEmail) throw apiError('User authentication is required', 'AUTH_REQUIRED', 401);

      await client.query('BEGIN');

      const invitationResult = await client.query(
        `SELECT ai.*, aa.name AS agency_name, aa.status AS agency_status
         FROM agency_invitations ai
         JOIN agency_accounts aa ON aa.id = ai.agency_id
         WHERE ai.token = $1
         FOR UPDATE`,
        [token]
      );

      if (invitationResult.rows.length === 0) throw apiError('Invitation not found', 'INVITATION_NOT_FOUND', 404);
      const invitation = invitationResult.rows[0];

      if (invitation.status !== 'pending') throw apiError('Invitation is already processed', 'INVITATION_ALREADY_PROCESSED', 400);
      if (new Date(invitation.expires_at).getTime() <= Date.now()) {
        await client.query(
          `UPDATE agency_invitations SET status = 'expired', updated_at = NOW() WHERE id = $1`,
          [invitation.id]
        );
        throw apiError('Invitation has expired', 'INVITATION_EXPIRED', 400);
      }
      if (cleanEmail(invitation.email) !== userEmail) {
        throw apiError('This invitation is for a different email address', 'INVITATION_EMAIL_MISMATCH', 403);
      }
      if (invitation.agency_status === 'archived') {
        throw apiError('This agency is archived', 'AGENCY_ARCHIVED', 400);
      }

      let memberId = null;
      const existingMember = await client.query(
        `SELECT id, role
         FROM agency_members
         WHERE agency_id = $1 AND email = $2
         ORDER BY created_at DESC
         LIMIT 1
         FOR UPDATE`,
        [invitation.agency_id, userEmail]
      );

      if (existingMember.rows.length > 0) {
        memberId = existingMember.rows[0].id;
        await client.query(
          `UPDATE agency_members
           SET user_id = $1,
               role = CASE WHEN role = 'owner' THEN role ELSE $2 END,
               status = 'active',
               joined_at = COALESCE(joined_at, NOW()),
               updated_at = NOW()
           WHERE id = $3`,
          [userId, invitation.role, memberId]
        );
      } else {
        const inserted = await client.query(
          `INSERT INTO agency_members
             (agency_id, user_id, email, role, status, invited_by, invited_at, joined_at, created_at, updated_at)
           VALUES
             ($1, $2, $3, $4, 'active', $5, NOW(), NOW(), NOW(), NOW())
           RETURNING id`,
          [invitation.agency_id, userId, userEmail, invitation.role, invitation.invited_by]
        );
        memberId = inserted.rows[0].id;
      }

      await client.query(
        `UPDATE agency_invitations
         SET status = 'accepted', updated_at = NOW()
         WHERE id = $1`,
        [invitation.id]
      );

      await client.query('COMMIT');
      await logAudit(invitation.agency_id, userId, 'member_invitation_accepted', 'agency_invitation', invitation.id, {
        memberId,
        email: userEmail,
      });

      return res.json({
        success: true,
        message: `Welcome to ${invitation.agency_name}`,
        agencyId: invitation.agency_id,
        memberId,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      return handleError(res, error, 'Failed to accept agency invitation');
    } finally {
      client.release();
    }
  },

  async declineInvitationByToken(req, res) {
    try {
      if (!isAgencyHubEnabled()) {
        return res.status(503).json({ success: false, error: 'Agency Hub is disabled', code: 'AGENCY_HUB_DISABLED' });
      }

      const token = cleanText(req.params.token, '');
      if (!token) throw apiError('Invitation token is required', 'INVITATION_TOKEN_REQUIRED', 400);

      const result = await query(
        `UPDATE agency_invitations
         SET status = 'declined', updated_at = NOW()
         WHERE token = $1
           AND status = 'pending'
           AND expires_at > NOW()
         RETURNING id, agency_id, email`,
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Invitation not found or already processed', code: 'INVITATION_NOT_AVAILABLE' });
      }

      const invitation = result.rows[0];
      await query(
        `UPDATE agency_members
         SET status = 'declined', updated_at = NOW()
         WHERE agency_id = $1 AND email = $2 AND status = 'pending'`,
        [invitation.agency_id, cleanEmail(invitation.email)]
      );

      await logAudit(invitation.agency_id, req.user?.id || null, 'member_invitation_declined', 'agency_invitation', invitation.id, {
        email: cleanEmail(invitation.email),
      });
      return res.json({ success: true, message: 'Invitation declined' });
    } catch (error) {
      return handleError(res, error, 'Failed to decline agency invitation');
    }
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
      const invitationRow = invitation.rows[0];
      const inviteUrl = getAgencyInviteUrl(invitationRow.token);

      const inviterResult = await query(
        `SELECT COALESCE(name, email) AS name, email FROM users WHERE id = $1 LIMIT 1`,
        [req.user.id]
      );
      const inviterName = inviterResult.rows[0]?.name || req.user?.name || req.user?.email || 'Agency Admin';
      const inviterEmail = inviterResult.rows[0]?.email || req.user?.email || null;

      const emailDelivery = await sendAgencyInviteEmail({
        recipientEmail: email,
        invitationToken: invitationRow.token,
        inviterName,
        inviterEmail,
        agencyName: agency.name,
        role,
        expiresAt: invitationRow.expires_at,
      });

      await logAudit(agency.id, req.user.id, isResend ? 'member_invite_resent' : 'member_invited', 'agency_member', memberId, { email, role });
      return res.json({
        isResend,
        memberId,
        emailDelivery,
        invitation: {
          ...invitationRow,
          invite_url: inviteUrl,
        },
      });
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

  async publishWorkspacePost(req, res) {
    try {
      const { agency, member } = await getAgencyContext(req.user.id);
      if (member.role === 'viewer') {
        throw apiError('Viewer role cannot publish from workspace', 'INSUFFICIENT_PERMISSIONS', 403);
      }

      const workspace = await getWorkspace(req.params.workspaceId, agency.id);
      if (workspace.status !== 'active') {
        throw apiError('Workspace must be active to publish', 'WORKSPACE_NOT_ACTIVE', 400);
      }

      const assignment = await query(
        `SELECT 1 FROM agency_workspace_members WHERE workspace_id = $1 AND agency_member_id = $2 LIMIT 1`,
        [workspace.id, member.id]
      );
      if (assignment.rows.length === 0 && !EDIT_ROLES.has(member.role)) {
        throw apiError('You do not have access to this workspace', 'WORKSPACE_ACCESS_DENIED', 403);
      }

      const content = cleanText(req.body.content);
      const postMode = cleanText(req.body.postMode, 'single') || 'single';
      const threadParts = Array.isArray(req.body.threadParts)
        ? req.body.threadParts.map((value) => cleanText(value)).filter(Boolean)
        : [];
      const media = normalizeMediaInputs(Array.isArray(req.body.media) ? req.body.media : req.body.mediaUrls);
      const selectedAccountIds = normalizeWorkspaceAccountIds(
        req.body.targetWorkspaceAccountIds || req.body.workspaceAccountIds || req.body.targets
      );

      const normalizedMode = String(postMode || 'single').toLowerCase() === 'thread' ? 'thread' : 'single';

      if (!content && normalizedMode !== 'thread') {
        throw apiError('content is required', 'PUBLISH_CONTENT_REQUIRED', 400);
      }
      if (normalizedMode === 'thread' && threadParts.length < 2 && !content) {
        throw apiError('threadParts (2+) or content is required for thread mode', 'PUBLISH_THREAD_PARTS_REQUIRED', 400);
      }
      if (selectedAccountIds.length === 0) {
        throw apiError('Select at least one attached account to publish', 'PUBLISH_TARGETS_REQUIRED', 400);
      }

      const accountResult = await query(
        `SELECT *
         FROM agency_workspace_accounts
         WHERE workspace_id = $1
           AND is_active = true
           AND id::text = ANY($2::text[])`,
        [workspace.id, selectedAccountIds]
      );

      if (accountResult.rows.length !== selectedAccountIds.length) {
        throw apiError('One or more selected accounts are invalid for this workspace', 'WORKSPACE_ACCOUNT_SELECTION_INVALID', 400);
      }

      const byId = new Map(accountResult.rows.map((row) => [String(row.id), row]));
      const orderedAccounts = selectedAccountIds
        .map((id) => byId.get(id))
        .filter(Boolean);

      const settled = await Promise.allSettled(
        orderedAccounts.map((account) =>
          publishToWorkspaceAccount({
            userId: req.user.id,
            account,
            content: content || threadParts[0] || '',
            postMode: normalizedMode,
            threadParts,
            media,
          })
        )
      );

      const results = settled.map((entry, index) => {
        const account = orderedAccounts[index];
        const base = {
          workspaceAccountId: String(account.id),
          platform: normalizeWorkspacePlatform(account.platform),
          accountDisplayName:
            cleanText(account.account_display_name, null) ||
            cleanText(account.account_username, null) ||
            cleanText(account.account_id, null) ||
            cleanText(account.source_id, 'account'),
        };

        if (entry.status === 'fulfilled') {
          return {
            ...base,
            status: 'posted',
            teamId: entry.value.teamId || null,
            target: entry.value.target || null,
            postId: entry.value.postId || null,
            postUrl: entry.value.postUrl || null,
            details: entry.value.payload || {},
          };
        }

        const reason = entry.reason || {};
        return {
          ...base,
          status: 'failed',
          code: reason.code || 'PUBLISH_FAILED',
          error: reason.message || 'Failed to publish',
          teamId: reason?.downstream?.teamId || null,
          details: reason?.downstream || null,
        };
      });

      const successCount = results.filter((result) => result.status === 'posted').length;
      const failedCount = results.length - successCount;

      await logAudit(agency.id, req.user.id, 'workspace_publish_fanout', 'agency_workspace', workspace.id, {
        workspaceId: workspace.id,
        requestedTargets: selectedAccountIds.length,
        successCount,
        failedCount,
        postMode: normalizedMode,
      });

      return res.status(200).json({
        workspaceId: workspace.id,
        summary: {
          requestedTargets: selectedAccountIds.length,
          successCount,
          failedCount,
          postMode: normalizedMode,
        },
        results,
      });
    } catch (error) {
      return handleError(res, error, 'Failed to publish from workspace');
    }
  },

  async getWorkspaceOperationsSnapshot(req, res) {
    try {
      const { agency, member } = await getAgencyContext(req.user.id);
      const workspace = await getWorkspace(req.params.workspaceId, agency.id);

      const assignment = await query(
        `SELECT 1 FROM agency_workspace_members WHERE workspace_id = $1 AND agency_member_id = $2 LIMIT 1`,
        [workspace.id, member.id]
      );
      if (assignment.rows.length === 0 && !EDIT_ROLES.has(member.role)) {
        throw apiError('You do not have access to this workspace', 'WORKSPACE_ACCESS_DENIED', 403);
      }

      const limit = Math.max(1, Math.min(100, Number(req.query.limit || 50) || 50));
      const queueLimit = Math.max(1, Math.min(100, Number(req.query.queueLimit || limit) || limit));

      const accountResult = await query(
        `SELECT *
         FROM agency_workspace_accounts
         WHERE workspace_id = $1
           AND is_active = true
         ORDER BY created_at DESC`,
        [workspace.id]
      );
      const workspaceAccounts = accountResult.rows || [];
      if (workspaceAccounts.length === 0) {
        return res.json({
          workspaceId: workspace.id,
          summary: {
            sourceCount: 0,
            sourceHealthyCount: 0,
            sourceFailedCount: 0,
            queueCount: 0,
            calendarCount: 0,
            lastRefreshedAt: new Date().toISOString(),
          },
          queue: [],
          calendar: [],
          sources: [],
        });
      }

      const groups = buildWorkspaceSnapshotGroups(workspaceAccounts);
      const snapshots = await Promise.all(
        groups.map(async (group) => {
          const path = resolveSnapshotPath(group.channel);
          if (!path) {
            return {
              channel: group.channel,
              teamId: group.teamId,
              status: 'failed',
              queue: [],
              calendar: [],
              error: `Unsupported snapshot channel "${group.channel}"`,
              code: 'SNAPSHOT_CHANNEL_UNSUPPORTED',
              platforms: group.platforms,
            };
          }

          const downstreamTool = group.channel === 'social' ? 'social' : group.channel;
          try {
            const payload = await invokeInternalPublishEndpoint({
              tool: downstreamTool,
              path,
              userId: req.user.id,
              teamId: group.teamId,
              body: {
                targetAccountIds: group.targetAccountIds,
                limit,
                queueLimit,
              },
            });

            const mappedQueue = (Array.isArray(payload?.queue) ? payload.queue : []).map((item) => ({
              ...item,
              platform: normalizeWorkspacePlatform(item?.platform || group.platforms?.[0] || group.channel),
              sourceChannel: group.channel,
              teamId: item?.teamId || group.teamId || null,
              workspaceId: workspace.id,
            }));
            const mappedCalendar = (Array.isArray(payload?.calendar) ? payload.calendar : []).map((item) => ({
              ...item,
              platform: normalizeWorkspacePlatform(item?.platform || group.platforms?.[0] || group.channel),
              sourceChannel: group.channel,
              teamId: item?.teamId || group.teamId || null,
              workspaceId: workspace.id,
            }));

            return {
              channel: group.channel,
              teamId: group.teamId,
              status: 'ok',
              queue: mappedQueue,
              calendar: mappedCalendar,
              queueCount: mappedQueue.length,
              calendarCount: mappedCalendar.length,
              platforms: group.platforms,
            };
          } catch (error) {
            return {
              channel: group.channel,
              teamId: group.teamId,
              status: 'failed',
              queue: [],
              calendar: [],
              error: error?.message || 'Failed to fetch source snapshot',
              code: error?.code || 'SNAPSHOT_SOURCE_FAILED',
              platforms: group.platforms,
            };
          }
        })
      );

      const queue = sortByMostRecentTimestamp(
        snapshots.flatMap((entry) => (entry.status === 'ok' ? entry.queue : []))
      );
      const calendar = sortByUpcomingTimestamp(
        snapshots.flatMap((entry) => (entry.status === 'ok' ? entry.calendar : []))
      );

      const sourceHealthyCount = snapshots.filter((entry) => entry.status === 'ok').length;
      const sourceFailedCount = snapshots.length - sourceHealthyCount;

      return res.json({
        workspaceId: workspace.id,
        summary: {
          sourceCount: snapshots.length,
          sourceHealthyCount,
          sourceFailedCount,
          queueCount: queue.length,
          calendarCount: calendar.length,
          lastRefreshedAt: new Date().toISOString(),
        },
        queue,
        calendar,
        sources: snapshots.map((entry) => ({
          channel: entry.channel,
          teamId: entry.teamId || null,
          status: entry.status,
          queueCount: Number(entry.queueCount || 0),
          calendarCount: Number(entry.calendarCount || 0),
          error: entry.error || null,
          code: entry.code || null,
          platforms: entry.platforms || [],
        })),
      });
    } catch (error) {
      return handleError(res, error, 'Failed to fetch workspace operations snapshot');
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
      const requestedTool = cleanText(req.body.tool, 'twitter')?.toLowerCase() || 'twitter';
      const selectedTool = Object.prototype.hasOwnProperty.call(TOOL_URLS, requestedTool) ? requestedTool : 'twitter';
      const requestedTarget = cleanText(req.body.target, 'dashboard')?.toLowerCase() || 'dashboard';
      const selectedTargetInfo = resolveTargetPath(selectedTool, requestedTarget);

      const launchUrls = Object.entries(TOOL_URLS).reduce((acc, [tool, baseUrl]) => {
        const targetInfo = resolveTargetPath(tool, requestedTarget);
        const launchUrl = buildToolLaunchUrl(baseUrl, targetInfo.path, {
          agency_token: token,
          workspace_id: workspace.id,
          tool,
          target: targetInfo.target,
        });
        if (launchUrl) acc[tool] = launchUrl;
        return acc;
      }, {});

      await logAudit(agency.id, req.user.id, 'workspace_launch_token_created', 'agency_workspace', workspace.id, {
        selectedTool,
        selectedTarget: selectedTargetInfo.target,
        requestedTarget,
      });
      return res.json({
        token,
        expiresIn: 30 * 60,
        selectedTool,
        selectedTarget: selectedTargetInfo.target,
        launchPath: selectedTargetInfo.path,
        launchUrl: launchUrls[selectedTool] || launchUrls.twitter || null,
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
