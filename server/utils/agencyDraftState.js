const EDIT_ROLES = new Set(['owner', 'admin']);
const WRITE_ROLES = new Set(['owner', 'admin', 'editor']);

export const VALID_DRAFT_STATUSES = new Set([
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'scheduled',
  'published',
  'failed',
  'archived',
]);

function cleanText(value, fallback = null) {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function apiError(message, code = 'BAD_REQUEST', status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

export function normalizeDraftStatus(value, fallback = 'draft') {
  const normalized = cleanText(value, fallback)?.toLowerCase() || fallback;
  return VALID_DRAFT_STATUSES.has(normalized) ? normalized : fallback;
}

export function isAgencyDraftWriterRole(role) {
  return WRITE_ROLES.has(cleanText(role, '')?.toLowerCase() || '');
}

export function assertAgencyDraftWriteRole(role, message = 'Only owner/admin/editor can modify drafts') {
  if (!isAgencyDraftWriterRole(role)) {
    throw apiError(message, 'INSUFFICIENT_PERMISSIONS', 403);
  }
}

export function isAgencyDraftApproverRole(role) {
  return EDIT_ROLES.has(cleanText(role, '')?.toLowerCase() || '');
}

export function assertAgencyDraftApproverRole(role, message = 'Only owner/admin can review, schedule, or publish drafts') {
  if (!isAgencyDraftApproverRole(role)) {
    throw apiError(message, 'INSUFFICIENT_PERMISSIONS', 403);
  }
}

export function isEditableDraftStatus(status) {
  return ['draft', 'rejected'].includes(normalizeDraftStatus(status, 'draft'));
}

export function resolveDraftCreateStatus({ memberRole, settings, submissionAction = null }) {
  const normalizedAction = cleanText(submissionAction, '')?.toLowerCase() || '';

  if (normalizedAction === 'approval' || normalizedAction === 'pending_approval' || normalizedAction === 'send_for_approval') {
    return 'pending_approval';
  }

  if (normalizedAction === 'approved' && isAgencyDraftApproverRole(memberRole)) {
    return 'approved';
  }

  if (Boolean(settings?.require_admin_approval) && !isAgencyDraftApproverRole(memberRole)) {
    return 'pending_approval';
  }

  return 'draft';
}

export function resolveWorkspaceDraftStatusView(statusView) {
  const normalized = cleanText(statusView, null)?.toLowerCase() || null;
  if (!normalized) return null;

  if (normalized === 'all') {
    return ['draft', 'rejected', 'pending_approval', 'approved', 'scheduled'];
  }
  if (normalized === 'draft' || normalized === 'drafts') {
    return ['draft', 'rejected'];
  }
  if (normalized === 'pending' || normalized === 'pending_approval') {
    return ['pending_approval'];
  }
  if (normalized === 'approved') {
    return ['approved'];
  }
  if (normalized === 'scheduled') {
    return ['scheduled'];
  }
  if (normalized === 'history' || normalized === 'terminal') {
    return ['published', 'failed'];
  }

  return null;
}
