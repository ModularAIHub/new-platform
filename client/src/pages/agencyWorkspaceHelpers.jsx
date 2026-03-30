import {
  AtSign,
  BarChart3,
  CalendarDays,
  Clock3,
  FileText,
  Instagram,
  LayoutDashboard,
  Linkedin,
  Link2,
  Layers3,
  PenSquare,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  Twitter,
  Users,
  Workflow,
  Youtube,
} from 'lucide-react';

export const WORKSPACE_SECTION_DEFINITIONS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'setup', label: 'Profile', icon: SlidersHorizontal },
  { key: 'compose', label: 'Compose', icon: PenSquare },
  { key: 'calendar', label: 'Queue + Calendar', icon: CalendarDays },
  { key: 'analysis', label: 'Analysis', icon: Sparkles },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'connections', label: 'Connections', icon: Link2 },
  { key: 'team', label: 'Team', icon: Users },
];

export const WORKSPACE_OVERVIEW_ACTIONS = [
  {
    key: 'connections',
    title: 'Connect Profiles',
    description: 'Attach client accounts to the workspace and make them available for posting.',
    icon: Link2,
  },
  {
    key: 'compose',
    title: 'Compose & Generate',
    description: 'Write once, generate platform drafts, save, publish, or schedule from one shared studio.',
    icon: PenSquare,
  },
  {
    key: 'calendar',
    title: 'Review Queue',
    description: 'See the shared queue and calendar without leaving the workspace.',
    icon: CalendarDays,
  },
  {
    key: 'analysis',
    title: 'Analysis + Ideas',
    description: 'Turn workspace signals, competitor targets, and approval pressure into clearer content opportunities.',
    icon: Sparkles,
  },
  {
    key: 'team',
    title: 'Assign Team Access',
    description: 'Control which admins and editors can operate inside this client workspace.',
    icon: Users,
  },
  {
    key: 'setup',
    title: 'Client Profile',
    description: 'Maintain the client name, brand, timezone, logo, and workspace status.',
    icon: SlidersHorizontal,
  },
];

export const WORKSPACE_OVERVIEW_HIGHLIGHTS = [
  {
    title: 'Workspace-native flow',
    description: 'Connect accounts here, compose here, and publish or schedule from the shared client workspace.',
    icon: Workflow,
    theme: 'from-blue-50 to-white text-blue-700 border-blue-100',
  },
  {
    title: 'Shared operations',
    description: 'Everyone assigned to this workspace sees the same drafts, queue, calendar, analytics, and settings.',
    icon: Layers3,
    theme: 'from-amber-50 to-white text-amber-700 border-amber-100',
  },
  {
    title: 'Approval-safe publishing',
    description: 'Admins can approve, publish, and schedule while editors stay focused on creating strong drafts.',
    icon: ShieldCheck,
    theme: 'from-emerald-50 to-white text-emerald-700 border-emerald-100',
  },
];

export const WORKSPACE_CONNECTION_PLATFORMS = [
  {
    key: 'twitter',
    label: 'Twitter / X',
    badge: 'X',
    description: 'Connect the client\'s X account for drafting, scheduling, queue, and analytics.',
    theme: 'bg-sky-50 border-sky-200 text-sky-700',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    badge: 'in',
    description: 'Connect a LinkedIn profile or page for posting, engagement, and analytics.',
    theme: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    key: 'threads',
    label: 'Threads',
    badge: '@',
    description: 'Connect Threads so this workspace can create, schedule, and review social drafts.',
    theme: 'bg-neutral-50 border-neutral-200 text-neutral-700',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    badge: 'IG',
    description: 'Connect Instagram for cross-posts, queue management, and shared calendar visibility.',
    theme: 'bg-pink-50 border-pink-200 text-pink-700',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    badge: 'YT',
    description: 'Connect YouTube for videos, scheduling, and workspace-level reporting.',
    theme: 'bg-red-50 border-red-200 text-red-700',
  },
];

export const WORKSPACE_GENERATION_MODES = [
  { key: 'twitter', label: 'Twitter / X', serviceLabel: 'Tweet Genie' },
  { key: 'linkedin', label: 'LinkedIn', serviceLabel: 'LinkedIn Genie' },
  { key: 'threads', label: 'Threads / Social', serviceLabel: 'Social Genie' },
];

export const WORKSPACE_PLATFORM_LABELS = {
  twitter: 'Twitter / X',
  linkedin: 'LinkedIn',
  threads: 'Threads',
  instagram: 'Instagram',
  youtube: 'YouTube',
  social: 'Social',
};

export const WORKSPACE_PLATFORM_LIMITS = {
  twitter: 280,
  linkedin: 3000,
  threads: 500,
};

export const AUTO_REFRESH_CONNECTION_PLATFORMS = new Set(['twitter', 'linkedin']);

export const FALLBACK_GRANTED_SCOPES = {
  instagram: ['instagram_business_basic', 'instagram_business_content_publish', 'pages_show_list', 'business_management'],
  threads: ['threads_basic', 'threads_content_publish'],
};

export const DEFAULT_GENERATION_TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', guidance: null },
  { value: 'casual', label: 'Casual', guidance: null },
  { value: 'informative', label: 'Informative', guidance: null },
  { value: 'witty', label: 'Witty', guidance: null },
  { value: 'inspirational', label: 'Inspirational', guidance: null },
];

export const QUEUE_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'pending_approval', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'scheduled', label: 'Scheduled' },
];

export const countCharacters = (value) => Array.from(String(value || '')).length;

export const splitTextByCharacterLimit = (value, limit, maxParts = 25) => {
  const text = String(value || '').trim();
  const normalizedLimit = Math.max(1, Number(limit) || 1);
  if (!text) return [];

  const parts = [];
  const paragraphs = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);

  const pushChunk = (chunk) => {
    const cleaned = String(chunk || '').trim();
    if (!cleaned) return;
    if (parts.length >= maxParts) return;
    parts.push(cleaned);
  };

  for (const paragraph of (paragraphs.length > 0 ? paragraphs : [text])) {
    let current = '';
    const words = paragraph.split(/\s+/).filter(Boolean);

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (countCharacters(candidate) <= normalizedLimit) {
        current = candidate;
        continue;
      }

      if (current) {
        pushChunk(current);
        current = '';
      }

      if (countCharacters(word) <= normalizedLimit) {
        current = word;
        continue;
      }

      let remainder = word;
      while (countCharacters(remainder) > normalizedLimit && parts.length < maxParts) {
        const slice = Array.from(remainder).slice(0, normalizedLimit).join('');
        pushChunk(slice);
        remainder = Array.from(remainder).slice(normalizedLimit).join('');
      }
      current = remainder;
    }

    if (current) {
      pushChunk(current);
    }
  }

  return parts.slice(0, maxParts);
};

export const normalizeAgencyMetadata = (value) => (
  value && typeof value === 'object' ? value : {}
);

export const cleanAgencyValue = (value) => {
  const normalized = String(value || '').trim();
  return normalized || null;
};

export const getAgencyAccountTeamId = (account) => {
  const metadata = normalizeAgencyMetadata(account?.metadata);
  return (
    cleanAgencyValue(metadata.team_id) ||
    cleanAgencyValue(metadata.teamId) ||
    cleanAgencyValue(account?.team_id) ||
    null
  );
};

export const getAgencyAccountSourceKey = (account) => {
  const sourceType = cleanAgencyValue(account?.sourceType || account?.source_type)?.toLowerCase();
  const sourceId = cleanAgencyValue(account?.sourceId || account?.source_id);
  if (!sourceType || !sourceId) return null;
  return `${sourceType}:${sourceId}`.toLowerCase();
};

export const getAgencyAccountIdentityKey = (account) => {
  const platform = cleanAgencyValue(account?.platform)?.toLowerCase();
  if (!platform) return null;

  const metadata = normalizeAgencyMetadata(account?.metadata);
  const rawOrganizationId =
    cleanAgencyValue(metadata.organization_id) ||
    cleanAgencyValue(account?.organization_id);
  const rawAccountId =
    cleanAgencyValue(account?.accountId || account?.account_id) ||
    cleanAgencyValue(metadata.twitter_user_id) ||
    cleanAgencyValue(metadata.linkedin_user_id);
  const accountUsername =
    cleanAgencyValue(account?.accountUsername || account?.account_username);
  const accountDisplayName =
    cleanAgencyValue(account?.accountDisplayName || account?.account_display_name);

  let canonicalId = null;
  if (rawOrganizationId) {
    canonicalId = `org:${rawOrganizationId}`;
  } else if (rawAccountId) {
    if (/^urn:li:organization:/i.test(rawAccountId)) {
      canonicalId = `org:${rawAccountId.split(':').pop()}`;
    } else if (/^urn:li:person:/i.test(rawAccountId)) {
      canonicalId = `person:${rawAccountId.split(':').pop()}`;
    } else {
      canonicalId = rawAccountId;
    }
  } else {
    canonicalId = accountUsername || accountDisplayName;
  }

  if (!canonicalId) return null;
  return `${platform}:${canonicalId}`.toLowerCase();
};

export const getWorkspacePlatformLabel = (platform) => (
  WORKSPACE_PLATFORM_LABELS[String(platform || '').toLowerCase()] || String(platform || 'Account')
);

export const getWorkspaceAccountLabel = (account) => (
  account?.account_display_name ||
  account?.accountDisplayName ||
  account?.account_username ||
  account?.accountUsername ||
  account?.account_id ||
  account?.accountId ||
  account?.source_id ||
  account?.sourceId ||
  'Connected account'
);

export const getWorkspacePlatformIcon = (platform, className = 'h-4 w-4') => {
  const normalized = String(platform || '').toLowerCase();
  if (normalized === 'twitter') return <Twitter className={`${className} text-sky-500`} />;
  if (normalized === 'linkedin') return <Linkedin className={`${className} text-blue-700`} />;
  if (normalized === 'threads') return <AtSign className={`${className} text-slate-700`} />;
  if (normalized === 'instagram') return <Instagram className={`${className} text-pink-600`} />;
  if (normalized === 'youtube') return <Youtube className={`${className} text-red-600`} />;
  return <Link2 className={`${className} text-gray-500`} />;
};

export const getConnectionHandleLabel = (account) => {
  const username = cleanAgencyValue(account?.account_username || account?.accountUsername);
  if (username) return username.startsWith('@') ? username : `@${username}`;
  return cleanAgencyValue(account?.account_id || account?.accountId) || 'No public handle';
};

export const getConnectionLastSyncedLabel = (account) => {
  const value =
    account?.source_updated_at ||
    account?.sourceUpdatedAt ||
    account?.updated_at ||
    account?.updatedAt ||
    null;
  if (!value) return 'Sync status not available yet';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sync status not available yet';
  return parsed.toLocaleString();
};

export const getConnectionGrantedScopes = (account) => {
  const metadata = normalizeAgencyMetadata(account?.metadata);
  const metadataScopes = []
    .concat(
      Array.isArray(metadata.grantedScopes) ? metadata.grantedScopes : [],
      Array.isArray(metadata.granted_scopes) ? metadata.granted_scopes : []
    )
    .map((scope) => String(scope || '').trim())
    .filter(Boolean);
  if (metadataScopes.length > 0) {
    return [...new Set(metadataScopes)];
  }
  return FALLBACK_GRANTED_SCOPES[String(account?.platform || '').toLowerCase()] || [];
};

export const getConnectionTokenHealthMeta = (account) => {
  const platform = String(account?.platform || '').toLowerCase();
  const expiresAt =
    cleanAgencyValue(account?.token_expires_at) ||
    cleanAgencyValue(account?.tokenExpiresAt) ||
    null;

  if (!expiresAt) {
    return {
      label: AUTO_REFRESH_CONNECTION_PLATFORMS.has(platform) ? 'Healthy' : 'Active',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      detail: AUTO_REFRESH_CONNECTION_PLATFORMS.has(platform)
        ? 'Managed by the platform refresh flow'
        : 'No expiry reported by the provider',
    };
  }

  const expiresAtMs = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiresAtMs)) {
    return {
      label: 'Active',
      className: 'bg-gray-100 text-gray-700 border border-gray-200',
      detail: 'Expiry timestamp is unavailable',
    };
  }

  const msRemaining = expiresAtMs - Date.now();
  if (msRemaining <= 0) {
    return {
      label: 'Reconnect Needed',
      className: 'bg-red-50 text-red-700 border border-red-100',
      detail: `Expired on ${new Date(expiresAtMs).toLocaleDateString()}`,
    };
  }

  const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
  if (daysRemaining <= 7) {
    return {
      label: 'Expiring Soon',
      className: 'bg-amber-50 text-amber-700 border border-amber-100',
      detail: `Expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
    };
  }

  return {
    label: 'Healthy',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    detail: `Expires on ${new Date(expiresAtMs).toLocaleDateString()}`,
  };
};

export const normalizeTonePresetEntries = (value, maxItems = 5) => {
  if (!Array.isArray(value)) return [];

  const presets = [];
  const seen = new Set();
  for (const item of value) {
    const raw = item && typeof item === 'object' ? item : {};
    const name = cleanAgencyValue(raw.name || raw.label || (typeof item === 'string' ? item : null));
    const guidance = cleanAgencyValue(raw.guidance || raw.description || raw.notes);
    if (!name) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    presets.push({ name, guidance: guidance || '' });
    if (presets.length >= maxItems) break;
  }

  return presets;
};

export const getDraftStatusMeta = (status) => {
  const normalized = String(status || 'draft').toLowerCase();
  if (normalized === 'pending_approval') {
    return {
      label: 'Pending Approval',
      className: 'bg-amber-50 text-amber-700 border border-amber-100',
    };
  }
  if (normalized === 'approved') {
    return {
      label: 'Approved',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    };
  }
  if (normalized === 'rejected') {
    return {
      label: 'Rejected',
      className: 'bg-rose-50 text-rose-700 border border-rose-100',
    };
  }
  if (normalized === 'scheduled') {
    return {
      label: 'Scheduled',
      className: 'bg-blue-50 text-blue-700 border border-blue-100',
    };
  }
  if (normalized === 'published') {
    return {
      label: 'Published',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    };
  }
  if (normalized === 'failed') {
    return {
      label: 'Failed',
      className: 'bg-red-50 text-red-700 border border-red-100',
    };
  }
  return {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 border border-gray-200',
  };
};

export const getWorkspaceStatusMeta = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active') {
    return {
      label: 'Active',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }
  if (normalized === 'paused') {
    return {
      label: 'Paused',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }
  if (normalized === 'archived') {
    return {
      label: 'Archived',
      className: 'border-red-200 bg-red-50 text-red-700',
    };
  }
  return {
    label: status || 'Unknown',
    className: 'border-gray-200 bg-gray-50 text-gray-700',
  };
};
