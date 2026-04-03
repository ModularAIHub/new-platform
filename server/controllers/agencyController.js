import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { pool, query } from '../config/database.js';
import EmailService from '../services/emailService.js';
import { ensureAgencySchemaReady } from '../utils/agencySchema.js';
import { createAgencyClientOnboardingController } from './agencyClientOnboardingController.js';
import { createAgencyWorkspaceContentController } from './agencyWorkspaceContentController.js';
import {
  buildAnalysisContentCorpus,
  buildPlatformAnalysisCard,
  buildWorkspaceIdeaBank,
  extractTopThemesFromContents,
} from './agencyAnalysisHelpers.js';
import {
  assertAgencyDraftApproverRole,
  assertAgencyDraftWriteRole,
  isAgencyDraftApproverRole,
  isEditableDraftStatus,
  normalizeDraftStatus,
  resolveDraftCreateStatus,
  resolveWorkspaceDraftStatusView,
  VALID_DRAFT_STATUSES,
} from '../utils/agencyDraftState.js';

const AGENCY_LIMITS = Object.freeze({
  workspaceLimit: 6,
  seatLimit: 6,
  workspaceAccountLimit: 8,
});

const AGENCY_WORKSPACE_MEMBER_LIMIT = 5;

const EDIT_ROLES = new Set(['owner', 'admin']);
const VALID_MEMBER_ROLES = new Set(['owner', 'admin', 'editor', 'viewer']);
const VALID_ASSIGNABLE_ROLES = new Set(['admin', 'editor', 'viewer']);
const VALID_WORKSPACE_STATUSES = new Set(['active', 'paused', 'archived']);
const AGENCY_BILLING_GRACE_DAYS = Math.max(0, Number.parseInt(process.env.AGENCY_BILLING_GRACE_DAYS || '3', 10));
const ANALYSIS_THEME_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'being', 'but', 'by', 'for', 'from', 'had',
  'has', 'have', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'more', 'not', 'of',
  'on', 'or', 'our', 'out', 'so', 'that', 'the', 'their', 'there', 'this', 'to', 'up', 'was',
  'we', 'what', 'when', 'why', 'with', 'you', 'your', 'will', 'about', 'after', 'before',
  'during', 'over', 'under', 'than', 'then', 'them', 'they', 'those', 'these', 'also',
  'post', 'posts', 'draft', 'drafts', 'thread', 'threads', 'linkedin', 'twitter', 'suitegenie',
  'agency', 'workspace', 'client', 'content', 'calendar', 'queue', 'approval', 'approved',
  'pending', 'scheduled', 'published', 'failed', 'social', 'instagram', 'youtube',
]);
const ANALYSIS_THEME_ALLOWLIST = new Set(['ai', 'ux', 'ui', 'api', 'b2b', 'b2c', 'seo', 'saas']);
const AUTO_CONTEXT_AUDIENCE_HINTS = [
  'founders',
  'marketers',
  'developers',
  'designers',
  'creators',
  'agencies',
  'agency teams',
  'recruiters',
  'operators',
  'sales teams',
  'b2b teams',
  'product teams',
  'small businesses',
  'startup teams',
  'ecommerce brands',
  'consultants',
  'coaches',
];

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
const AGENCY_APPROVAL_TOKEN_TTL_DAYS = Math.max(1, Number.parseInt(process.env.AGENCY_APPROVAL_TOKEN_TTL_DAYS || '90', 10));
const AGENCY_JWT_SECRET = process.env.JWT_SECRET || 'development-secret';
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

function getAgencyApprovalUrl(token) {
  const base = String(AGENCY_INVITE_URL_BASE || 'https://suitegenie.in').replace(/\/+$/, '');
  return `${base}/agency/approve/${encodeURIComponent(String(token || '').trim())}`;
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

const AGENCY_ALLOWED_ACCOUNT_SOURCE_TYPES = new Set([
  'social_connected_accounts',
  'team_accounts',
  'linkedin_team_accounts',
]);

const AGENCY_WORKSPACE_ACCOUNT_JOINS_SQL = `
  LEFT JOIN social_connected_accounts sca
    ON awa.source_type = 'social_connected_accounts'
   AND sca.id::text = awa.source_id
  LEFT JOIN team_accounts ta
    ON awa.source_type = 'team_accounts'
   AND ta.id::text = awa.source_id
  LEFT JOIN linkedin_team_accounts lta
    ON awa.source_type = 'linkedin_team_accounts'
   AND lta.id::text = awa.source_id
`;

const AGENCY_WORKSPACE_ACCOUNT_VISIBILITY_SQL = `
  (
    (awa.source_type = 'social_connected_accounts' AND sca.is_active = true AND sca.team_id IS NOT NULL)
    OR (awa.source_type = 'team_accounts' AND ta.active = true)
    OR (awa.source_type = 'linkedin_team_accounts' AND lta.active = true)
  )
`;

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

function normalizeThreadParts(value, maxParts = 25) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanText(item))
    .filter(Boolean)
    .slice(0, maxParts);
}

function splitTextByCharacterLimit(value, limit = 280, maxParts = 25) {
  const text = cleanText(value, '') || '';
  const normalizedLimit = Math.max(1, Number(limit) || 1);
  if (!text) return [];

  const parts = [];
  const paragraphs = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);

  const pushChunk = (chunk) => {
    const cleaned = cleanText(chunk, null);
    if (!cleaned || parts.length >= maxParts) return;
    parts.push(cleaned);
  };

  for (const paragraph of (paragraphs.length > 0 ? paragraphs : [text])) {
    let current = '';
    const words = paragraph.split(/\s+/).filter(Boolean);

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= normalizedLimit) {
        current = candidate;
        continue;
      }

      if (current) {
        pushChunk(current);
        current = '';
      }

      if (word.length <= normalizedLimit) {
        current = word;
        continue;
      }

      let remainder = word;
      while (remainder.length > normalizedLimit && parts.length < maxParts) {
        pushChunk(remainder.slice(0, normalizedLimit));
        remainder = remainder.slice(normalizedLimit);
      }
      current = remainder;
    }

    if (current) {
      pushChunk(current);
    }
  }

  return parts.slice(0, maxParts);
}

function normalizeWorkspaceGenerationMode(value, fallback = 'generic') {
  const normalized = cleanText(value, fallback)?.toLowerCase() || fallback;
  if (['generic', 'twitter', 'linkedin', 'threads', 'all'].includes(normalized)) {
    return normalized;
  }
  return fallback;
}

function normalizeWorkspaceGenerationModes(value, fallback = ['twitter']) {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [value];

  const normalized = [
    ...new Set(
      rawValues
        .map((item) => normalizeWorkspaceGenerationMode(item, ''))
        .filter((item) => ['twitter', 'linkedin', 'threads', 'all'].includes(item))
    ),
  ];

  if (normalized.includes('all')) {
    return ['twitter', 'linkedin', 'threads'];
  }

  return normalized.length > 0 ? normalized : fallback;
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

function isAgencyAllowedAccountSourceType(value) {
  const normalized = cleanText(value, '')?.toLowerCase() || '';
  return AGENCY_ALLOWED_ACCOUNT_SOURCE_TYPES.has(normalized);
}

async function listAgencyEligibleWorkspaceAccounts(workspaceId, { workspaceAccountIds = [] } = {}) {
  const selectedIds = normalizeWorkspaceAccountIds(workspaceAccountIds);
  const rows = await safeQuery(
    `SELECT
       awa.id,
       awa.workspace_id,
       awa.platform,
       awa.source_type,
       awa.source_id,
       awa.account_id,
       awa.account_username,
       awa.account_display_name,
       awa.profile_image_url,
       COALESCE(awa.metadata, '{}'::jsonb) ||
         CASE
           WHEN awa.source_type = 'social_connected_accounts' THEN jsonb_build_object('team_id', sca.team_id, 'scope', 'team')
           WHEN awa.source_type = 'team_accounts' THEN jsonb_build_object('team_id', ta.team_id, 'scope', 'team')
           WHEN awa.source_type = 'linkedin_team_accounts' THEN (
             jsonb_build_object('team_id', lta.team_id, 'scope', 'team') ||
             jsonb_strip_nulls(jsonb_build_object('account_type', lta.account_type, 'organization_id', lta.organization_id))
           )
           ELSE '{}'::jsonb
       END AS metadata,
       awa.attached_by,
       awa.is_active,
       COALESCE(sca.updated_at, ta.updated_at, lta.updated_at, awa.updated_at) AS source_updated_at,
       COALESCE(sca.token_expires_at, ta.token_expires_at, lta.token_expires_at) AS token_expires_at,
       awa.created_at,
       awa.updated_at
     FROM agency_workspace_accounts awa
     ${AGENCY_WORKSPACE_ACCOUNT_JOINS_SQL}
     WHERE awa.workspace_id = $1
       AND awa.is_active = true
       AND ($2::boolean = false OR awa.id::text = ANY($3::text[]))
       AND ${AGENCY_WORKSPACE_ACCOUNT_VISIBILITY_SQL}
     ORDER BY awa.created_at DESC`,
    [workspaceId, selectedIds.length > 0, selectedIds]
  );

  return rows || [];
}

async function countAgencyEligibleWorkspaceAccounts(workspaceId) {
  const rows = await safeQuery(
    `SELECT COUNT(*)::int AS count
     FROM agency_workspace_accounts awa
     ${AGENCY_WORKSPACE_ACCOUNT_JOINS_SQL}
     WHERE awa.workspace_id = $1
       AND awa.is_active = true
       AND ${AGENCY_WORKSPACE_ACCOUNT_VISIBILITY_SQL}`,
    [workspaceId]
  );

  return Number(rows[0]?.count || 0);
}

async function findAgencyAttachableAccount(userId, { sourceType, sourceId }) {
  const normalizedSourceType = cleanText(sourceType, '')?.toLowerCase() || '';
  const normalizedSourceId = cleanText(sourceId, null);
  if (!normalizedSourceId || !isAgencyAllowedAccountSourceType(normalizedSourceType)) {
    return null;
  }

  if (normalizedSourceType === 'social_connected_accounts') {
    const rows = await safeQuery(
      `SELECT
         sca.id::text AS source_id,
         sca.platform,
         sca.account_id,
         sca.account_username,
         sca.account_display_name,
         sca.profile_image_url,
         COALESCE(sca.metadata, '{}'::jsonb) || jsonb_build_object('team_id', sca.team_id, 'scope', 'team') AS metadata
       FROM social_connected_accounts sca
       LEFT JOIN team_members tm
         ON tm.team_id::text = sca.team_id::text
        AND tm.user_id::text = $1::text
        AND tm.status = 'active'
       WHERE sca.id::text = $2::text
         AND sca.is_active = true
         AND sca.team_id IS NOT NULL
         AND (
           sca.user_id::text = $1::text
           OR sca.connected_by::text = $1::text
           OR tm.user_id::text = $1::text
         )
       LIMIT 1`,
      [userId, normalizedSourceId]
    );
    return rows[0] || null;
  }

  if (normalizedSourceType === 'team_accounts') {
    const rows = await safeQuery(
      `SELECT
         ta.id::text AS source_id,
         'twitter' AS platform,
         ta.twitter_user_id AS account_id,
         ta.twitter_username AS account_username,
         ta.twitter_display_name AS account_display_name,
         ta.twitter_profile_image_url AS profile_image_url,
         jsonb_build_object('team_id', ta.team_id, 'scope', 'team') AS metadata
       FROM team_accounts ta
       JOIN team_members tm
         ON tm.team_id::text = ta.team_id::text
        AND tm.user_id::text = $1::text
        AND tm.status = 'active'
       WHERE ta.id::text = $2::text
         AND ta.active = true
       LIMIT 1`,
      [userId, normalizedSourceId]
    );
    return rows[0] || null;
  }

  if (normalizedSourceType === 'linkedin_team_accounts') {
    const rows = await safeQuery(
      `SELECT
         lta.id::text AS source_id,
         'linkedin' AS platform,
         lta.linkedin_user_id AS account_id,
         lta.linkedin_username AS account_username,
         lta.linkedin_display_name AS account_display_name,
         lta.linkedin_profile_image_url AS profile_image_url,
         jsonb_build_object('team_id', lta.team_id, 'scope', 'team') ||
           jsonb_strip_nulls(jsonb_build_object('account_type', lta.account_type, 'organization_id', lta.organization_id)) AS metadata
       FROM linkedin_team_accounts lta
       JOIN team_members tm
         ON tm.team_id::text = lta.team_id::text
        AND tm.user_id::text = $1::text
        AND tm.status = 'active'
       WHERE lta.id::text = $2::text
         AND lta.active = true
       LIMIT 1`,
      [userId, normalizedSourceId]
    );
    return rows[0] || null;
  }

  return null;
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

function resolveAgencyAccountSourceKey(account = {}) {
  const sourceType = cleanText(account.source_type ?? account.sourceType, '')?.toLowerCase() || '';
  const sourceId = cleanText(account.source_id ?? account.sourceId, null);
  if (!sourceType || !sourceId) return null;
  return `${sourceType}:${sourceId}`;
}

function resolveAgencyAccountIdentityKey(account = {}) {
  const platform = normalizeWorkspacePlatform(account?.platform);
  if (!platform) return null;

  const metadata = parseMetadataObject(account.metadata);
  const organizationId =
    cleanText(metadata.organization_id, null) ||
    cleanText(account.organization_id, null);
  const accountId =
    cleanText(account.account_id, null) ||
    cleanText(account.accountId, null) ||
    cleanText(metadata.twitter_user_id, null) ||
    cleanText(metadata.linkedin_user_id, null);
  const accountUsername =
    cleanText(account.account_username, null) ||
    cleanText(account.accountUsername, null);
  const accountDisplayName =
    cleanText(account.account_display_name, null) ||
    cleanText(account.accountDisplayName, null);

  let canonicalId = null;
  if (organizationId) {
    canonicalId = `org:${organizationId}`;
  } else if (accountId) {
    canonicalId = accountId;
  } else if (accountUsername) {
    canonicalId = `username:${accountUsername.toLowerCase()}`;
  } else if (accountDisplayName) {
    canonicalId = `display:${accountDisplayName.toLowerCase()}`;
  }

  if (!canonicalId) return null;
  return `${platform}:${canonicalId}`;
}

async function listAgencyAssignedWorkspaceAccounts(agencyId) {
  const rows = await safeQuery(
    `SELECT
       awa.*,
       aw.name AS workspace_name,
       aw.status AS workspace_status
     FROM agency_workspace_accounts awa
     JOIN agency_workspaces aw
       ON aw.id = awa.workspace_id
     ${AGENCY_WORKSPACE_ACCOUNT_JOINS_SQL}
     WHERE aw.agency_id = $1
       AND awa.is_active = true
       AND ${AGENCY_WORKSPACE_ACCOUNT_VISIBILITY_SQL}`,
    [agencyId]
  );

  return rows || [];
}

function findAgencyWorkspaceAccountAssignment(assignedAccounts = [], candidate = {}) {
  const candidateSourceKey = resolveAgencyAccountSourceKey(candidate);
  const candidateIdentityKey = resolveAgencyAccountIdentityKey(candidate);

  if (!candidateSourceKey && !candidateIdentityKey) {
    return null;
  }

  return assignedAccounts.find((assigned) => {
    const assignedSourceKey = resolveAgencyAccountSourceKey(assigned);
    const assignedIdentityKey = resolveAgencyAccountIdentityKey(assigned);

    if (candidateSourceKey && assignedSourceKey && candidateSourceKey === assignedSourceKey) {
      return true;
    }

    if (candidateIdentityKey && assignedIdentityKey && candidateIdentityKey === assignedIdentityKey) {
      return true;
    }

    return false;
  }) || null;
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

async function invokeInternalToolEndpoint({ tool, path, userId, teamId = null, method = 'POST', body = null }) {
  const rawBase = TOOL_API_BASE_URLS[tool];
  if (!rawBase) {
    throw apiError(`Unsupported downstream tool "${tool}"`, 'UNSUPPORTED_DOWNSTREAM_TOOL', 400);
  }

  const baseUrl = ensureApiBaseUrl(rawBase, null);
  if (!baseUrl) {
    throw apiError(`Downstream API URL is missing for "${tool}"`, 'DOWNSTREAM_API_URL_MISSING', 500);
  }

  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: buildWorkspacePublishHeaders({ userId, teamId }),
      ...(body === null ? {} : { body: JSON.stringify(body || {}) }),
    });
  } catch (error) {
    const friendlyMessages = {
      twitter: 'Twitter / X channel is temporarily unavailable. Our team has been notified.',
      linkedin: 'LinkedIn channel is temporarily unavailable. Our team has been notified.',
      social: 'Social channels are temporarily unavailable. Our team has been notified.',
    };
    const err = apiError(
      friendlyMessages[tool] || `${tool} channel is temporarily unavailable. Our team has been notified.`,
      'DOWNSTREAM_SERVICE_UNAVAILABLE',
      502
    );
    err.downstream = {
      tool,
      path,
      baseUrl,
      message: error?.message || 'fetch failed',
    };
    throw err;
  }

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

async function invokeInternalPublishEndpoint(args) {
  return invokeInternalToolEndpoint({ ...args, method: 'POST' });
}

async function uploadWorkspaceMediaToSocialStorage(file) {
  const baseUrl = ensureApiBaseUrl(TOOL_API_BASE_URLS.social, null);
  if (!baseUrl) {
    throw apiError('Downstream API URL is missing for "social"', 'DOWNSTREAM_API_URL_MISSING', 500);
  }

  const internalApiKey = cleanText(process.env.INTERNAL_API_KEY, null);
  if (!internalApiKey) {
    throw apiError('INTERNAL_API_KEY is not configured', 'INTERNAL_API_KEY_NOT_CONFIGURED', 500);
  }

  if (!file?.buffer || !file?.originalname) {
    throw apiError('File is required', 'MEDIA_FILE_REQUIRED', 400);
  }

  const form = new FormData();
  const blob = new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' });
  form.append('file', blob, file.originalname);

  let response;
  try {
    response = await fetch(`${baseUrl}/api/internal/media/upload`, {
      method: 'POST',
      headers: {
        'x-internal-api-key': internalApiKey,
      },
      body: form,
    });
  } catch (error) {
    throw apiError(
      `social service is unavailable at ${baseUrl}. Start that service and try again.`,
      'DOWNSTREAM_SERVICE_UNAVAILABLE',
      502
    );
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw apiError(
      cleanText(payload?.error, 'Failed to upload media') || 'Failed to upload media',
      cleanText(payload?.code, 'MEDIA_UPLOAD_FAILED') || 'MEDIA_UPLOAD_FAILED',
      response.status >= 400 && response.status < 500 ? response.status : 502
    );
  }

  return payload;
}

async function invokeWorkspaceGenerationMode({
  generationMode,
  prompt,
  style,
  workspace,
  settings,
  userId,
}) {
  const contextBlock = buildWorkspaceAiContextBlock({ workspace, settings, style });
  const effectivePrompt = [contextBlock, prompt].filter(Boolean).join('\n\n');
  const postingPreferences = normalizeWorkspacePostingPreferences(settings?.posting_preferences);
  const tonePreset = getWorkspaceTonePreset(settings, style);

  if (generationMode === 'twitter') {
    return invokeInternalToolEndpoint({
      tool: 'twitter',
      path: '/api/internal/twitter/generate',
      userId,
      body: {
        prompt: effectivePrompt,
        style,
        workspaceName: workspace.name,
        brandName: workspace.brand_name,
        industry: postingPreferences.industry,
        targetAudience: postingPreferences.target_audience,
        brandColors: postingPreferences.brand_colors,
        tonePreset,
      },
    });
  }

  if (generationMode === 'linkedin') {
    return invokeInternalToolEndpoint({
      tool: 'linkedin',
      path: '/api/internal/generate',
      userId,
      body: {
        prompt: effectivePrompt,
        style,
        workspaceName: workspace.name,
        brandName: workspace.brand_name,
        industry: postingPreferences.industry,
        targetAudience: postingPreferences.target_audience,
        brandColors: postingPreferences.brand_colors,
        tonePreset,
      },
    });
  }

  return invokeInternalToolEndpoint({
    tool: 'social',
    path: '/api/internal/ai/caption',
    userId,
    body: {
      prompt: effectivePrompt,
      style,
      workspaceName: workspace.name,
      brandName: workspace.brand_name,
      industry: postingPreferences.industry,
      targetAudience: postingPreferences.target_audience,
      brandColors: postingPreferences.brand_colors,
      tonePreset,
      platforms: generationMode === 'threads' ? ['threads', 'instagram', 'youtube'] : [],
    },
  });
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

    const payload = await invokeInternalPublishEndpoint({
      tool: 'social',
      path: '/api/internal/posts',
      userId,
      teamId,
      body: {
        platform,
        content,
        mediaUrls: media,
        postMode: normalizedBody.postMode,
        threadParts: normalizedBody.threadParts,
        postNow: true,
        targetAccountId,
      },
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

  if (platform === 'youtube') {
    const targetAccountId =
      cleanText(account?.source_id, null) ||
      cleanText(account?.account_id, null) ||
      null;
    const payload = await invokeInternalPublishEndpoint({
      tool: 'social',
      path: '/api/internal/posts',
      userId,
      teamId,
      body: {
        platform,
        content,
        mediaUrls: media,
        postNow: true,
        targetAccountId,
      },
    });
    return {
      platform,
      teamId,
      target: targetAccountId,
      payload,
      postId: payload?.videoId || payload?.publishId || null,
      postUrl: null,
    };
  }

  throw apiError(`Unsupported workspace platform "${platform}"`, 'WORKSPACE_PLATFORM_UNSUPPORTED', 400);
}

async function scheduleToWorkspaceAccount({
  userId,
  account,
  content,
  scheduledFor,
  postMode = 'single',
  threadParts = [],
  media = [],
  timezone = 'UTC',
}) {
  const platform = normalizeWorkspacePlatform(account?.platform);
  const teamId = resolveAccountTeamId(account);

  if (!platform) {
    throw apiError('Workspace account platform is missing', 'WORKSPACE_ACCOUNT_PLATFORM_MISSING', 400);
  }

  if (platform === 'twitter') {
    const targetAccountId = resolveTwitterTargetAccountId(account);
    const payload = await invokeInternalPublishEndpoint({
      tool: 'twitter',
      path: '/api/internal/twitter/schedule',
      userId,
      teamId,
      body: {
        content,
        postMode,
        threadParts,
        mediaUrls: media,
        scheduledFor,
        timezone,
        ...(targetAccountId ? { targetAccountId } : {}),
      },
    });
    return {
      platform,
      teamId,
      target: targetAccountId,
      payload,
      scheduledId: payload?.scheduledId || null,
      scheduledTime: payload?.scheduledTime || scheduledFor,
    };
  }

  if (platform === 'linkedin') {
    const linkedInTarget = resolveLinkedInTargetPayload(account);
    const payload = await invokeInternalPublishEndpoint({
      tool: 'linkedin',
      path: '/api/internal/schedule',
      userId,
      teamId: linkedInTarget.teamId,
      body: {
        content,
        mediaUrls: media,
        scheduledFor,
        timezone,
        ...linkedInTarget.bodyTarget,
      },
    });
    return {
      platform,
      teamId: linkedInTarget.teamId,
      target: linkedInTarget.targetLabel,
      payload,
      scheduledId: payload?.scheduledPostId || null,
      scheduledTime: payload?.scheduledTime || scheduledFor,
    };
  }

  if (platform === 'threads' || platform === 'instagram' || platform === 'youtube') {
    const targetAccountId =
      cleanText(account?.source_id, null) ||
      cleanText(account?.account_id, null) ||
      null;
    const payload = await invokeInternalPublishEndpoint({
      tool: 'social',
      path: '/api/internal/posts',
      userId,
      teamId,
      body: {
        platform,
        content,
        mediaUrls: media,
        postMode,
        threadParts,
        postNow: false,
        scheduledFor,
        targetAccountId,
      },
    });
    return {
      platform,
      teamId,
      target: targetAccountId,
      payload,
      scheduledId: payload?.scheduledPostId || null,
      scheduledTime: payload?.scheduledFor || scheduledFor,
    };
  }

  throw apiError(`Unsupported workspace platform "${platform}"`, 'WORKSPACE_PLATFORM_UNSUPPORTED', 400);
}

function resolveSnapshotChannel(platform) {
  const normalized = normalizeWorkspacePlatform(platform);
  if (normalized === 'twitter') return 'twitter';
  if (normalized === 'linkedin') return 'linkedin';
  if (normalized === 'threads' || normalized === 'instagram' || normalized === 'youtube' || normalized === 'social') return 'social';
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

async function getWorkspaceDraftCommentsByDraftIds(draftIds) {
  const normalizedIds = Array.isArray(draftIds) ? draftIds.map((id) => cleanText(id, null)).filter(Boolean) : [];
  if (normalizedIds.length === 0) return {};

  const rows = await safeQuery(
    `SELECT id, draft_id, workspace_id, author_type, author_name, author_user_id, content, created_at
     FROM agency_draft_comments
     WHERE draft_id = ANY($1::uuid[])
     ORDER BY created_at ASC`,
    [normalizedIds]
  );

  return rows.reduce((acc, row) => {
    if (!acc[row.draft_id]) acc[row.draft_id] = [];
    acc[row.draft_id].push(row);
    return acc;
  }, {});
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function normalizeTimestamp(value, fallback = null) {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function normalizeStringArray(value, maxItems = 20) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => cleanText(item)).filter(Boolean))].slice(0, maxItems);
}

function normalizeTonePresets(value, maxItems = 5) {
  if (!Array.isArray(value)) return [];

  const presets = [];
  const seen = new Set();
  for (const item of value) {
    const raw = item && typeof item === 'object' ? item : {};
    const name = cleanText(raw.name ?? raw.label ?? (typeof item === 'string' ? item : null), null);
    const guidance = cleanText(raw.guidance ?? raw.description ?? raw.notes, null);
    if (!name) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    presets.push({
      name,
      guidance,
    });

    if (presets.length >= maxItems) break;
  }

  return presets;
}

function normalizeWorkspacePostingPreferences(value) {
  const raw = value && typeof value === 'object' ? value : {};
  return {
    brand_colors: normalizeStringArray(raw.brand_colors || raw.brandColors || [], 8),
    industry: cleanText(raw.industry, null),
    target_audience: cleanText(raw.target_audience || raw.targetAudience, null),
    tone_presets: normalizeTonePresets(raw.tone_presets || raw.tonePresets || [], 5),
    portal_title: cleanText(raw.portal_title || raw.portalTitle, null),
    portal_message: cleanText(raw.portal_message || raw.portalMessage, null),
  };
}

function getWorkspaceTonePreset(settings, style) {
  const normalizedStyle = cleanText(style, '')?.toLowerCase() || '';
  if (!normalizedStyle) return null;

  const postingPreferences = normalizeWorkspacePostingPreferences(settings?.posting_preferences);
  return postingPreferences.tone_presets.find((preset) => (
    cleanText(preset?.name, '')?.toLowerCase() === normalizedStyle
  )) || null;
}

function buildWorkspaceAiContextBlock({ workspace, settings, style = null }) {
  const postingPreferences = normalizeWorkspacePostingPreferences(settings?.posting_preferences);
  const clientLabel = cleanText(workspace?.brand_name, null) || cleanText(workspace?.name, 'this client');
  const lines = [`Client brand: ${clientLabel}.`];

  if (postingPreferences.industry) {
    lines.push(`Industry: ${postingPreferences.industry}.`);
  }
  if (postingPreferences.target_audience) {
    lines.push(`Audience: ${postingPreferences.target_audience}.`);
  }
  if (postingPreferences.brand_colors.length > 0) {
    lines.push(`Brand colors or visual cues: ${postingPreferences.brand_colors.join(', ')}.`);
  }

  const profileNotes = cleanText(settings?.profile_notes, null);
  if (profileNotes) {
    lines.push(`Brand context: ${profileNotes}.`);
  }

  const tonePreset = getWorkspaceTonePreset(settings, style);
  if (tonePreset?.guidance) {
    lines.push(`Tone preset "${tonePreset.name}": ${tonePreset.guidance}.`);
  }

  return lines.length > 0 ? `Client context:\n${lines.map((line) => `- ${line}`).join('\n')}` : null;
}

async function safeSchemaQuery(text, params = []) {
  try {
    const result = await query(text, params);
    return result.rows || [];
  } catch (error) {
    if (isRelationMissing(error) || error?.code === '42703') return [];
    throw error;
  }
}

function dedupeCaseInsensitiveStrings(items = [], maxItems = 10) {
  const values = [];
  const seen = new Set();

  for (const item of Array.isArray(items) ? items : []) {
    const normalized = cleanText(item, null);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    values.push(normalized);
    if (values.length >= maxItems) break;
  }

  return values;
}

function titleCasePhrase(value = '') {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => (ANALYSIS_THEME_ALLOWLIST.has(part.toLowerCase()) ? part.toUpperCase() : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
    .join(' ');
}

function normalizeAudienceSnippet(value = '') {
  const normalized = cleanText(
    String(value || '')
      .replace(/^[\s:,-]+/, '')
      .replace(/[|.;]+.*$/, '')
      .trim(),
    null
  );

  if (!normalized) return null;

  const compact = normalized
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);

  return compact.length >= 4 ? compact : null;
}

function sanitizeErrorForClient(message) {
  if (!message) return message;
  return String(message)
    .replace(/https?:\/\/localhost:[0-9]+/gi, '[internal service]')
    .replace(/https?:\/\/[a-z0-9-]+\.suitegenie\.in/gi, '[internal service]')
    .replace(/Start that service and try again\./gi, 'Our team has been notified.')
    .trim();
}

function extractAudienceFromSignals(signalTexts = [], industry = null) {
  const patternCandidates = [
    /\b(?:for|help(?:ing)?|serving|supporting|teaching)\s+([a-z0-9/&,+\-\s]{4,80})/i,
    /\b(?:audience|community|customers?|clients?)\s*[:\-]\s*([a-z0-9/&,+\-\s]{4,80})/i,
  ];

  for (const rawText of Array.isArray(signalTexts) ? signalTexts : []) {
    const text = String(rawText || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    for (const pattern of patternCandidates) {
      const match = text.match(pattern);
      const candidate = normalizeAudienceSnippet(match?.[1] || '');
      if (!candidate) continue;
      return candidate;
    }

    const lower = text.toLowerCase();
    const explicitHint = AUTO_CONTEXT_AUDIENCE_HINTS.find((hint) => lower.includes(hint));
    if (explicitHint) return explicitHint;
  }

  if (industry) {
    return `Prospects, peers, and customers interested in ${industry}`;
  }

  return null;
}

function extractCompetitorCandidatesFromCorpus(contents = [], { workspace, workspaceAccounts = [] } = {}) {
  const ownTokens = new Set();
  const addOwnToken = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return;
    ownTokens.add(normalized.replace(/^@/, ''));
    ownTokens.add(normalized.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, ''));
  };

  addOwnToken(workspace?.name);
  addOwnToken(workspace?.brand_name);
  for (const account of Array.isArray(workspaceAccounts) ? workspaceAccounts : []) {
    addOwnToken(account?.account_username);
    addOwnToken(account?.account_display_name);
    addOwnToken(account?.account_id);
    const metadata = parseMetadataObject(account?.metadata);
    addOwnToken(metadata?.organization_name);
  }

  const counts = new Map();
  const addCandidate = (rawValue, score = 1) => {
    const value = cleanText(rawValue, null);
    if (!value) return;
    const normalized = value.toLowerCase().replace(/^@/, '');
    if (!normalized || ownTokens.has(normalized)) return;
    if (normalized === 'twitter' || normalized === 'linkedin' || normalized === 'instagram') return;
    counts.set(value, (counts.get(value) || 0) + score);
  };

  for (const rawContent of Array.isArray(contents) ? contents : []) {
    const content = String(rawContent || '');
    if (!content) continue;

    for (const match of content.matchAll(/(^|[\s(])@([a-z0-9_]{2,30})\b/gi)) {
      addCandidate(`@${String(match[2] || '').toLowerCase()}`, 3);
    }

    for (const match of content.matchAll(/(?:twitter|x)\.com\/([a-z0-9_]{2,30})/gi)) {
      addCandidate(`@${String(match[1] || '').toLowerCase()}`, 2);
    }

    for (const match of content.matchAll(/linkedin\.com\/(?:company|in)\/([a-z0-9-]{2,80})/gi)) {
      addCandidate(`linkedin.com/${String(match[1] || '').toLowerCase()}`, 2);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([value]) => value);
}

async function collectWorkspaceAccountSignals(workspaceAccounts = []) {
  const accounts = Array.isArray(workspaceAccounts) ? workspaceAccounts : [];
  const twitterSourceIds = new Set();
  const linkedinSourceIds = new Set();

  for (const account of accounts) {
    const metadata = parseMetadataObject(account?.metadata);
    const metadataSourceTable = cleanText(metadata?.source_table, '')?.toLowerCase() || '';
    const metadataSourceId = cleanText(metadata?.source_id, null) || cleanText(metadata?.legacy_row_id, null);
    const sourceType = cleanText(account?.source_type, '')?.toLowerCase() || '';

    if (sourceType === 'team_accounts') {
      const sourceId = cleanText(account?.source_id, null);
      if (sourceId) twitterSourceIds.add(sourceId);
    } else if (sourceType === 'linkedin_team_accounts') {
      const sourceId = cleanText(account?.source_id, null);
      if (sourceId) linkedinSourceIds.add(sourceId);
    } else if (metadataSourceId && metadataSourceTable === 'team_accounts') {
      twitterSourceIds.add(metadataSourceId);
    } else if (metadataSourceId && metadataSourceTable === 'linkedin_team_accounts') {
      linkedinSourceIds.add(metadataSourceId);
    }
  }

  const [twitterRows, linkedinRows] = await Promise.all([
    twitterSourceIds.size > 0
      ? safeSchemaQuery(
          `SELECT
             id::text AS id,
             twitter_username,
             twitter_display_name,
             bio,
             website_url,
             followers_count
           FROM team_accounts
           WHERE id::text = ANY($1::text[])`,
          [[...twitterSourceIds]]
        )
      : Promise.resolve([]),
    linkedinSourceIds.size > 0
      ? safeSchemaQuery(
          `SELECT
             id::text AS id,
             linkedin_username,
             linkedin_display_name,
             headline,
             connections_count,
             account_type,
             organization_name
           FROM linkedin_team_accounts
           WHERE id::text = ANY($1::text[])`,
          [[...linkedinSourceIds]]
        )
      : Promise.resolve([]),
  ]);

  const twitterById = new Map(twitterRows.map((row) => [String(row.id), row]));
  const linkedinById = new Map(linkedinRows.map((row) => [String(row.id), row]));

  return accounts.map((account) => {
    const metadata = parseMetadataObject(account?.metadata);
    const sourceType = cleanText(account?.source_type, '')?.toLowerCase() || '';
    const metadataSourceTable = cleanText(metadata?.source_table, '')?.toLowerCase() || '';
    const metadataSourceId = cleanText(metadata?.source_id, null) || cleanText(metadata?.legacy_row_id, null);

    const twitterRow =
      (sourceType === 'team_accounts' && twitterById.get(String(account?.source_id || ''))) ||
      (metadataSourceTable === 'team_accounts' && metadataSourceId ? twitterById.get(metadataSourceId) : null) ||
      null;
    const linkedinRow =
      (sourceType === 'linkedin_team_accounts' && linkedinById.get(String(account?.source_id || ''))) ||
      (metadataSourceTable === 'linkedin_team_accounts' && metadataSourceId ? linkedinById.get(metadataSourceId) : null) ||
      null;

    return {
      platform: normalizeWorkspacePlatform(account?.platform),
      displayName:
        cleanText(account?.account_display_name, null) ||
        cleanText(linkedinRow?.organization_name, null) ||
        cleanText(twitterRow?.twitter_display_name, null),
      username:
        cleanText(account?.account_username, null) ||
        cleanText(linkedinRow?.linkedin_username, null) ||
        cleanText(twitterRow?.twitter_username, null),
      bio: cleanText(twitterRow?.bio, null),
      websiteUrl: cleanText(twitterRow?.website_url, null),
      headline:
        cleanText(linkedinRow?.headline, null) ||
        cleanText(metadata?.profile_headline, null) ||
        cleanText(metadata?.headline, null),
      organizationName:
        cleanText(linkedinRow?.organization_name, null) ||
        cleanText(metadata?.organization_name, null),
      accountType:
        cleanText(linkedinRow?.account_type, null) ||
        cleanText(metadata?.account_type, null),
      followersCount:
        Number(linkedinRow?.connections_count || twitterRow?.followers_count || metadata?.followers_count || 0) || 0,
    };
  });
}

function resolveWorkspaceAnalysisTargetAccountId(account = {}) {
  const metadata = parseMetadataObject(account?.metadata);
  const sourceType = cleanText(account?.source_type, '')?.toLowerCase() || '';
  const metadataSourceTable = cleanText(metadata?.source_table, '')?.toLowerCase() || '';
  const metadataSourceId = cleanText(metadata?.source_id, null) || cleanText(metadata?.legacy_row_id, null);

  if (sourceType === 'team_accounts' || sourceType === 'linkedin_team_accounts') {
    return cleanText(account?.source_id, null);
  }

  if (sourceType === 'social_connected_accounts') {
    if (metadataSourceTable === 'team_accounts' || metadataSourceTable === 'linkedin_team_accounts') {
      return metadataSourceId;
    }
    return cleanText(account?.source_id, null) || cleanText(account?.account_id, null);
  }

  return cleanText(account?.source_id, null) || metadataSourceId || cleanText(account?.account_id, null);
}

async function fetchWorkspaceRemoteAnalysisContexts({ userId, workspaceAccounts = [] } = {}) {
  const contexts = [];
  const seen = new Set();

  for (const account of Array.isArray(workspaceAccounts) ? workspaceAccounts : []) {
    const platform = normalizeWorkspacePlatform(account?.platform);
    if (!['twitter', 'linkedin'].includes(platform)) continue;

    const targetAccountId = resolveWorkspaceAnalysisTargetAccountId(account);
    const teamId = resolveAccountTeamId(account);
    const dedupeKey = `${platform}:${targetAccountId || resolveAgencyAccountSourceKey(account) || resolveAgencyAccountIdentityKey(account) || account?.id || ''}`;
    if (!dedupeKey || seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    try {
      const payload = await invokeInternalToolEndpoint({
        tool: platform,
        path: platform === 'twitter'
          ? '/api/internal/twitter/analysis-context'
          : '/api/internal/analysis-context',
        userId,
        teamId,
        body: targetAccountId ? { targetAccountId } : {},
      });

      contexts.push({
        platform,
        account,
        targetAccountId,
        payload,
      });
    } catch (error) {
      contexts.push({
        platform,
        account,
        targetAccountId,
        error: error?.message || String(error),
      });
    }
  }

  return contexts;
}

async function buildWorkspaceDerivedContext({
  workspace,
  userId,
  settings,
  workspaceAccounts = [],
  operationsSnapshot = null,
} = {}) {
  const accountSignals = await collectWorkspaceAccountSignals(workspaceAccounts);
  const remoteAnalysisContexts = userId
    ? await fetchWorkspaceRemoteAnalysisContexts({ userId, workspaceAccounts })
    : [];
  const corpusItems = [
    ...(Array.isArray(operationsSnapshot?.queue) ? operationsSnapshot.queue : []),
    ...(Array.isArray(operationsSnapshot?.calendar) ? operationsSnapshot.calendar : []),
  ];
  const contentCorpus = buildAnalysisContentCorpus(corpusItems);
  const contentThemes = extractTopThemesFromContents(contentCorpus, {
    workspace,
    settings,
    limit: 8,
    normalizeWorkspacePostingPreferences,
  });

  const signalTexts = accountSignals.flatMap((signal) => ([
    signal?.bio,
    signal?.headline,
    signal?.organizationName,
    signal?.websiteUrl,
  ].filter(Boolean)));
  const remoteAnalysisTopics = remoteAnalysisContexts.flatMap((entry) => {
    const payload = entry?.payload && typeof entry.payload === 'object' ? entry.payload : {};
    const analysis = payload?.analysis && typeof payload.analysis === 'object' ? payload.analysis : {};
    const discoveries = payload?.discoveries && typeof payload.discoveries === 'object' ? payload.discoveries : {};
    return [
      ...(Array.isArray(analysis?.top_topics) ? analysis.top_topics : []),
      ...(Array.isArray(discoveries?.topTopics) ? discoveries.topTopics : []),
      ...(Array.isArray(discoveries?.themes) ? discoveries.themes : []),
    ];
  });
  const profileThemes = extractTopThemesFromContents(signalTexts, {
    workspace,
    settings,
    limit: 6,
    normalizeWorkspacePostingPreferences,
  });
  const topThemes = dedupeCaseInsensitiveStrings([...remoteAnalysisTopics, ...contentThemes, ...profileThemes], 8);
  const remoteNiche = dedupeCaseInsensitiveStrings(
    remoteAnalysisContexts.map((entry) => entry?.payload?.analysis?.niche).filter(Boolean),
    2
  )[0] || null;
  const remoteAudience = dedupeCaseInsensitiveStrings(
    remoteAnalysisContexts.map((entry) => entry?.payload?.analysis?.audience).filter(Boolean),
    2
  )[0] || null;
  const industry = remoteNiche || (
    topThemes.length > 0
      ? topThemes.slice(0, Math.min(3, topThemes.length)).map((item) => titleCasePhrase(item)).join(' / ')
      : null
  );
  const audience = remoteAudience || extractAudienceFromSignals(signalTexts, industry);
  const competitorTargets = dedupeCaseInsensitiveStrings([
    ...remoteAnalysisContexts.flatMap((entry) => {
      const payload = entry?.payload && typeof entry.payload === 'object' ? entry.payload : {};
      const discoveries = payload?.discoveries && typeof payload.discoveries === 'object' ? payload.discoveries : {};
      const references = Array.isArray(discoveries?.competitorReferences) ? discoveries.competitorReferences : [];
      return [
        ...(Array.isArray(discoveries?.competitorCandidates) ? discoveries.competitorCandidates : []),
        ...references.map((item) => item?.handle || item?.label || null).filter(Boolean),
      ];
    }),
    ...extractCompetitorCandidatesFromCorpus(contentCorpus, {
      workspace,
      workspaceAccounts,
    }),
  ], 5);

  const remoteStrengthSignals = remoteAnalysisContexts.flatMap((entry) => {
    const discoveries = entry?.payload?.discoveries && typeof entry.payload.discoveries === 'object'
      ? entry.payload.discoveries
      : {};
    return [
      ...(Array.isArray(discoveries?.strengths) ? discoveries.strengths : []),
      ...(Array.isArray(discoveries?.opportunities) ? discoveries.opportunities : []),
      ...(Array.isArray(discoveries?.nextAngles) ? discoveries.nextAngles : []),
    ];
  });

  const autoSummaryNotes = dedupeCaseInsensitiveStrings([
    ...remoteStrengthSignals,
    ...remoteAnalysisContexts.map((entry) => entry?.payload?.analysis?.confidence_reason).filter(Boolean),
  ], 4);

  const localCompetitorCandidates = extractCompetitorCandidatesFromCorpus(contentCorpus, {
    workspace,
    workspaceAccounts,
  });

  const noteFragments = [];
  const bioSignals = dedupeCaseInsensitiveStrings(
    accountSignals
      .map((signal) => signal?.bio)
      .filter(Boolean)
      .map((bio) => String(bio).replace(/\s+/g, ' ').slice(0, 180)),
    2
  );
  const headlineSignals = dedupeCaseInsensitiveStrings(
    accountSignals
      .map((signal) => signal?.headline || signal?.organizationName)
      .filter(Boolean)
      .map((value) => String(value).replace(/\s+/g, ' ').slice(0, 140)),
    2
  );

  if (headlineSignals.length > 0) {
    noteFragments.push(`Connected account signals: ${headlineSignals.join(' | ')}`);
  }
  if (bioSignals.length > 0) {
    noteFragments.push(`Profile context: ${bioSignals.join(' | ')}`);
  }
  if (topThemes.length > 0) {
    noteFragments.push(`Recurring themes already visible in this workspace: ${topThemes.slice(0, 5).join(', ')}`);
  }
  if (autoSummaryNotes.length > 0) {
    noteFragments.push(`Platform analysis discoveries: ${autoSummaryNotes.join(' | ')}`);
  }
  if (localCompetitorCandidates.length > 0 && competitorTargets.length > 0) {
    noteFragments.push(`Competitor/reference candidates surfaced from recent content: ${localCompetitorCandidates.slice(0, 3).join(', ')}`);
  }

  const profileNotes = noteFragments.length > 0 ? noteFragments.join('. ') : null;

  return {
    hasAny: Boolean(industry || audience || profileNotes || competitorTargets.length > 0 || topThemes.length > 0),
    industry,
    target_audience: audience,
    brand_colors: [],
    tone_presets: [],
    competitor_targets: competitorTargets,
    profile_notes: profileNotes,
    top_themes: topThemes,
    account_signals: accountSignals,
    remote_analysis_contexts: remoteAnalysisContexts,
  };
}

async function buildWorkspaceEffectiveSettings({
  workspace,
  userId,
  persistedSettings = null,
  workspaceAccounts = null,
  operationsSnapshot = null,
} = {}) {
  const baseSettings = persistedSettings || await getWorkspaceSettings(workspace.id);
  const resolvedWorkspaceAccounts = Array.isArray(workspaceAccounts)
    ? workspaceAccounts
    : await listAgencyEligibleWorkspaceAccounts(workspace.id);
  const resolvedOperationsSnapshot = operationsSnapshot || await buildWorkspaceOperationsSnapshotData({
    workspace,
    userId,
    limit: 50,
    queueLimit: 60,
  });

  const postingPreferences = normalizeWorkspacePostingPreferences(baseSettings?.posting_preferences);
  const hasMeaningfulContext = Boolean(
    cleanText(baseSettings?.profile_notes, null) ||
    normalizeStringArray(baseSettings?.competitor_targets, 25).length > 0 ||
    postingPreferences.industry ||
    postingPreferences.target_audience ||
    postingPreferences.brand_colors.length > 0 ||
    postingPreferences.tone_presets.length > 0
  );

  const derivedContext = await buildWorkspaceDerivedContext({
    workspace,
    userId,
    settings: baseSettings,
    workspaceAccounts: resolvedWorkspaceAccounts,
    operationsSnapshot: resolvedOperationsSnapshot,
  });

  const shouldApplyDerivedDefaults = !hasMeaningfulContext && derivedContext.hasAny;
  const effectivePostingPreferences = normalizeWorkspacePostingPreferences({
    ...postingPreferences,
    brand_colors: postingPreferences.brand_colors.length > 0
      ? postingPreferences.brand_colors
      : shouldApplyDerivedDefaults
        ? derivedContext.brand_colors
        : postingPreferences.brand_colors,
    industry: postingPreferences.industry || (shouldApplyDerivedDefaults ? derivedContext.industry : null),
    target_audience: postingPreferences.target_audience || (shouldApplyDerivedDefaults ? derivedContext.target_audience : null),
    tone_presets: postingPreferences.tone_presets.length > 0
      ? postingPreferences.tone_presets
      : shouldApplyDerivedDefaults
        ? derivedContext.tone_presets
        : postingPreferences.tone_presets,
  });

  return {
    ...baseSettings,
    profile_notes: cleanText(baseSettings?.profile_notes, null) || (shouldApplyDerivedDefaults ? derivedContext.profile_notes : null),
    competitor_targets: normalizeStringArray(baseSettings?.competitor_targets, 25).length > 0
      ? normalizeStringArray(baseSettings.competitor_targets, 25)
      : shouldApplyDerivedDefaults
        ? derivedContext.competitor_targets
        : [],
    posting_preferences: effectivePostingPreferences,
    detected_context: {
      status: derivedContext.hasAny
        ? shouldApplyDerivedDefaults
          ? 'applied'
          : 'available'
        : 'unavailable',
      fields: {
        industry: derivedContext.industry,
        target_audience: derivedContext.target_audience,
        profile_notes: derivedContext.profile_notes,
        competitor_targets: derivedContext.competitor_targets,
        top_themes: derivedContext.top_themes,
        remote_analysis_contexts: derivedContext.remote_analysis_contexts,
      },
    },
  };
}

function computeBillingState(row = {}) {
  if (!row || !row.id) {
    return {
      status: 'legacy',
      ownerAccessBlocked: false,
      graceUntil: null,
      currentPeriodEnd: null,
      cancelAtCycleEnd: false,
      lastPaymentAt: null,
      lastPaymentStatus: null,
      subscriptionId: null,
    };
  }

  const normalizedStatus = cleanText(row.status, 'created')?.toLowerCase() || 'created';
  const currentPeriodEnd = row.current_period_end ? new Date(row.current_period_end) : null;
  const graceUntil = row.grace_until ? new Date(row.grace_until) : null;
  const now = Date.now();

  let ownerAccessBlocked = false;
  if (['cancelled', 'expired', 'halted', 'failed', 'completed'].includes(normalizedStatus)) {
    const effectiveEnd = graceUntil && !Number.isNaN(graceUntil.getTime())
      ? graceUntil.getTime()
      : currentPeriodEnd && !Number.isNaN(currentPeriodEnd.getTime())
        ? currentPeriodEnd.getTime()
        : 0;
    ownerAccessBlocked = effectiveEnd > 0 ? now > effectiveEnd : true;
  }

  return {
    status: normalizedStatus,
    ownerAccessBlocked,
    graceUntil: graceUntil && !Number.isNaN(graceUntil.getTime()) ? graceUntil.toISOString() : null,
    currentPeriodEnd: currentPeriodEnd && !Number.isNaN(currentPeriodEnd.getTime()) ? currentPeriodEnd.toISOString() : null,
    cancelAtCycleEnd: Boolean(row.cancel_at_cycle_end),
    lastPaymentAt: normalizeTimestamp(row.last_payment_at, null),
    lastPaymentStatus: cleanText(row.last_payment_status, null),
    subscriptionId: cleanText(row.razorpay_subscription_id, null),
  };
}

async function getAgencySubscription(ownerUserId) {
  const result = await query(
    `SELECT *
     FROM agency_subscriptions
     WHERE owner_user_id = $1
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 1`,
    [ownerUserId]
  );
  return result.rows[0] || null;
}

async function getWorkspaceDrafts(workspaceId, { statusView = null } = {}) {
  const statuses = resolveWorkspaceDraftStatusView(statusView);
  const params = [workspaceId];
  let whereClause = `workspace_id = $1 AND status <> 'archived'`;

  if (Array.isArray(statuses) && statuses.length > 0) {
    params.push(statuses);
    whereClause += ` AND status = ANY($${params.length}::text[])`;
  }

  const result = await query(
    `SELECT *
     FROM agency_workspace_drafts
     WHERE ${whereClause}
     ORDER BY COALESCE(scheduled_for, updated_at, created_at) DESC, created_at DESC`,
    params
  );
  const drafts = result.rows || [];
  const commentsByDraftId = await getWorkspaceDraftCommentsByDraftIds(drafts.map((draft) => draft.id));
  return drafts.map((draft) => ({
    ...draft,
    comments: commentsByDraftId[draft.id] || [],
  }));
}

async function getWorkspaceSettings(workspaceId) {
  const result = await query(
    `SELECT *
     FROM agency_workspace_settings
     WHERE workspace_id = $1
     LIMIT 1`,
    [workspaceId]
  );

  if (result.rows.length === 0) {
    return {
      workspace_id: workspaceId,
      profile_notes: null,
      competitor_targets: [],
      automation_enabled: false,
      require_admin_approval: true,
      auto_generate_twitter: true,
      auto_generate_linkedin: true,
      auto_generate_social: false,
      engagement_auto_reply: false,
      posting_preferences: normalizeWorkspacePostingPreferences({}),
      created_at: null,
      updated_at: null,
    };
  }

  return {
    ...result.rows[0],
    posting_preferences: normalizeWorkspacePostingPreferences(result.rows[0].posting_preferences),
  };
}

async function assertWorkspaceAccess({ workspaceId, agencyId, memberRole, memberId }) {
  const workspace = await getWorkspace(workspaceId, agencyId);

  if (EDIT_ROLES.has(memberRole)) {
    return workspace;
  }

  const assignment = await query(
    `SELECT 1 FROM agency_workspace_members WHERE workspace_id = $1 AND agency_member_id = $2 LIMIT 1`,
    [workspace.id, memberId]
  );
  if (assignment.rows.length === 0) {
    throw apiError('You do not have access to this workspace', 'WORKSPACE_ACCESS_DENIED', 403);
  }

  return workspace;
}

function resolveEffectiveWorkspaceRole({ agencyRole, workspaceRole }) {
  const normalizedWorkspaceRole = cleanText(workspaceRole, null);
  if (normalizedWorkspaceRole && VALID_MEMBER_ROLES.has(normalizedWorkspaceRole)) {
    return normalizedWorkspaceRole;
  }

  const normalizedAgencyRole = cleanText(agencyRole, null);
  if (normalizedAgencyRole && EDIT_ROLES.has(normalizedAgencyRole)) {
    return normalizedAgencyRole;
  }

  return null;
}

async function getWorkspaceAccessContext(userId, workspaceId) {
  const { agency, member, billing } = await getAgencyContext(userId);
  const workspace = await getWorkspace(workspaceId, agency.id);
  const assignment = await query(
    `SELECT role
     FROM agency_workspace_members
     WHERE workspace_id = $1 AND agency_member_id = $2
     LIMIT 1`,
    [workspace.id, member.id]
  );

  const workspaceRole = resolveEffectiveWorkspaceRole({
    agencyRole: member.role,
    workspaceRole: assignment.rows[0]?.role,
  });

  if (!workspaceRole) {
    throw apiError('You do not have access to this workspace', 'WORKSPACE_ACCESS_DENIED', 403);
  }

  return {
    agency,
    member,
    billing,
    workspace,
    workspaceRole,
    assignedWorkspaceRole: cleanText(assignment.rows[0]?.role, null),
  };
}

async function getRequestWorkspaceAccess(req) {
  const cached = req.agencyWorkspaceAccess;
  if (cached && String(cached.workspace?.id || '') === String(req.params.workspaceId || '')) {
    return cached;
  }

  const access = await getWorkspaceAccessContext(req.user.id, req.params.workspaceId);
  req.agencyWorkspaceAccess = access;
  return access;
}

function createWorkspaceRoleMiddleware(allowedRoles, deniedMessage = 'You do not have permission to perform this action') {
  const normalizedRoles = new Set(
    (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles])
      .map((role) => cleanText(role, null))
      .filter(Boolean)
  );

  return async (req, res, next) => {
    try {
      const access = await getRequestWorkspaceAccess(req);
      if (normalizedRoles.size > 0 && !normalizedRoles.has(access.workspaceRole)) {
        throw apiError(deniedMessage, 'INSUFFICIENT_PERMISSIONS', 403);
      }
      next();
    } catch (error) {
      return handleError(res, error, deniedMessage);
    }
  };
}

function buildWorkspaceVisibilityWhereClause({ includeArchived = false, requireAssignment = false } = {}) {
  const clauses = [
    `aw.agency_id = $1`,
    `($2::boolean = true OR aw.status != 'archived')`,
  ];

  if (requireAssignment) {
    clauses.push(
      `EXISTS (
         SELECT 1
         FROM agency_workspace_members awm_visible
         WHERE awm_visible.workspace_id = aw.id
           AND awm_visible.agency_member_id = $3
       )`
    );
  }

  return clauses.join(' AND ');
}

async function buildWorkspaceAnalyticsSummary({ workspaceId }) {
  const draftCounts = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status IN ('draft', 'pending_approval', 'approved', 'rejected'))::int AS draft_count,
       COUNT(*) FILTER (WHERE status = 'pending_approval')::int AS pending_approval_count,
       COUNT(*) FILTER (WHERE status = 'approved')::int AS approved_count,
       COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled_count,
       COUNT(*) FILTER (WHERE status = 'published')::int AS published_count,
       COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_count
     FROM agency_workspace_drafts
     WHERE workspace_id = $1`,
    [workspaceId]
  );

  const activeAccountCount = await countAgencyEligibleWorkspaceAccounts(workspaceId);

  return {
    drafts: Number(draftCounts.rows[0]?.draft_count || 0),
    pendingApproval: Number(draftCounts.rows[0]?.pending_approval_count || 0),
    approved: Number(draftCounts.rows[0]?.approved_count || 0),
    scheduled: Number(draftCounts.rows[0]?.scheduled_count || 0),
    published: Number(draftCounts.rows[0]?.published_count || 0),
    failed: Number(draftCounts.rows[0]?.failed_count || 0),
    totalAccounts: activeAccountCount,
    activeAccounts: activeAccountCount,
  };
}

async function buildWorkspaceInsightsSummary({ workspace, userId }) {
  const workspaceAccounts = await listAgencyEligibleWorkspaceAccounts(workspace.id);
  const localSummary = await buildWorkspaceAnalyticsSummary({ workspaceId: workspace.id });
  const settings = await getWorkspaceSettings(workspace.id);
  const groups = buildWorkspaceSnapshotGroups(workspaceAccounts);

  const twitterCalls = groups
    .filter((group) => group.channel === 'twitter')
    .map((group) =>
      invokeInternalToolEndpoint({
        tool: 'twitter',
        path: '/api/internal/twitter/analytics-summary',
        userId,
        teamId: group.teamId,
        body: {
          targetAccountIds: group.targetAccountIds,
          days: 30,
        },
      }).catch((error) => ({ error: error?.message || 'Twitter analytics unavailable' }))
    );

  const linkedinAnalyticsCalls = groups
    .filter((group) => group.channel === 'linkedin')
    .map((group) =>
      invokeInternalToolEndpoint({
        tool: 'linkedin',
        path: '/api/internal/analytics/summary',
        userId,
        teamId: group.teamId,
        body: {
          targetAccountIds: group.targetAccountIds,
          days: 30,
        },
      }).catch((error) => ({ error: error?.message || 'LinkedIn analytics unavailable' }))
    );

  const linkedinEngagementCalls = groups
    .filter((group) => group.channel === 'linkedin')
    .map((group) =>
      invokeInternalToolEndpoint({
        tool: 'linkedin',
        path: '/api/internal/engagement/summary',
        userId,
        teamId: group.teamId,
        body: {
          targetAccountIds: group.targetAccountIds,
          days: 30,
        },
      }).catch((error) => ({ error: error?.message || 'LinkedIn engagement unavailable' }))
    );

  const socialAnalyticsCalls = groups
    .filter((group) => group.channel === 'social')
    .map((group) =>
      invokeInternalToolEndpoint({
        tool: 'social',
        path: '/api/internal/posts/analytics-summary',
        userId,
        teamId: group.teamId,
        body: {
          targetAccountIds: group.targetAccountIds,
          days: 30,
        },
      }).catch((error) => ({ error: error?.message || 'Social analytics unavailable' }))
    );

  const [twitterResponses, linkedinAnalyticsResponses, linkedinEngagementResponses, socialAnalyticsResponses] = await Promise.all([
    Promise.all(twitterCalls),
    Promise.all(linkedinAnalyticsCalls),
    Promise.all(linkedinEngagementCalls),
    Promise.all(socialAnalyticsCalls),
  ]);

  const sumField = (items = [], field) =>
    items.reduce((total, item) => total + (Number(item?.[field] || 0) || 0), 0);

  const twitter = {
    connectedAccounts: workspaceAccounts.filter((account) => resolveSnapshotChannel(account.platform) === 'twitter').length,
    totalPosts: sumField(twitterResponses, 'totalPosts'),
    totalImpressions: sumField(twitterResponses, 'totalImpressions'),
    totalLikes: sumField(twitterResponses, 'totalLikes'),
    totalRetweets: sumField(twitterResponses, 'totalRetweets'),
    totalReplies: sumField(twitterResponses, 'totalReplies'),
    totalEngagement: sumField(twitterResponses, 'totalEngagement'),
    pendingApprovals: sumField(twitterResponses, 'pendingApprovals'),
    pendingQueue: sumField(twitterResponses, 'pendingQueue'),
    errors: twitterResponses.filter((item) => item?.error).map((item) => item.error),
  };

  const linkedin = {
    connectedAccounts: workspaceAccounts.filter((account) => resolveSnapshotChannel(account.platform) === 'linkedin').length,
    totalPosts: sumField(linkedinAnalyticsResponses, 'totalPosts'),
    totalViews: sumField(linkedinAnalyticsResponses, 'totalViews'),
    totalLikes: sumField(linkedinAnalyticsResponses, 'totalLikes'),
    totalComments: sumField(linkedinAnalyticsResponses, 'totalComments'),
    totalShares: sumField(linkedinAnalyticsResponses, 'totalShares'),
    totalEngagement: sumField(linkedinAnalyticsResponses, 'totalEngagement'),
    pendingApprovals: sumField(linkedinAnalyticsResponses, 'pendingApprovals'),
    draftQueue: sumField(linkedinAnalyticsResponses, 'draftQueue'),
    approvedQueue: sumField(linkedinAnalyticsResponses, 'approvedQueue'),
    postedQueue: sumField(linkedinAnalyticsResponses, 'postedQueue'),
    errors: linkedinAnalyticsResponses.filter((item) => item?.error).map((item) => item.error),
  };

  const engagement = {
    linkedin: {
      readyReplyDrafts: sumField(linkedinEngagementResponses, 'readyReplyDrafts'),
      sentReplies: sumField(linkedinEngagementResponses, 'sentReplies'),
      postsWithComments: sumField(linkedinEngagementResponses, 'postsWithComments'),
      errors: linkedinEngagementResponses.filter((item) => item?.error).map((item) => item.error),
    },
  };

  return {
    workspace: {
      ...localSummary,
      competitorTargets: Array.isArray(settings.competitor_targets) ? settings.competitor_targets.length : 0,
    },
    platforms: {
      twitter,
      linkedin,
      social: {
        connectedAccounts: workspaceAccounts.filter((account) => resolveSnapshotChannel(account.platform) === 'social').length,
        totalPosted: sumField(socialAnalyticsResponses, 'totalPosted'),
        totalScheduled: sumField(socialAnalyticsResponses, 'totalScheduled'),
        totalFailed: sumField(socialAnalyticsResponses, 'totalFailed'),
        threadsPosts: sumField(socialAnalyticsResponses, 'threadsPosts'),
        instagramPosts: sumField(socialAnalyticsResponses, 'instagramPosts'),
        youtubePosts: sumField(socialAnalyticsResponses, 'youtubePosts'),
        threadsLikes: sumField(socialAnalyticsResponses, 'threadsLikes'),
        threadsReplies: sumField(socialAnalyticsResponses, 'threadsReplies'),
        threadsViews: sumField(socialAnalyticsResponses, 'threadsViews'),
        instagramLikes: sumField(socialAnalyticsResponses, 'instagramLikes'),
        instagramComments: sumField(socialAnalyticsResponses, 'instagramComments'),
        instagramReach: sumField(socialAnalyticsResponses, 'instagramReach'),
        youtubeViews: sumField(socialAnalyticsResponses, 'youtubeViews'),
        errors: socialAnalyticsResponses.filter((item) => item?.error).map((item) => item.error),
      },
    },
    engagement,
    automation: {
      automationEnabled: Boolean(settings.automation_enabled),
      requireAdminApproval: Boolean(settings.require_admin_approval),
      autoGenerateTwitter: Boolean(settings.auto_generate_twitter),
      autoGenerateLinkedin: Boolean(settings.auto_generate_linkedin),
      autoGenerateSocial: Boolean(settings.auto_generate_social),
      engagementAutoReply: Boolean(settings.engagement_auto_reply),
    },
    generatedAt: new Date().toISOString(),
  };
}

async function buildWorkspaceOperationsSnapshotData({
  workspace,
  userId,
  limit = 50,
  queueLimit = 50,
} = {}) {
  const normalizedLimit = Math.max(1, Math.min(100, Number(limit || 50) || 50));
  const normalizedQueueLimit = Math.max(1, Math.min(100, Number(queueLimit || normalizedLimit) || normalizedLimit));
  const workspaceAccounts = await listAgencyEligibleWorkspaceAccounts(workspace.id);

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
          userId,
          teamId: group.teamId,
          body: {
            targetAccountIds: group.targetAccountIds,
            limit: normalizedLimit,
            queueLimit: normalizedQueueLimit,
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

  const localDraftRows = await getWorkspaceDrafts(workspace.id);
  const localQueue = localDraftRows
    .filter((draft) => ['draft', 'pending_approval', 'approved', 'rejected', 'failed'].includes(normalizeDraftStatus(draft.status, 'draft')))
    .map((draft) => ({
      id: `agdq-${draft.id}`,
      sourceId: String(draft.id),
      platform: 'workspace',
      kind: 'queue',
      status: normalizeDraftStatus(draft.status, 'draft'),
      title: cleanText(draft.title, null),
      content: String(draft.content || ''),
      scheduledFor: draft.scheduled_for || null,
      createdAt: draft.created_at || null,
      updatedAt: draft.updated_at || null,
      workspaceId: workspace.id,
      sourceChannel: 'agency',
      mediaUrls: Array.isArray(draft.media_urls) ? draft.media_urls : [],
    }));
  const localCalendar = localDraftRows
    .filter((draft) => normalizeDraftStatus(draft.status, 'draft') === 'scheduled' && draft.scheduled_for)
    .map((draft) => ({
      id: `agdc-${draft.id}`,
      sourceId: String(draft.id),
      platform: 'workspace',
      kind: 'calendar',
      status: 'scheduled',
      title: cleanText(draft.title, null),
      content: String(draft.content || ''),
      scheduledFor: draft.scheduled_for || null,
      createdAt: draft.created_at || null,
      updatedAt: draft.updated_at || null,
      workspaceId: workspace.id,
      sourceChannel: 'agency',
      mediaUrls: Array.isArray(draft.media_urls) ? draft.media_urls : [],
    }));

  const queue = sortByMostRecentTimestamp([
    ...localQueue,
    ...snapshots.flatMap((entry) => (entry.status === 'ok' ? entry.queue : [])),
  ]);
  const calendar = sortByUpcomingTimestamp([
    ...localCalendar,
    ...snapshots.flatMap((entry) => (entry.status === 'ok' ? entry.calendar : [])),
  ]);

  const healthyRemoteSources = snapshots.filter((entry) => entry.status === 'ok').length;
  const sourceFailedCount = snapshots.length - healthyRemoteSources;

  return {
    workspaceId: workspace.id,
    summary: {
      sourceCount: snapshots.length + 1,
      sourceHealthyCount: healthyRemoteSources + 1,
      sourceFailedCount,
      queueCount: queue.length,
      calendarCount: calendar.length,
      lastRefreshedAt: new Date().toISOString(),
    },
    queue,
    calendar,
    sources: [
      {
        channel: 'agency',
        teamId: null,
        status: 'ok',
        queueCount: localQueue.length,
        calendarCount: localCalendar.length,
        error: null,
        code: null,
        platforms: ['workspace'],
      },
      ...snapshots.map((entry) => ({
        channel: entry.channel,
        teamId: entry.teamId || null,
        status: entry.status,
        queueCount: Number(entry.queueCount || 0),
        calendarCount: Number(entry.calendarCount || 0),
        error: entry.error || null,
        code: entry.code || null,
        platforms: entry.platforms || [],
      })),
    ],
  };
}

async function buildWorkspaceAnalysisSummary({ workspace, userId }) {
  const [persistedSettings, analyticsSummary, insightsSummary, operationsSnapshot, workspaceAccounts] = await Promise.all([
    getWorkspaceSettings(workspace.id),
    buildWorkspaceAnalyticsSummary({ workspaceId: workspace.id }),
    buildWorkspaceInsightsSummary({ workspace, userId }),
    buildWorkspaceOperationsSnapshotData({ workspace, userId, limit: 50, queueLimit: 60 }),
    listAgencyEligibleWorkspaceAccounts(workspace.id),
  ]);
  const settings = await buildWorkspaceEffectiveSettings({
    workspace,
    userId,
    persistedSettings,
    workspaceAccounts,
    operationsSnapshot,
  });

  const competitorTargets = normalizeStringArray(settings?.competitor_targets, 25);
  const topThemes = dedupeCaseInsensitiveStrings([
    ...extractTopThemesFromContents(
      buildAnalysisContentCorpus([
        ...(Array.isArray(operationsSnapshot.queue) ? operationsSnapshot.queue : []),
        ...(Array.isArray(operationsSnapshot.calendar) ? operationsSnapshot.calendar : []),
      ]),
      {
        workspace,
        settings,
        limit: 8,
        normalizeWorkspacePostingPreferences,
      }
    ),
    ...(Array.isArray(settings?.detected_context?.fields?.top_themes)
      ? settings.detected_context.fields.top_themes
      : []),
  ], 8);

  const twitterItems = (operationsSnapshot.queue || []).concat(operationsSnapshot.calendar || []).filter((item) => item?.platform === 'twitter');
  const linkedinItems = (operationsSnapshot.queue || []).concat(operationsSnapshot.calendar || []).filter((item) => item?.platform === 'linkedin');
  const socialItems = (operationsSnapshot.queue || []).concat(operationsSnapshot.calendar || []).filter((item) => (
    ['threads', 'instagram', 'youtube', 'social'].includes(normalizeWorkspacePlatform(item?.platform))
  ));

  const platformCards = [
    buildPlatformAnalysisCard({
      platformKey: 'twitter',
      label: 'Twitter / X',
      connectedAccounts: Number(insightsSummary?.platforms?.twitter?.connectedAccounts || 0),
      postedCount: Number(insightsSummary?.platforms?.twitter?.totalPosts || 0),
      engagementCount: Number(insightsSummary?.platforms?.twitter?.totalEngagement || 0),
      queueItems: twitterItems.length,
      scheduledItems: (operationsSnapshot.calendar || []).filter((item) => item?.platform === 'twitter').length,
      pendingApprovals: Number(insightsSummary?.platforms?.twitter?.pendingApprovals || 0),
      sourceErrors: Array.isArray(insightsSummary?.platforms?.twitter?.errors) ? insightsSummary.platforms.twitter.errors.map(sanitizeErrorForClient) : [],
      contentItems: twitterItems,
      workspace,
      settings,
      normalizeWorkspacePostingPreferences,
    }),
    buildPlatformAnalysisCard({
      platformKey: 'linkedin',
      label: 'LinkedIn',
      connectedAccounts: Number(insightsSummary?.platforms?.linkedin?.connectedAccounts || 0),
      postedCount: Number(insightsSummary?.platforms?.linkedin?.totalPosts || 0),
      engagementCount: Number(insightsSummary?.platforms?.linkedin?.totalEngagement || 0),
      queueItems: linkedinItems.length,
      scheduledItems: (operationsSnapshot.calendar || []).filter((item) => item?.platform === 'linkedin').length,
      pendingApprovals: Number(insightsSummary?.platforms?.linkedin?.pendingApprovals || 0),
      sourceErrors: Array.isArray(insightsSummary?.platforms?.linkedin?.errors) ? insightsSummary.platforms.linkedin.errors.map(sanitizeErrorForClient) : [],
      contentItems: linkedinItems,
      workspace,
      settings,
      normalizeWorkspacePostingPreferences,
    }),
    buildPlatformAnalysisCard({
      platformKey: 'threads',
      label: 'Threads / Social',
      connectedAccounts: Number(insightsSummary?.platforms?.social?.connectedAccounts || 0),
      postedCount: Number(insightsSummary?.platforms?.social?.totalPosted || 0),
      engagementCount:
        Number(insightsSummary?.platforms?.social?.threadsLikes || 0) +
        Number(insightsSummary?.platforms?.social?.threadsReplies || 0) +
        Number(insightsSummary?.platforms?.social?.instagramLikes || 0) +
        Number(insightsSummary?.platforms?.social?.instagramComments || 0),
      queueItems: socialItems.length,
      scheduledItems: (operationsSnapshot.calendar || []).filter((item) => (
        ['threads', 'instagram', 'youtube', 'social'].includes(normalizeWorkspacePlatform(item?.platform))
      )).length,
      pendingApprovals: 0,
      sourceErrors: Array.isArray(insightsSummary?.platforms?.social?.errors) ? insightsSummary.platforms.social.errors.map(sanitizeErrorForClient) : [],
      contentItems: socialItems,
      workspace,
      settings,
      normalizeWorkspacePostingPreferences,
    }),
  ].filter((card) => card.connectedAccounts > 0 || card.queueItems > 0 || card.scheduledItems > 0);

  const strongestChannel = [...platformCards]
    .sort((a, b) => (
      ((b.engagementCount || 0) + (b.postedCount || 0) * 5 + (b.connectedAccounts || 0) * 2)
      - ((a.engagementCount || 0) + (a.postedCount || 0) * 5 + (a.connectedAccounts || 0) * 2)
    ))[0] || null;

  const queuePressure =
    Number(analyticsSummary.pendingApproval || 0) >= 5 || Number(operationsSnapshot.summary?.queueCount || 0) >= 10
      ? 'high'
      : Number(analyticsSummary.pendingApproval || 0) >= 2 || Number(operationsSnapshot.summary?.queueCount || 0) >= 4
        ? 'medium'
        : 'low';
  const ideaBank = buildWorkspaceIdeaBank({
    workspace,
    settings,
    topThemes,
    competitorTargets,
    platformCards,
    operationsSnapshot,
    cleanText,
    normalizeWorkspacePostingPreferences,
  });

  return {
    refreshedAt: new Date().toISOString(),
    overview: {
      connectedAccountCount: Number(workspaceAccounts.length || 0),
      platformCount: platformCards.length,
      queueCount: Number(operationsSnapshot.summary?.queueCount || 0),
      calendarCount: Number(operationsSnapshot.summary?.calendarCount || 0),
      competitorTargetCount: competitorTargets.length,
      strongestChannel: strongestChannel?.label || null,
      queuePressure,
      ideaCount: ideaBank.length,
    },
    ownAnalysis: {
      topThemes,
      platformCards,
      summaryNotes: [
        settings?.detected_context?.status === 'applied'
          ? 'Account profile context and competitor references were auto-detected from connected accounts and recent workspace activity.'
          : null,
        strongestChannel?.label
          ? `${strongestChannel.label} currently has the strongest usable signal in this workspace.`
          : 'Connect at least one active platform to unlock stronger own-account analysis.',
        queuePressure === 'high'
          ? 'Queue pressure is high, so the safest win is clearer, easier-to-approve content.'
          : queuePressure === 'medium'
            ? 'The queue is moving, but a sharper idea bank will help the team review faster.'
            : 'Queue pressure is low enough to experiment with a fresh content angle.',
      ].filter(Boolean),
    },
    competitors: {
      status: competitorTargets.length > 0 ? 'ready' : 'missing',
      targets: competitorTargets,
      autoDetectedCount: Array.isArray(settings?.detected_context?.fields?.competitor_targets)
        ? settings.detected_context.fields.competitor_targets.length
        : 0,
      watchlistNotes: competitorTargets.length > 0
        ? (
            settings?.detected_context?.status === 'applied'
              ? [
                  `Auto-detected ${competitorTargets.length} competitor/reference signal${competitorTargets.length === 1 ? '' : 's'} from recent workspace mentions.`,
                  'You can edit the watchlist any time, but the workspace now starts with competitor context instead of a blank state.',
                ]
              : [
                  `Tracking ${competitorTargets.length} competitor reference${competitorTargets.length === 1 ? '' : 's'} from the workspace watchlist.`,
                  'Use these as positioning anchors now, then we can deepen this into true scraped competitor intel next.',
                ]
          )
        : [
            settings?.detected_context?.status === 'available'
              ? 'We found competitor/reference candidates from account signals, but your saved workspace context is taking priority.'
              : 'We could not confidently auto-detect competitor references from the current workspace signal yet.',
            'The workspace can still generate ideas from your own account signals and client context in the meantime.',
          ],
    },
    ideaBank,
    sourceHealth: Array.isArray(operationsSnapshot.sources) ? operationsSnapshot.sources : [],
    analytics: analyticsSummary,
  };
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

export async function bootstrapAgencyOwner(userId, options = {}) {
  const externalClient = options?.client || null;
  const client = externalClient || await pool.connect();
  const ownsTransaction = !externalClient;
  try {
    if (ownsTransaction) {
      await client.query('BEGIN');
    }
    const userResult = await client.query('SELECT id, email, name, plan_type FROM users WHERE id = $1 FOR UPDATE', [userId]);
    if (userResult.rows.length === 0) throw apiError('User not found', 'USER_NOT_FOUND', 404);
    const user = userResult.rows[0];
    if (user.plan_type !== 'agency') {
      if (ownsTransaction) {
        await client.query('ROLLBACK');
      }
      return null;
    }

    await client.query(
      `INSERT INTO agency_accounts (owner_id, name, status, seat_limit, workspace_limit, workspace_account_limit, created_at, updated_at)
       VALUES ($1, $2, 'active', $3, $4, $5, NOW(), NOW())
       ON CONFLICT (owner_id) DO NOTHING`,
      [userId, `${cleanText(user.name, user.email)} Workspace Hub`, AGENCY_LIMITS.seatLimit, AGENCY_LIMITS.workspaceLimit, AGENCY_LIMITS.workspaceAccountLimit]
    );

    const accountResult = await client.query(
      'SELECT id FROM agency_accounts WHERE owner_id = $1 LIMIT 1 FOR UPDATE',
      [userId]
    );
    if (accountResult.rows.length === 0) {
      throw apiError('Failed to initialize agency account', 'AGENCY_BOOTSTRAP_FAILED', 500);
    }
    const agencyId = accountResult.rows[0].id;

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

    if (ownsTransaction) {
      await client.query('COMMIT');
      await logAudit(agencyId, userId, 'agency_owner_bootstrap', 'agency_account', agencyId, {});
    }
    return agencyId;
  } catch (error) {
    if (ownsTransaction) {
      await client.query('ROLLBACK');
    }
    throw error;
  } finally {
    if (ownsTransaction) {
      client.release();
    }
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

    const subscriptionRow = await getAgencySubscription(membership.member.userId);
    const billing = computeBillingState(subscriptionRow);
    if (billing.ownerAccessBlocked) {
      throw apiError('Agency subscription is inactive for this account', 'AGENCY_SUBSCRIPTION_INACTIVE', 403);
    }
    membership.billing = billing;
  } else {
    membership.billing = computeBillingState(null);
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
  // Keep Agency Hub enabled by default in every environment unless explicitly disabled.
  return true;
}

const agencyClientOnboardingController = createAgencyClientOnboardingController({
  crypto,
  jwt,
  pool,
  query,
  EmailService,
  apiError,
  cleanText,
  cleanEmail,
  handleError,
  logAudit,
  getAgencyContext,
  getWorkspace,
  listAgencyEligibleWorkspaceAccounts,
  ensureApiBaseUrl,
  normalizeWorkspacePlatform,
  safeQuery,
  TOOL_API_BASE_URLS,
  AGENCY_INVITE_URL_BASE,
  AGENCY_LIMITS,
  EDIT_ROLES,
});

const agencyWorkspaceContentController = createAgencyWorkspaceContentController({
  query,
  jwt,
  AGENCY_JWT_SECRET,
  AGENCY_APPROVAL_TOKEN_TTL_DAYS,
  getAgencyApprovalUrl,
  getAgencyContext,
  getRequestWorkspaceAccess,
  getWorkspace,
  getWorkspaceDrafts,
  getWorkspaceSettings,
  assertAgencyDraftWriteRole,
  assertAgencyDraftApproverRole,
  resolveDraftCreateStatus,
  cleanText,
  apiError,
  normalizeStringArray,
  normalizeMediaInputs,
  logAudit,
  buildWorkspaceAiContextBlock,
  normalizeWorkspacePostingPreferences,
  getWorkspaceTonePreset,
  normalizeWorkspaceGenerationMode,
  normalizeWorkspaceAccountIds,
  listAgencyEligibleWorkspaceAccounts,
  normalizeWorkspacePlatform,
  invokeInternalToolEndpoint,
  normalizeWorkspaceGenerationModes,
  invokeWorkspaceGenerationMode,
  uploadWorkspaceMediaToSocialStorage,
  normalizeDraftStatus,
  isEditableDraftStatus,
  isAgencyDraftApproverRole,
  normalizeTimestamp,
  normalizeThreadParts,
  splitTextByCharacterLimit,
  scheduleToWorkspaceAccount,
  publishToWorkspaceAccount,
  buildWorkspaceAnalyticsSummary,
  buildWorkspaceEffectiveSettings,
  toBoolean,
  buildWorkspaceInsightsSummary,
  buildWorkspaceAnalysisSummary,
  buildWorkspaceOperationsSnapshotData,
  safeQuery,
  handleError,
});

export const AgencyController = {
  async ensureEnabled(req, res, next) {
    if (!isAgencyHubEnabled()) {
      return res.status(503).json({ error: 'Agency Hub is disabled', code: 'AGENCY_HUB_DISABLED' });
    }
    try {
      await ensureAgencySchemaReady();
      next();
    } catch (error) {
      return handleError(res, error, 'Agency schema is not ready');
    }
  },

  requireWorkspaceReadRole: createWorkspaceRoleMiddleware(
    ['owner', 'admin', 'editor', 'viewer'],
    'You do not have access to this workspace'
  ),

  requireWorkspaceWriteRole: createWorkspaceRoleMiddleware(
    ['owner', 'admin', 'editor'],
    'Only owner/admin/editor can modify workspace content'
  ),

  requireWorkspaceApproveRole: createWorkspaceRoleMiddleware(
    ['owner', 'admin'],
    'Only owner/admin can review, schedule, or publish workspace posts'
  ),

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

  ...agencyClientOnboardingController,

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
        billing: context.billing || computeBillingState(null),
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
      const { agency, member } = await getAgencyContext(req.user.id);
      const includeArchived = String(req.query.includeArchived || '').toLowerCase() === 'true';
      const requireAssignment = !EDIT_ROLES.has(member.role);
      const visibilityWhere = buildWorkspaceVisibilityWhereClause({ includeArchived, requireAssignment });
      const summaryVisibilityParams = requireAssignment
        ? [agency.id, includeArchived, member.id]
        : [agency.id, includeArchived];
      const rowVisibilityParams = [agency.id, includeArchived, member.id];
      const summary = await query(
        `SELECT
           COUNT(*) FILTER (WHERE aw.status = 'active') AS active,
           COUNT(*) FILTER (WHERE aw.status = 'paused') AS paused,
           COUNT(*) FILTER (WHERE aw.status = 'archived') AS archived
         FROM agency_workspaces aw
         WHERE ${visibilityWhere}`,
        summaryVisibilityParams
      );
      const rows = await query(
         `SELECT aw.*,
                COALESCE(m.member_count, 0) AS member_count,
                COALESCE(a.account_count, 0) AS account_count,
                awm_current.role AS current_member_role
         FROM agency_workspaces aw
         LEFT JOIN (
           SELECT
             aw_inner.id AS workspace_id,
             COUNT(DISTINCT workspace_member_ids.agency_member_id) AS member_count
           FROM agency_workspaces aw_inner
           LEFT JOIN agency_members creator_am
             ON creator_am.agency_id = aw_inner.agency_id
            AND creator_am.user_id = aw_inner.created_by
            AND creator_am.status = 'active'
           LEFT JOIN LATERAL (
             SELECT awm.agency_member_id
             FROM agency_workspace_members awm
             WHERE awm.workspace_id = aw_inner.id
             UNION
             SELECT creator_am.id
             WHERE creator_am.id IS NOT NULL
           ) workspace_member_ids ON true
           GROUP BY aw_inner.id
         ) m ON m.workspace_id = aw.id
         LEFT JOIN (
           SELECT awa.workspace_id, COUNT(*) AS account_count
           FROM agency_workspace_accounts awa
           ${AGENCY_WORKSPACE_ACCOUNT_JOINS_SQL}
           WHERE awa.is_active = true
             AND ${AGENCY_WORKSPACE_ACCOUNT_VISIBILITY_SQL}
           GROUP BY awa.workspace_id
         ) a ON a.workspace_id = aw.id
         LEFT JOIN agency_workspace_members awm_current
           ON awm_current.workspace_id = aw.id
          AND awm_current.agency_member_id = $3
         WHERE ${visibilityWhere}
         ORDER BY aw.created_at DESC`,
        rowVisibilityParams
      );
      return res.json({
        summary: {
          active: Number(summary.rows[0]?.active || 0),
          paused: Number(summary.rows[0]?.paused || 0),
          archived: Number(summary.rows[0]?.archived || 0),
        },
        workspaces: rows.rows.map((workspaceRow) => ({
          ...workspaceRow,
          currentMemberRole: resolveEffectiveWorkspaceRole({
            agencyRole: member.role,
            workspaceRole: workspaceRow.current_member_role,
          }),
        })),
      });
    } catch (error) {
      return handleError(res, error, 'Failed to list agency workspaces');
    }
  },

  async getWorkspaceDetail(req, res) {
    try {
      const { agency, member, workspace, workspaceRole } = await getRequestWorkspaceAccess(req);

      const [memberCountResult, accountCountResult] = await Promise.all([
        query(
          `SELECT COUNT(DISTINCT workspace_member_ids.agency_member_id) AS member_count
           FROM agency_workspaces aw
           LEFT JOIN agency_members creator_am
             ON creator_am.agency_id = aw.agency_id
            AND creator_am.user_id = aw.created_by
            AND creator_am.status = 'active'
           LEFT JOIN LATERAL (
             SELECT awm.agency_member_id
             FROM agency_workspace_members awm
             WHERE awm.workspace_id = aw.id
             UNION
             SELECT creator_am.id
             WHERE creator_am.id IS NOT NULL
           ) workspace_member_ids ON true
           WHERE aw.id = $1
           GROUP BY aw.id`,
          [workspace.id]
        ),
        query(
          `SELECT COUNT(*) AS account_count
           FROM agency_workspace_accounts awa
           ${AGENCY_WORKSPACE_ACCOUNT_JOINS_SQL}
           WHERE awa.workspace_id = $1
             AND awa.is_active = true
             AND ${AGENCY_WORKSPACE_ACCOUNT_VISIBILITY_SQL}`,
          [workspace.id]
        ),
      ]);

      return res.json({
        workspace: {
          ...workspace,
          member_count: Number(memberCountResult.rows[0]?.member_count || 0),
          account_count: Number(accountCountResult.rows[0]?.account_count || 0),
          currentMemberRole: resolveEffectiveWorkspaceRole({
            agencyRole: member.role,
            workspaceRole,
          }),
        },
      });
    } catch (error) {
      return handleError(res, error, 'Failed to load workspace');
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
        workspaceMemberLimit: AGENCY_WORKSPACE_MEMBER_LIMIT,
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
      await query(
        `UPDATE agency_workspace_members
         SET role = $1
         WHERE agency_member_id = $2
           AND (role IS NULL OR role = $3)`,
        [targetRole, req.params.memberId, target.rows[0].role]
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
      const { agency, member, workspace, workspaceRole } = await getRequestWorkspaceAccess(req);

      const assigned = await query(
        `SELECT
                am.id,
                am.user_id,
                am.email,
                COALESCE(MAX(awm.role), CASE WHEN am.user_id = $3 THEN 'owner' ELSE am.role END) AS role,
                am.status,
                COALESCE(u.name, SPLIT_PART(am.email, '@', 1)) AS display_name
         FROM agency_members am
         LEFT JOIN agency_workspace_members awm
           ON awm.workspace_id = $1
          AND awm.agency_member_id = am.id
         LEFT JOIN users u ON u.id = am.user_id
         WHERE am.agency_id = $2
           AND am.status = 'active'
           AND (awm.id IS NOT NULL OR am.user_id = $3)
         GROUP BY am.id, am.user_id, am.email, am.role, am.status, u.name, am.created_at
         ORDER BY CASE COALESCE(MAX(awm.role), CASE WHEN am.user_id = $3 THEN 'owner' ELSE am.role END) WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'editor' THEN 2 ELSE 3 END, am.created_at ASC`,
        [workspace.id, agency.id, workspace.created_by]
      );

      const available = await query(
        `SELECT am.id, am.user_id, am.email, am.role, am.status, COALESCE(u.name, SPLIT_PART(am.email, '@', 1)) AS display_name,
                (EXISTS(SELECT 1 FROM agency_workspace_members x WHERE x.workspace_id = $2 AND x.agency_member_id = am.id) OR am.user_id = $3) AS is_assigned
         FROM agency_members am
         LEFT JOIN users u ON u.id = am.user_id
         WHERE am.agency_id = $1 AND am.status = 'active'
         ORDER BY CASE am.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'editor' THEN 2 ELSE 3 END, am.created_at ASC`,
        [agency.id, workspace.id, workspace.created_by]
      );

      return res.json({
        assignedMembers: assigned.rows,
        availableMembers: available.rows,
        assignedUsage: Number(assigned.rows.length || 0),
        memberLimit: AGENCY_WORKSPACE_MEMBER_LIMIT,
        currentMemberRole: workspaceRole,
        currentAgencyRole: member.role,
      });
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
      const requestedWorkspaceRoles =
        req.body.memberRoles && typeof req.body.memberRoles === 'object'
          ? req.body.memberRoles
          : {};
      if (memberIds.length > AGENCY_WORKSPACE_MEMBER_LIMIT) {
        throw apiError(
          `Workspace member limit reached (${AGENCY_WORKSPACE_MEMBER_LIMIT})`,
          'WORKSPACE_MEMBER_LIMIT_REACHED',
          400
        );
      }
      if (memberIds.length > 0) {
        const valid = await query(
          `SELECT id, role FROM agency_members WHERE agency_id = $1 AND status = 'active' AND id = ANY($2::uuid[])`,
          [agency.id, memberIds]
        );
        if (valid.rows.length !== memberIds.length) throw apiError('Invalid workspace member selection', 'INVALID_WORKSPACE_MEMBER_SELECTION', 400);
        const roleById = new Map(valid.rows.map((row) => [String(row.id), row.role]));
        await query(`DELETE FROM agency_workspace_members WHERE workspace_id = $1`, [workspace.id]);
        for (const memberId of memberIds) {
          const requestedRole = cleanText(requestedWorkspaceRoles[memberId], null);
          const nextRole = requestedRole && VALID_MEMBER_ROLES.has(requestedRole)
            ? requestedRole
            : (roleById.get(String(memberId)) || 'editor');
          await query(
            `INSERT INTO agency_workspace_members (workspace_id, agency_member_id, role, assigned_by, created_at)
             VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (workspace_id, agency_member_id) DO UPDATE SET role = EXCLUDED.role, assigned_by = EXCLUDED.assigned_by`,
            [workspace.id, memberId, nextRole, req.user.id]
          );
        }
      } else {
        await query(`DELETE FROM agency_workspace_members WHERE workspace_id = $1`, [workspace.id]);
      }
      await logAudit(agency.id, req.user.id, 'workspace_members_replaced', 'agency_workspace', workspace.id, { memberIds });
      return res.json({ assignedMemberIds: memberIds });
    } catch (error) {
      return handleError(res, error, 'Failed to update workspace members');
    }
  },

  async listAvailableAccounts(req, res) {
    try {
      const { agency, member } = await getAgencyContext(req.user.id);
      const workspaceId = cleanText(req.query.workspaceId || req.query.workspace_id, null);
      const isEditorLike = !EDIT_ROLES.has(member.role);
      let scopedWorkspace = null;
      if (workspaceId) {
        scopedWorkspace = await assertWorkspaceAccess({
          workspaceId,
          agencyId: agency.id,
          memberRole: member.role,
          memberId: member.id,
        });
      }

      const accounts = [];
      const toApiAccount = (row = {}, fallbackSourceType = null) => ({
        sourceType: cleanText(row.sourceType ?? row.source_type, fallbackSourceType),
        sourceId: String(row.sourceId ?? row.source_id ?? row.id ?? ''),
        platform: row.platform || null,
        accountId: row.accountId ?? row.account_id ?? null,
        accountUsername: row.accountUsername ?? row.account_username ?? null,
        accountDisplayName: row.accountDisplayName ?? row.account_display_name ?? null,
        profileImageUrl: row.profileImageUrl ?? row.profile_image_url ?? null,
        updatedAt: row.updatedAt ?? row.updated_at ?? null,
        sourceUpdatedAt: row.sourceUpdatedAt ?? row.source_updated_at ?? row.updated_at ?? null,
        tokenExpiresAt: row.tokenExpiresAt ?? row.token_expires_at ?? null,
        metadata: row.metadata || {},
        workspaceId: cleanText(row.workspace_id, null),
      });
      const pushRows = (rows, sourceType) => {
        for (const row of rows) {
          accounts.push(toApiAccount(row, sourceType));
        }
      };

      const registry = await safeQuery(
        `SELECT
           sca.id::text AS source_id,
           sca.platform,
           sca.account_id,
           sca.account_username,
           sca.account_display_name,
           sca.profile_image_url,
           sca.updated_at,
           sca.updated_at AS source_updated_at,
           sca.token_expires_at,
           COALESCE(sca.metadata, '{}'::jsonb) || jsonb_build_object('team_id', sca.team_id, 'scope', 'team') AS metadata
         FROM social_connected_accounts sca
         LEFT JOIN team_members tm
           ON tm.team_id::text = sca.team_id::text
          AND tm.user_id::text = $1::text
          AND tm.status = 'active'
         WHERE sca.is_active = true
           AND sca.team_id IS NOT NULL
           AND (
             sca.user_id::text = $1::text
             OR sca.connected_by::text = $1::text
             OR tm.user_id::text = $1::text
           )`,
        [req.user.id]
      );
      pushRows(registry, 'social_connected_accounts');

      const teamTwitter = await safeQuery(
        `SELECT ta.id::text AS source_id, 'twitter' AS platform, ta.twitter_user_id AS account_id, ta.twitter_username AS account_username,
                ta.twitter_display_name AS account_display_name, ta.twitter_profile_image_url AS profile_image_url,
                ta.updated_at, ta.updated_at AS source_updated_at, ta.token_expires_at,
                jsonb_build_object('team_id', ta.team_id, 'scope', 'team') AS metadata
         FROM team_accounts ta
         JOIN team_members tm ON tm.team_id::text = ta.team_id::text AND tm.user_id::text = $1::text AND tm.status = 'active'
         WHERE ta.active = true`,
        [req.user.id]
      );
      pushRows(teamTwitter, 'team_accounts');

      const teamLinkedIn = await safeQuery(
        `SELECT lta.id::text AS source_id, 'linkedin' AS platform, lta.linkedin_user_id AS account_id, lta.linkedin_username AS account_username,
                lta.linkedin_display_name AS account_display_name, lta.linkedin_profile_image_url AS profile_image_url,
                lta.updated_at, lta.updated_at AS source_updated_at, lta.token_expires_at,
                jsonb_build_object('team_id', lta.team_id, 'scope', 'team', 'account_type', lta.account_type, 'organization_id', lta.organization_id) AS metadata
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

      const assignedAccounts = await listAgencyAssignedWorkspaceAccounts(agency.id);
      const assignedWorkspaceIds = isEditorLike
        ? await safeQuery(
            `SELECT workspace_id::text AS workspace_id
             FROM agency_workspace_members
             WHERE agency_member_id = $1`,
            [member.id]
          )
        : [];
      const allowedWorkspaceIdSet = new Set(assignedWorkspaceIds.map((row) => String(row.workspace_id || '')));

      const visibleAssignedAccounts = assignedAccounts.filter((account) => (
        !isEditorLike || allowedWorkspaceIdSet.has(String(account.workspace_id))
      ));

      if (scopedWorkspace) {
        const scopedWorkspaceId = String(scopedWorkspace.id);
        const attachedToScopedWorkspace = visibleAssignedAccounts.filter(
          (account) => String(account.workspace_id) === scopedWorkspaceId
        );

        if (isEditorLike) {
          return res.json({
            accounts: attachedToScopedWorkspace.map((account) => toApiAccount(account)),
            workspaceId: scopedWorkspaceId,
          });
        }

        const availableForScopedWorkspace = deduped.filter((account) => {
          const assignment = findAgencyWorkspaceAccountAssignment(assignedAccounts, account);
          if (!assignment) return true;
          return String(assignment.workspace_id) === scopedWorkspaceId;
        });

        const merged = [];
        const mergedSeen = new Set();
        const pushMerged = (account) => {
          const sourceType = cleanText(account.sourceType ?? account.source_type, '');
          const sourceId = cleanText(account.sourceId ?? account.source_id, '');
          if (!sourceType || !sourceId) return;
          const key = `${sourceType}:${sourceId}`.toLowerCase();
          if (mergedSeen.has(key)) return;
          mergedSeen.add(key);
          merged.push(account);
        };

        availableForScopedWorkspace.forEach(pushMerged);
        attachedToScopedWorkspace.forEach(pushMerged);

        return res.json({
          accounts: merged,
          workspaceId: scopedWorkspaceId,
        });
      }

      if (isEditorLike) {
        return res.json({
          accounts: visibleAssignedAccounts.map((account) => toApiAccount(account)),
        });
      }

      const availableAccounts = deduped.filter((account) => (
        !findAgencyWorkspaceAccountAssignment(assignedAccounts, account)
      ));

      return res.json({ accounts: availableAccounts });
    } catch (error) {
      return handleError(res, error, 'Failed to list available accounts');
    }
  },

  async listWorkspaceAccounts(req, res) {
    try {
      const { agency, member } = await getAgencyContext(req.user.id);
      const workspace = await assertWorkspaceAccess({
        workspaceId: req.params.workspaceId,
        agencyId: agency.id,
        memberRole: member.role,
        memberId: member.id,
      });
      const accounts = await listAgencyEligibleWorkspaceAccounts(workspace.id);
      return res.json({ accounts });
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
      if (!isAgencyAllowedAccountSourceType(sourceType)) {
        throw apiError('Agency workspaces only accept shared team accounts, not personal profiles', 'AGENCY_PERSONAL_ACCOUNTS_BLOCKED', 400);
      }

      const activeCount = await countAgencyEligibleWorkspaceAccounts(workspace.id);
      if (activeCount >= agency.workspaceAccountLimit) {
        throw apiError(`Workspace account limit reached (${agency.workspaceAccountLimit})`, 'WORKSPACE_ACCOUNT_LIMIT_REACHED', 400);
      }

      const canonicalAccount = await findAgencyAttachableAccount(req.user.id, { sourceType, sourceId });
      if (!canonicalAccount) {
        throw apiError('This account is not eligible for Agency workspaces. Connect it through a shared team scope first.', 'AGENCY_ACCOUNT_NOT_ELIGIBLE', 400);
      }
      if (normalizeWorkspacePlatform(platform) !== normalizeWorkspacePlatform(canonicalAccount.platform)) {
        throw apiError('Selected account platform does not match the requested platform', 'ACCOUNT_PLATFORM_MISMATCH', 400);
      }

      const assignedAccounts = await listAgencyAssignedWorkspaceAccounts(agency.id);
      const existingAssignment = findAgencyWorkspaceAccountAssignment(
        assignedAccounts,
        {
          ...canonicalAccount,
          source_type: sourceType,
          source_id: canonicalAccount.source_id,
        }
      );
      if (existingAssignment) {
        if (String(existingAssignment.workspace_id) === String(workspace.id)) {
          throw apiError('Account is already attached to this workspace', 'WORKSPACE_ACCOUNT_DUPLICATE', 409);
        }
        throw apiError(
          `Account is already attached to workspace "${cleanText(existingAssignment.workspace_name, 'another workspace')}"`,
          'WORKSPACE_ACCOUNT_ALREADY_ASSIGNED',
          409
        );
      }

      const duplicate = await query(
        `SELECT id FROM agency_workspace_accounts
         WHERE workspace_id = $1 AND source_type = $2 AND source_id = $3 AND is_active = true LIMIT 1`,
        [workspace.id, sourceType, canonicalAccount.source_id]
      );
      if (duplicate.rows.length > 0) throw apiError('Account is already attached to this workspace', 'WORKSPACE_ACCOUNT_DUPLICATE', 409);

      const inserted = await query(
        `INSERT INTO agency_workspace_accounts
         (workspace_id, platform, source_type, source_id, account_id, account_username, account_display_name, profile_image_url, metadata, attached_by, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, true, NOW(), NOW())
         RETURNING *`,
        [
          workspace.id,
          canonicalAccount.platform,
          sourceType,
          canonicalAccount.source_id,
          cleanText(canonicalAccount.account_id, null),
          cleanText(canonicalAccount.account_username, null),
          cleanText(canonicalAccount.account_display_name, null),
          cleanText(canonicalAccount.profile_image_url, null),
          JSON.stringify(canonicalAccount.metadata || {}),
          req.user.id,
        ]
      );
      await logAudit(agency.id, req.user.id, 'workspace_account_attached', 'agency_workspace_account', inserted.rows[0].id, {
        workspaceId: workspace.id,
        sourceType,
        sourceId: canonicalAccount.source_id,
        platform: canonicalAccount.platform,
      });
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

  ...agencyWorkspaceContentController,

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

      const assignedAccounts = await listAgencyEligibleWorkspaceAccounts(workspace.id);
      const allowedAccountIds = assignedAccounts.map((row) => row.account_id || `${row.source_type}:${row.source_id}`);
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
