import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { fetchCsrfToken } from '../utils/api';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  Clock3,
  FileText,
  Link2,
  PenSquare,
} from 'lucide-react';
import AgencyWorkspaceAnalysisTab from '../components/agency/AgencyWorkspaceAnalysisTab.jsx';
import AgencyWorkspaceAnalyticsTab from '../components/agency/AgencyWorkspaceAnalyticsTab.jsx';
import AgencyWorkspaceComposeTab from '../components/agency/AgencyWorkspaceComposeTab.jsx';
import AgencyWorkspaceConnectionsTab from '../components/agency/AgencyWorkspaceConnectionsTab.jsx';
import AgencyLinkedInSelectionModal from '../components/agency/AgencyLinkedInSelectionModal.jsx';
import AgencyWorkspaceOverviewTab from '../components/agency/AgencyWorkspaceOverviewTab.jsx';
import AgencyWorkspaceOperationsTab from '../components/agency/AgencyWorkspaceOperationsTab.jsx';
import AgencyWorkspaceShell from '../components/agency/AgencyWorkspaceShell.jsx';
import AgencyWorkspaceSetupTab from '../components/agency/AgencyWorkspaceSetupTab.jsx';
import AgencyWorkspaceTeamTab from '../components/agency/AgencyWorkspaceTeamTab.jsx';
import {
  getCalendarDateKey,
  getCalendarMonthKey,
  parseCalendarMonthKey,
  shiftCalendarMonthKey,
} from '../components/agency/agencyWorkspaceCalendar.js';
import {
  countCharacters,
  cleanAgencyValue,
  DEFAULT_GENERATION_TONE_OPTIONS,
  getAgencyAccountIdentityKey,
  getAgencyAccountSourceKey,
  getAgencyAccountTeamId,
  getDraftStatusMeta,
  getWorkspaceAccountLabel,
  getWorkspacePlatformLabel,
  getWorkspaceStatusMeta,
  normalizeTonePresetEntries,
  QUEUE_STATUS_FILTER_OPTIONS,
  splitTextByCharacterLimit,
  WORKSPACE_GENERATION_MODES,
  WORKSPACE_PLATFORM_LIMITS,
  WORKSPACE_SECTION_DEFINITIONS,
} from './agencyWorkspaceHelpers';

const TAB_DATA_REQUIREMENTS = {
  overview: ['operations', 'drafts', 'analytics'],
  setup: ['settings', 'approval'],
  analysis: ['analysis', 'settings'],
  analytics: ['insights', 'analytics', 'operations'],
  compose: [],
  calendar: ['operations', 'drafts'],
  connections: [],
  team: ['members'],
};

const EMPTY_ANALYSIS_SUMMARY = {
  refreshedAt: null,
  overview: {
    connectedAccountCount: 0,
    platformCount: 0,
    queueCount: 0,
    calendarCount: 0,
    competitorTargetCount: 0,
    strongestChannel: null,
    queuePressure: 'low',
    ideaCount: 0,
  },
  ownAnalysis: {
    topThemes: [],
    platformCards: [],
    summaryNotes: [],
  },
  competitors: {
    status: 'missing',
    targets: [],
    watchlistNotes: [],
  },
  ideaBank: [],
  sourceHealth: [],
  analytics: null,
};

const parseCompetitorTargetsInput = (value) => (
  [...new Set(
    String(value || '')
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  )].slice(0, 25)
);

const AgencyWorkspacePage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agencyContext, setAgencyContext] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    brand_name: '',
    timezone: '',
    logo_url: '',
  });
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileContextEditing, setProfileContextEditing] = useState(false);
  const [profileContextForm, setProfileContextForm] = useState({
    industry: '',
    brand_colors: '',
    target_audience: '',
    profile_notes: '',
    tone_presets: [],
    portal_title: '',
    portal_message: '',
  });
  const [availableMembers, setAvailableMembers] = useState([]);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [agencyMembers, setAgencyMembers] = useState([]);
  const [seatUsage, setSeatUsage] = useState(0);
  const [seatLimit, setSeatLimit] = useState(5);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviteSending, setInviteSending] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [attachedAccounts, setAttachedAccounts] = useState([]);
  const [teamPermissions, setTeamPermissions] = useState(null);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [showLinkedInSelection, setShowLinkedInSelection] = useState(false);
  const [linkedInSelectionData, setLinkedInSelectionData] = useState(null);
  const [selectingLinkedInAccount, setSelectingLinkedInAccount] = useState(false);
  const [publisherContent, setPublisherContent] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [publisherTargets, setPublisherTargets] = useState([]);
  const [composerScheduleFor, setComposerScheduleFor] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState([]);
  const [workspaceDrafts, setWorkspaceDrafts] = useState([]);
  const [queueDrafts, setQueueDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftActionKey, setDraftActionKey] = useState(null);
  const [draftScheduleById, setDraftScheduleById] = useState({});
  const [draftStatusFilter, setDraftStatusFilter] = useState('all');
  const [draftPlatformFilter, setDraftPlatformFilter] = useState('all');
  const [selectedDraftIds, setSelectedDraftIds] = useState([]);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [generationStyle, setGenerationStyle] = useState('professional');
  const [selectedGenerationModes, setSelectedGenerationModes] = useState(['twitter']);
  const [generatedVariants, setGeneratedVariants] = useState([]);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [refiningContent, setRefiningContent] = useState(false);
  const [analyticsSummary, setAnalyticsSummary] = useState({
    drafts: 0,
    scheduled: 0,
    published: 0,
    failed: 0,
    totalAccounts: 0,
    activeAccounts: 0,
    generatedAt: null,
  });
  const [workspaceSettings, setWorkspaceSettings] = useState({
    profile_notes: '',
    competitor_targets: [],
    industry: '',
    brand_colors: [],
    target_audience: '',
    tone_presets: [],
    portal_title: '',
    portal_message: '',
    detected_context: null,
    automation_enabled: false,
    require_admin_approval: true,
    auto_generate_twitter: true,
    auto_generate_linkedin: true,
    auto_generate_social: false,
    engagement_auto_reply: false,
  });
  const [workspaceCompetitorsInput, setWorkspaceCompetitorsInput] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [approvalLink, setApprovalLink] = useState(null);
  const [approvalLinks, setApprovalLinks] = useState([]);
  const [approvalLinkLoading, setApprovalLinkLoading] = useState(false);
  const [approvalLinkCreating, setApprovalLinkCreating] = useState(false);
  const [approvalLinkRevokingId, setApprovalLinkRevokingId] = useState('');
  const [approvalLinkLabel, setApprovalLinkLabel] = useState('');
  const [loadedDataKeys, setLoadedDataKeys] = useState(() => new Set());
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [insightsSummary, setInsightsSummary] = useState({
    workspace: null,
    platforms: {
      twitter: null,
      linkedin: null,
      social: null,
    },
    engagement: {
      linkedin: null,
    },
    automation: null,
    generatedAt: null,
  });
  const [analysisSummary, setAnalysisSummary] = useState(EMPTY_ANALYSIS_SUMMARY);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationsView, setOperationsView] = useState('calendar');
  const [calendarMonthCursor, setCalendarMonthCursor] = useState(() => getCalendarMonthKey(new Date()));
  const [selectedCalendarDateKey, setSelectedCalendarDateKey] = useState('');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('overview');
  const [draftCommentById, setDraftCommentById] = useState({});
  const [rejectReasonById, setRejectReasonById] = useState({});
  const mediaInputRef = useRef(null);
  const [operationsSnapshot, setOperationsSnapshot] = useState({
    summary: {
      sourceCount: 0,
      sourceHealthyCount: 0,
      sourceFailedCount: 0,
      queueCount: 0,
      calendarCount: 0,
      lastRefreshedAt: null,
    },
    queue: [],
    calendar: [],
    sources: [],
  });

  const canMutate = workspace?.status !== 'archived';
  const workspaceStatusMeta = getWorkspaceStatusMeta(workspace?.status);
  const currentWorkspaceRole = String(workspace?.currentMemberRole || agencyContext?.member?.role || '').toLowerCase();
  const canApproveOrPublish = currentWorkspaceRole === 'owner' || currentWorkspaceRole === 'admin';
  const canWrite = ['owner', 'admin', 'editor'].includes(currentWorkspaceRole);
  const composeWriteLocked = !canWrite || !canMutate || workspace?.status !== 'active';
  const requiresAdminApproval = Boolean(workspaceSettings.require_admin_approval);

  const selectedMap = useMemo(() => new Set(selectedMemberIds), [selectedMemberIds]);
  const attachedAccountsByPlatform = useMemo(() => {
    return attachedAccounts.reduce((acc, account) => {
      const key = String(account.platform || '').toLowerCase();
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(account);
      return acc;
    }, {});
  }, [attachedAccounts]);
  const attachedAccountsById = useMemo(() => (
    new Map(attachedAccounts.map((account) => [String(account.id), account]))
  ), [attachedAccounts]);

  const selectedTargetAccounts = useMemo(() => (
    attachedAccounts.filter((account) => publisherTargets.includes(account.id))
  ), [attachedAccounts, publisherTargets]);
  const selectedTargetPlatforms = useMemo(() => (
    new Set(
      selectedTargetAccounts
        .map((account) => String(account?.platform || '').toLowerCase())
        .filter(Boolean)
    )
  ), [selectedTargetAccounts]);
  const hasComposerContent = String(publisherContent || '').trim().length > 0;
  const hasComposerPrompt = String(generationPrompt || '').trim().length > 0;
  const generationModeOptions = useMemo(() => {
    const options = [];
    if ((attachedAccountsByPlatform.twitter || []).length > 0) {
      options.push(WORKSPACE_GENERATION_MODES.find((mode) => mode.key === 'twitter'));
    }
    if ((attachedAccountsByPlatform.linkedin || []).length > 0) {
      options.push(WORKSPACE_GENERATION_MODES.find((mode) => mode.key === 'linkedin'));
    }
    if (
      ((attachedAccountsByPlatform.threads || []).length > 0) ||
      ((attachedAccountsByPlatform.instagram || []).length > 0) ||
      ((attachedAccountsByPlatform.youtube || []).length > 0) ||
      ((attachedAccountsByPlatform.social || []).length > 0)
    ) {
      options.push(WORKSPACE_GENERATION_MODES.find((mode) => mode.key === 'threads'));
    }
    return options.filter(Boolean);
  }, [attachedAccountsByPlatform]);
  const generationToneOptions = useMemo(() => {
    const options = [...DEFAULT_GENERATION_TONE_OPTIONS];
    const seen = new Set(options.map((option) => option.value.toLowerCase()));

    normalizeTonePresetEntries(workspaceSettings.tone_presets).forEach((preset) => {
      const value = String(preset.name || '').trim();
      const key = value.toLowerCase();
      if (!value || seen.has(key)) return;
      seen.add(key);
      options.push({
        value,
        label: value,
        guidance: preset.guidance || null,
      });
    });

    return options;
  }, [workspaceSettings.tone_presets]);
  const activeGenerationModes = generationModeOptions.filter((mode) => selectedGenerationModes.includes(mode.key));
  const primaryGenerationMode = activeGenerationModes[0] || generationModeOptions[0] || WORKSPACE_GENERATION_MODES[0];
  const selectedToneOption = generationToneOptions.find((option) => option.value === generationStyle) || generationToneOptions[0];
  const selectedGenerationServiceLabel = activeGenerationModes.length <= 1
    ? primaryGenerationMode.serviceLabel
    : activeGenerationModes.map((mode) => mode.serviceLabel).join(', ');
  const composerCharacterCount = useMemo(() => countCharacters(publisherContent), [publisherContent]);
  const selectedPlatformCounters = useMemo(() => (
    activeGenerationModes.map((mode) => {
      const limit = WORKSPACE_PLATFORM_LIMITS[mode.key] || null;
      const count = composerCharacterCount;
      return {
        key: mode.key,
        label: getWorkspacePlatformLabel(mode.key),
        count,
        limit,
        overLimit: Boolean(limit) && count > limit,
      };
    })
  ), [activeGenerationModes, composerCharacterCount]);
  const twitterThreadParts = useMemo(() => (
    splitTextByCharacterLimit(publisherContent, WORKSPACE_PLATFORM_LIMITS.twitter, 25)
  ), [publisherContent]);
  const showTwitterThreadPreview =
    (activeGenerationModes.some((mode) => mode.key === 'twitter') || selectedTargetPlatforms.has('twitter')) &&
    twitterThreadParts.length > 1;
  const composerActionHint = !canWrite
    ? 'View-only mode. Review the content and target accounts here, then switch to Queue to follow approvals and publish history.'
    : canApproveOrPublish
      ? 'Choose accounts, then send this into approval, schedule it, or publish it directly.'
      : 'Choose accounts, then send this into approval for an owner/admin to review.';
  const getDraftPlatformKeys = (draft) => {
    const targetIds = Array.isArray(draft?.platform_targets) ? draft.platform_targets : [];
    const resolved = [
      ...new Set(
        targetIds
          .map((id) => attachedAccountsById.get(String(id)))
          .map((account) => String(account?.platform || '').toLowerCase())
          .filter(Boolean)
      ),
    ];

    if (resolved.length > 0) {
      return resolved;
    }

    const generationSource = String(draft?.generation_source || '').toLowerCase();
    if (['twitter', 'linkedin', 'threads', 'instagram', 'youtube'].includes(generationSource)) {
      return [generationSource];
    }

    return ['workspace'];
  };
  const workspaceDraftPlatformOptions = useMemo(() => (
    [
      ...new Set(
        queueDrafts.flatMap((draft) => getDraftPlatformKeys(draft))
      ),
    ]
  ), [queueDrafts, attachedAccountsById]);
  const filteredWorkspaceDrafts = useMemo(() => (
    queueDrafts
      .filter((draft) => {
        const platformMatches = draftPlatformFilter === 'all'
          ? true
          : getDraftPlatformKeys(draft).includes(draftPlatformFilter);
        return platformMatches;
      })
  ), [queueDrafts, draftPlatformFilter, attachedAccountsById]);
  const allFilteredDraftIds = useMemo(() => (
    filteredWorkspaceDrafts.map((draft) => String(draft.id))
  ), [filteredWorkspaceDrafts]);
  const selectedFilteredDraftIds = useMemo(() => (
    selectedDraftIds.filter((id) => allFilteredDraftIds.includes(String(id)))
  ), [selectedDraftIds, allFilteredDraftIds]);
  const publishHistoryEntries = useMemo(() => {
    const derivedFromDrafts = workspaceDrafts.flatMap((draft) => {
      const draftResults = Array.isArray(draft?.downstream_results?.results)
        ? draft.downstream_results.results.filter((result) => {
            const normalizedStatus = String(result?.status || '').toLowerCase();
            return normalizedStatus === 'posted' || normalizedStatus === 'failed' || normalizedStatus === 'published';
          })
        : [];

      if (draftResults.length > 0) {
        return draftResults.map((result, index) => ({
          id: `draft:${draft.id}:${index}:${result.workspaceAccountId || result.platform || 'unknown'}`,
          draftId: draft.id,
          origin: 'draft',
          status: result.status,
          platform: result.platform,
          accountDisplayName: result.accountDisplayName || draft.title || 'Workspace account',
          postId: result.postId || null,
          postUrl: result.postUrl || null,
          error: result.error || draft.last_error || null,
          createdAt: draft.updated_at || draft.created_at || null,
        }));
      }

      if (!['published', 'failed'].includes(String(draft?.status || '').toLowerCase())) {
        return [];
      }

      return [{
        id: `draft:${draft.id}:fallback`,
        draftId: draft.id,
        origin: 'draft',
        status: String(draft.status || '').toLowerCase() === 'published' ? 'posted' : 'failed',
        platform: getDraftPlatformKeys(draft)[0] || 'workspace',
        accountDisplayName: draft.title || 'Workspace draft',
        postId: null,
        postUrl: null,
        error: draft.last_error || null,
        createdAt: draft.updated_at || draft.created_at || null,
      }];
    });

    const combined = [
      ...publishResults,
      ...derivedFromDrafts,
    ];

    const seen = new Set();
    return combined
      .filter((entry) => {
        const key = String(entry?.id || `${entry?.draftId || 'none'}:${entry?.workspaceAccountId || 'none'}:${entry?.platform || 'none'}:${entry?.status || 'none'}`);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((left, right) => new Date(right?.createdAt || 0).getTime() - new Date(left?.createdAt || 0).getTime());
  }, [publishResults, workspaceDrafts, attachedAccountsById]);
  const pendingApprovalCount = Number(insightsSummary.platforms?.twitter?.pendingApprovals || 0)
    + Number(insightsSummary.platforms?.linkedin?.pendingApprovals || 0);
  const socialConnectedCount = Number(insightsSummary.platforms?.social?.connectedAccounts || 0);
  const publishedCount = Number(analyticsSummary.published || 0);
  const failedCount = Number(analyticsSummary.failed || 0);
  const activeAccountCount = Number(analyticsSummary.activeAccounts || 0);
  const sourceHealthyCount = Number(operationsSnapshot.summary?.sourceHealthyCount || 0);
  const sourceFailedCount = Number(operationsSnapshot.summary?.sourceFailedCount || 0);
  const analysisQueuePressureMeta = (
    analysisSummary.overview?.queuePressure === 'high'
      ? { label: 'High', className: 'bg-red-50 text-red-700 border-red-200' }
      : analysisSummary.overview?.queuePressure === 'medium'
        ? { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' }
        : { label: 'Low', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  );
  const recentActivityEntries = useMemo(() => {
    const draftActivities = workspaceDrafts.map((draft) => {
      const status = String(draft?.status || 'draft').toLowerCase();
      const platform = getDraftPlatformKeys(draft)[0] || 'workspace';
      let actionLabel = 'Draft updated';

      if (status === 'pending_approval') actionLabel = 'Sent for approval';
      else if (status === 'approved') actionLabel = 'Draft approved';
      else if (status === 'rejected') actionLabel = 'Draft rejected';
      else if (status === 'scheduled') actionLabel = 'Draft scheduled';
      else if (status === 'published') actionLabel = 'Draft published';
      else if (status === 'failed') actionLabel = 'Publish failed';

      return {
        id: `activity:draft:${draft.id}`,
        timestamp: draft.updated_at || draft.created_at || null,
        actionLabel,
        platform,
        tone: status === 'failed' ? 'text-red-700 bg-red-50 border-red-100' : 'text-gray-700 bg-white border-gray-200',
        detail: draft.title || String(draft.content || '').slice(0, 96) || 'Workspace draft',
      };
    });

    const publishActivities = publishHistoryEntries.map((entry) => ({
      id: `activity:publish:${entry.id}`,
      timestamp: entry.createdAt || null,
      actionLabel: entry.status === 'posted' ? 'Post published' : 'Publish failed',
      platform: entry.platform || 'workspace',
      tone: entry.status === 'posted'
        ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
        : 'text-red-700 bg-red-50 border-red-100',
      detail: entry.accountDisplayName || 'Workspace account',
    }));

    return [...draftActivities, ...publishActivities]
      .filter((item) => item.timestamp)
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
      .slice(0, 5);
  }, [workspaceDrafts, publishHistoryEntries, attachedAccountsById]);
  const lastActiveAt = recentActivityEntries[0]?.timestamp || workspace?.updated_at || workspace?.created_at || null;

  const filteredAvailableAccounts = useMemo(() => {
    const preferredTeamId = cleanAgencyValue(teamPermissions?.team_id);
    const attachedSourceKeys = new Set(
      attachedAccounts
        .map((account) => getAgencyAccountSourceKey(account))
        .filter(Boolean)
    );
    const attachedIdentityKeys = new Set(
      attachedAccounts
        .map((account) => getAgencyAccountIdentityKey(account))
        .filter(Boolean)
    );

    const scoreAccount = (account) => {
      const sourceType = cleanAgencyValue(account?.sourceType || account?.source_type)?.toLowerCase() || '';
      const accountTeamId = getAgencyAccountTeamId(account);
      return [
        preferredTeamId && accountTeamId === preferredTeamId ? 0 : 1,
        sourceType === 'social_connected_accounts' ? 0 : 1,
        sourceType === 'team_accounts' || sourceType === 'linkedin_team_accounts' ? 0 : 1,
      ];
    };

    const sorted = [...availableAccounts].sort((left, right) => {
      const leftScore = scoreAccount(left);
      const rightScore = scoreAccount(right);
      for (let index = 0; index < leftScore.length; index += 1) {
        if (leftScore[index] !== rightScore[index]) {
          return leftScore[index] - rightScore[index];
        }
      }
      return 0;
    });

    const seenIdentityKeys = new Set();
    const result = [];

    for (const account of sorted) {
      const sourceKey = getAgencyAccountSourceKey(account);
      const identityKey = getAgencyAccountIdentityKey(account);
      const accountTeamId = getAgencyAccountTeamId(account);

      if (sourceKey && attachedSourceKeys.has(sourceKey)) {
        continue;
      }

      if (identityKey && attachedIdentityKeys.has(identityKey)) {
        continue;
      }

      if (preferredTeamId && accountTeamId && accountTeamId !== preferredTeamId) {
        continue;
      }

      if (identityKey && seenIdentityKeys.has(identityKey)) {
        continue;
      }

      if (identityKey) {
        seenIdentityKeys.add(identityKey);
      }

      result.push(account);
    }

    return result;
  }, [availableAccounts, attachedAccounts, teamPermissions?.team_id]);

  const availableAccountsByPlatform = useMemo(() => {
    return filteredAvailableAccounts.reduce((acc, account) => {
      const key = String(account.platform || '').toLowerCase();
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(account);
      return acc;
    }, {});
  }, [filteredAvailableAccounts]);

  const connectionSummaryCards = [];

  const calendarItemsByDate = useMemo(() => {
    const groups = new Map();
    (operationsSnapshot.calendar || []).forEach((item) => {
      const key = getCalendarDateKey(item?.scheduledFor || item?.createdAt);
      if (!key) return;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });

    for (const [key, items] of groups.entries()) {
      groups.set(
        key,
        [...items].sort((left, right) => {
          const leftTime = new Date(left?.scheduledFor || left?.createdAt || 0).getTime();
          const rightTime = new Date(right?.scheduledFor || right?.createdAt || 0).getTime();
          return leftTime - rightTime;
        })
      );
    }

    return groups;
  }, [operationsSnapshot.calendar]);

  const calendarMonthGrid = useMemo(() => {
    const monthStart = parseCalendarMonthKey(calendarMonthCursor);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - monthStart.getDay());
    const gridEnd = new Date(monthEnd);
    gridEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));

    const weeks = [];
    const cursor = new Date(gridStart);

    while (cursor <= gridEnd) {
      const week = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const cellDate = new Date(cursor);
        const dateKey = getCalendarDateKey(cellDate);
        week.push({
          dateKey,
          label: cellDate.getDate(),
          inMonth: cellDate.getMonth() === monthStart.getMonth(),
          isToday: dateKey === getCalendarDateKey(new Date()),
          items: dateKey ? (calendarItemsByDate.get(dateKey) || []) : [],
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }

    return {
      label: monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      monthKey: getCalendarMonthKey(monthStart),
      weeks,
    };
  }, [calendarItemsByDate, calendarMonthCursor]);

  const visibleCalendarItems = useMemo(() => {
    if (selectedCalendarDateKey && calendarItemsByDate.has(selectedCalendarDateKey)) {
      return calendarItemsByDate.get(selectedCalendarDateKey) || [];
    }

    const monthItems = [...calendarItemsByDate.entries()].find(([dateKey]) => dateKey.startsWith(calendarMonthCursor));
    if (monthItems) return monthItems[1];

    return [];
  }, [calendarItemsByDate, calendarMonthCursor, selectedCalendarDateKey]);

  const visibleCalendarDateKey = useMemo(() => {
    if (selectedCalendarDateKey && calendarItemsByDate.has(selectedCalendarDateKey)) {
      return selectedCalendarDateKey;
    }

    const monthEntry = [...calendarItemsByDate.keys()].find((dateKey) => dateKey.startsWith(calendarMonthCursor));
    if (monthEntry) return monthEntry;

    return [...calendarItemsByDate.keys()][0] || '';
  }, [calendarItemsByDate, calendarMonthCursor, selectedCalendarDateKey]);

  const workspaceControlMetrics = useMemo(() => ([
    {
      label: 'Connected accounts',
      value: attachedAccounts.length,
      icon: Link2,
      accent: 'text-blue-700',
      iconTheme: 'bg-blue-100 text-blue-700',
      borderTheme: 'border-l-blue-500',
      hint: attachedAccounts.length > 0 ? 'Profiles attached and ready to use' : 'No client profiles attached yet',
      context: attachedAccounts.length > 0 ? 'Workspace is ready for posting' : 'Connect the first account to unlock composer actions',
    },
    {
      label: 'Shared drafts',
      value: workspaceDrafts.length || analyticsSummary.drafts || 0,
      icon: FileText,
      accent: 'text-slate-900',
      iconTheme: 'bg-slate-100 text-slate-700',
      borderTheme: 'border-l-slate-400',
      hint: workspaceDrafts.length > 0 ? 'Drafts everyone can collaborate on' : 'No shared drafts saved yet',
      context: workspaceDrafts.length > 0 ? 'Ready for review and approval' : 'Generate or write the first draft',
    },
    {
      label: 'Queue items',
      value: operationsSnapshot.summary?.queueCount || 0,
      icon: Clock3,
      accent: 'text-amber-700',
      iconTheme: 'bg-amber-100 text-amber-700',
      borderTheme: 'border-l-amber-500',
      hint: (operationsSnapshot.summary?.queueCount || 0) > 0 ? 'Items waiting in the shared review queue' : 'Nothing waiting in queue right now',
      context: (operationsSnapshot.summary?.queueCount || 0) > 0 ? 'Review, approve, or publish next' : 'Queue is clear',
    },
    {
      label: 'Calendar posts',
      value: operationsSnapshot.summary?.calendarCount || 0,
      icon: CalendarDays,
      accent: 'text-emerald-700',
      iconTheme: 'bg-emerald-100 text-emerald-700',
      borderTheme: 'border-l-emerald-500',
      hint: (operationsSnapshot.summary?.calendarCount || 0) > 0 ? 'Scheduled posts across this workspace' : 'No scheduled posts yet',
      context: (operationsSnapshot.summary?.calendarCount || 0) > 0 ? 'Calendar has upcoming activity' : 'Schedule appears after draft approval',
    },
  ]), [attachedAccounts.length, workspaceDrafts.length, analyticsSummary.drafts, operationsSnapshot.summary]);
  const hasBrandContext = Boolean(
    cleanAgencyValue(workspaceSettings.industry)
    || cleanAgencyValue(workspaceSettings.target_audience)
    || cleanAgencyValue(workspaceSettings.profile_notes)
    || (Array.isArray(workspaceSettings.tone_presets) && workspaceSettings.tone_presets.length > 0)
  );
  const workspaceChecklist = useMemo(() => ([
    {
      key: 'connections',
      label: 'Connect channels',
      description: attachedAccounts.length > 0
        ? `${formatMetric(attachedAccounts.length)} channels are attached and ready.`
        : 'Attach the first client account to unlock scheduling and reporting.',
      complete: attachedAccounts.length > 0,
    },
    {
      key: 'setup',
      label: 'Shape the brand system',
      description: hasBrandContext
        ? 'AI context, audience, or tone presets are already saved.'
        : 'Add voice, audience, and brand rules so drafting feels on-brand.',
      complete: hasBrandContext,
    },
    {
      key: 'compose',
      label: 'Create the working draft',
      description: workspaceDrafts.length > 0
        ? `${formatMetric(workspaceDrafts.length)} shared drafts are in motion.`
        : 'Write or generate the first shared draft for this client.',
      complete: workspaceDrafts.length > 0,
    },
    {
      key: 'calendar',
      label: 'Lock the publishing cadence',
      description: Number(operationsSnapshot.summary?.calendarCount || 0) > 0
        ? `${formatMetric(operationsSnapshot.summary?.calendarCount || 0)} items are already scheduled.`
        : 'Nothing is scheduled yet. Move approved work into the calendar.',
      complete: Number(operationsSnapshot.summary?.calendarCount || 0) > 0,
    },
  ]), [
    attachedAccounts.length,
    formatMetric,
    hasBrandContext,
    operationsSnapshot.summary,
    workspaceDrafts.length,
  ]);
  const workspaceCompletionCount = workspaceChecklist.filter((step) => step.complete).length;
  const workspaceCompletionPercent = Math.round((workspaceCompletionCount / workspaceChecklist.length) * 100);
  const nextRecommendedAction = useMemo(() => {
    if (attachedAccounts.length === 0) {
      return {
        key: 'connections',
        eyebrow: 'Recommended next move',
        title: 'Attach the first client profile',
        description: 'Agency mode becomes useful once real channels are attached for drafting, queue reviews, and analytics.',
        cta: 'Open connections',
      };
    }

    if (!hasBrandContext) {
      return {
        key: 'setup',
        eyebrow: 'Recommended next move',
        title: 'Tune the brand system',
        description: 'Refine voice, audience, and AI guardrails so every generated draft sounds like the client.',
        cta: 'Open profile setup',
      };
    }

    if (workspaceDrafts.length === 0) {
      return {
        key: 'compose',
        eyebrow: 'Recommended next move',
        title: 'Create the first shared draft',
        description: 'Start the operating rhythm with a live draft the team can edit, approve, and schedule together.',
        cta: 'Open compose studio',
      };
    }

    if (pendingApprovalCount > 0) {
      return {
        key: 'calendar',
        eyebrow: 'Recommended next move',
        title: 'Clear the approval queue',
        description: `${formatMetric(pendingApprovalCount)} item${pendingApprovalCount === 1 ? '' : 's'} are waiting for review before publishing can continue.`,
        cta: 'Review queue',
      };
    }

    if (Number(operationsSnapshot.summary?.calendarCount || 0) === 0) {
      return {
        key: 'calendar',
        eyebrow: 'Recommended next move',
        title: 'Schedule the next publishing block',
        description: 'Turn approved content into a visible weekly cadence so the client sees momentum.',
        cta: 'Open calendar',
      };
    }

    return {
      key: 'analytics',
      eyebrow: 'Recommended next move',
      title: 'Review performance and refine',
      description: 'The workspace is active. Use analytics and analysis to sharpen the next batch of content.',
      cta: 'Open analytics',
    };
  }, [
    attachedAccounts.length,
    formatMetric,
    hasBrandContext,
    operationsSnapshot.summary,
    pendingApprovalCount,
    workspaceDrafts.length,
  ]);

  const formatDateTime = (value) => {
    if (!value) return 'Not set';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleString();
  };

  const formatDateTimeInputValue = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    const pad = (part) => String(part).padStart(2, '0');
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
  };

  function formatMetric(value) {
    const numeric = Number(value || 0);
    return new Intl.NumberFormat().format(numeric);
  }

  const isWorkspaceTab = (...keys) => keys.includes(activeWorkspaceTab);

  const focusSection = (sectionKey) => {
    setActiveWorkspaceTab(sectionKey);
    if (typeof document === 'undefined') return;
    window.requestAnimationFrame(() => {
      document.getElementById(`agency-workspace-${sectionKey}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const openPendingApprovals = () => {
    setDraftStatusFilter('pending_approval');
    setOperationsView('queue');
    focusSection('calendar');
  };

  const openFailedSources = () => {
    setOperationsView('calendar');
    focusSection('calendar');
    if (typeof document === 'undefined') return;
    window.requestAnimationFrame(() => {
      document.getElementById('agency-workspace-source-health')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  };

  const loadWorkspaceDrafts = async ({ silent = false } = {}) => {
    if (!silent) setDraftsLoading(true);
    try {
      const response = await api.get(`/agency/workspaces/${workspaceId}/drafts`);
      if (response?.data?.currentMemberRole) {
        setWorkspace((previous) => (
          previous
            ? { ...previous, currentMemberRole: response.data.currentMemberRole }
            : previous
        ));
      }
      setWorkspaceDrafts(Array.isArray(response?.data?.drafts) ? response.data.drafts : []);
      setQueueDrafts((previous) => (
        previous.length > 0 && draftStatusFilter !== 'all'
          ? previous
          : (Array.isArray(response?.data?.drafts) ? response.data.drafts : [])
      ));
      setDraftScheduleById((previous) => {
        const next = { ...previous };
        (response?.data?.drafts || []).forEach((draft) => {
          next[draft.id] = next[draft.id] || formatDateTimeInputValue(draft.scheduled_for);
        });
        return next;
      });
      await loadQueueDrafts({ silent: true, statusView: draftStatusFilter });
    } catch (error) {
      if (!silent) {
        toast.error(error?.response?.data?.error || 'Failed to load workspace drafts');
      }
    } finally {
      if (!silent) setDraftsLoading(false);
    }
  };

  const loadAnalyticsSummary = async ({ silent = false } = {}) => {
    try {
      const response = await api.get(`/agency/workspaces/${workspaceId}/analytics/summary`);
      setAnalyticsSummary((previous) => ({
        ...previous,
        ...(response?.data?.summary || {}),
      }));
    } catch (error) {
      if (!silent) {
        toast.error(error?.response?.data?.error || 'Failed to load workspace analytics summary');
      }
    }
  };

  const loadWorkspaceSettings = async ({ silent = false } = {}) => {
    try {
      const response = await api.get(`/agency/workspaces/${workspaceId}/settings`);
      if (response?.data?.currentMemberRole) {
        setWorkspace((previous) => (
          previous
            ? { ...previous, currentMemberRole: response.data.currentMemberRole }
            : previous
        ));
      }
      const settings = response?.data?.settings || {};
      const postingPreferences = settings.posting_preferences && typeof settings.posting_preferences === 'object'
        ? settings.posting_preferences
        : {};
      const tonePresets = normalizeTonePresetEntries(postingPreferences.tone_presets || postingPreferences.tonePresets || []);
      const brandColors = Array.isArray(postingPreferences.brand_colors || postingPreferences.brandColors)
        ? (postingPreferences.brand_colors || postingPreferences.brandColors).map((item) => String(item || '').trim()).filter(Boolean)
        : [];
      setWorkspaceSettings({
        profile_notes: settings.profile_notes || '',
        competitor_targets: Array.isArray(settings.competitor_targets) ? settings.competitor_targets : [],
        industry: postingPreferences.industry || '',
        brand_colors: brandColors,
        target_audience: postingPreferences.target_audience || postingPreferences.targetAudience || '',
        tone_presets: tonePresets,
        portal_title: postingPreferences.portal_title || postingPreferences.portalTitle || '',
        portal_message: postingPreferences.portal_message || postingPreferences.portalMessage || '',
        detected_context: settings.detected_context && typeof settings.detected_context === 'object'
          ? settings.detected_context
          : null,
        automation_enabled: Boolean(settings.automation_enabled),
        require_admin_approval: Boolean(settings.require_admin_approval ?? true),
        auto_generate_twitter: Boolean(settings.auto_generate_twitter ?? true),
        auto_generate_linkedin: Boolean(settings.auto_generate_linkedin ?? true),
        auto_generate_social: Boolean(settings.auto_generate_social),
        engagement_auto_reply: Boolean(settings.engagement_auto_reply),
      });
      setProfileContextForm({
        industry: postingPreferences.industry || '',
        brand_colors: brandColors.join(', '),
        target_audience: postingPreferences.target_audience || postingPreferences.targetAudience || '',
        profile_notes: settings.profile_notes || '',
        tone_presets: tonePresets,
        portal_title: postingPreferences.portal_title || postingPreferences.portalTitle || '',
        portal_message: postingPreferences.portal_message || postingPreferences.portalMessage || '',
      });
      setProfileContextEditing(false);
      setWorkspaceCompetitorsInput(
        Array.isArray(settings.competitor_targets) ? settings.competitor_targets.join(', ') : ''
      );
    } catch (error) {
      if (!silent) {
        toast.error(error?.response?.data?.error || 'Failed to load workspace settings');
      }
    }
  };

  const loadApprovalLink = async ({ silent = false } = {}) => {
    if (!canApproveOrPublish) {
      setApprovalLink(null);
      setApprovalLinks([]);
      return;
    }

    if (!silent) setApprovalLinkLoading(true);
    try {
      const [response, linksResponse] = await Promise.all([
        api.get(`/agency/workspaces/${workspaceId}/approval-token`),
        api.get(`/agency/workspaces/${workspaceId}/approval-links`),
      ]);
      const nextApprovalLink = response?.data?.approvalUrl ? response.data : null;
      setApprovalLink(nextApprovalLink);
      setApprovalLinks(Array.isArray(linksResponse?.data?.links) ? linksResponse.data.links : []);
    } catch (error) {
      if (!silent) {
        toast.error(error?.response?.data?.error || 'Failed to load client approval link');
      }
    } finally {
      if (!silent) setApprovalLinkLoading(false);
    }
  };

  const loadInsightsSummary = async ({ silent = false } = {}) => {
    if (!silent) setInsightsLoading(true);
    try {
      const response = await api.get(`/agency/workspaces/${workspaceId}/insights/summary`);
      setInsightsSummary((response?.data?.insights) || {
        workspace: null,
        platforms: {
          twitter: null,
          linkedin: null,
          social: null,
        },
        engagement: {
          linkedin: null,
        },
        automation: null,
        generatedAt: null,
      });
    } catch (error) {
      if (!silent) {
        toast.error(error?.response?.data?.error || 'Failed to load workspace insights');
      }
    } finally {
      if (!silent) setInsightsLoading(false);
    }
  };

  const loadAnalysisSummary = async ({ silent = false, forceRefresh = false } = {}) => {
    if (!silent) setAnalysisLoading(true);
    try {
      const response = await api.get(`/agency/workspaces/${workspaceId}/analysis/summary`, {
        params: forceRefresh ? { refresh: true } : undefined,
      });
      setAnalysisSummary((response?.data?.analysis) || EMPTY_ANALYSIS_SUMMARY);
    } catch (error) {
      if (!silent) {
        toast.error(error?.response?.data?.error || 'Failed to load workspace analysis');
      }
    } finally {
      if (!silent) setAnalysisLoading(false);
    }
  };

  const loadOperationsSnapshot = async ({ silent = false } = {}) => {
    if (!silent) setOperationsLoading(true);
    try {
      const response = await api.get(`/agency/workspaces/${workspaceId}/operations/snapshot`, {
        params: { limit: 60, queueLimit: 60 },
      });
      setOperationsSnapshot((previous) => ({
        summary: response?.data?.summary || previous.summary,
        queue: Array.isArray(response?.data?.queue) ? response.data.queue : [],
        calendar: Array.isArray(response?.data?.calendar) ? response.data.calendar : [],
        sources: Array.isArray(response?.data?.sources) ? response.data.sources : [],
      }));
    } catch (error) {
      if (!silent) {
        toast.error(error?.response?.data?.error || 'Failed to load workspace operations');
      }
    } finally {
      if (!silent) setOperationsLoading(false);
    }
  };

  const loadAgencyMembers = async ({ silent = false } = {}) => {
    try {
      const response = await api.get('/agency/members');
      setAgencyMembers(Array.isArray(response?.data?.members) ? response.data.members : []);
    } catch (error) {
      if (!silent) {
        toast.error(error?.response?.data?.error || 'Failed to load agency members');
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      setLoadedDataKeys(new Set());
      const [agencyContextRes, workspaceRes, membersRes, availableAccRes, attachedAccRes, teamPermissionsRes] = await Promise.all([
        api.get('/agency/context').catch(() => null),
        api.get(`/agency/workspaces/${workspaceId}`),
        api.get(`/agency/workspaces/${workspaceId}/members`),
        api.get('/agency/accounts/available'),
        api.get(`/agency/workspaces/${workspaceId}/accounts`),
        api.get('/pro-team/permissions').catch(() => null),
      ]);

      const currentWorkspace = workspaceRes?.data?.workspace || null;
      if (!currentWorkspace) {
        toast.error('Workspace not found');
        navigate('/agency');
        return;
      }

      setAgencyContext(agencyContextRes?.data || null);
      setWorkspace({
        ...currentWorkspace,
        currentMemberRole: membersRes.data?.currentMemberRole || currentWorkspace.currentMemberRole || agencyContextRes?.data?.member?.role || null,
      });
      setProfileForm({
        name: currentWorkspace.name || '',
        brand_name: currentWorkspace.brand_name || '',
        timezone: currentWorkspace.timezone || '',
        logo_url: currentWorkspace.logo_url || '',
      });
      setProfileEditing(false);
      const assignedMembersRows = membersRes.data.assignedMembers || [];
      const availableMembersRows = membersRes.data.availableMembers || [];
      const effectiveAssignedIds = availableMembersRows
        .filter((item) => item?.is_assigned)
        .map((item) => item.id);
      setAssignedMembers(assignedMembersRows);
      setAvailableMembers(availableMembersRows);
      setSelectedMemberIds(effectiveAssignedIds.length > 0 ? effectiveAssignedIds : assignedMembersRows.map((item) => item.id));
      setSeatUsage(Math.max(
        Number(membersRes.data?.assignedUsage || 0),
        assignedMembersRows.length,
        effectiveAssignedIds.length,
      ));
      setSeatLimit(Number(membersRes.data?.memberLimit || 5));
      setAvailableAccounts(availableAccRes.data.accounts || []);
      setAttachedAccounts(attachedAccRes.data.accounts || []);
      setTeamPermissions(teamPermissionsRes?.data?.success ? teamPermissionsRes.data : null);

      // Let the workspace shell render immediately, then hydrate heavier panels in the background.
      setLoading(false);

      Promise.allSettled([
        loadOperationsSnapshot({ silent: true }),
        loadWorkspaceDrafts({ silent: true }),
        loadAnalyticsSummary({ silent: true }),
        loadWorkspaceSettings({ silent: true }),
      ]).then(() => {
        setLoadedDataKeys(new Set(['operations', 'drafts', 'analytics', 'settings']));
      });
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to load workspace');
    }

    setLoading(false);
  };

  const ensureTabData = async (tabKey) => {
    try {
      const requirements = TAB_DATA_REQUIREMENTS[tabKey] || [];
      const nextLoaders = [];

      if (requirements.includes('members') && !loadedDataKeys.has('members')) {
        nextLoaders.push(loadAgencyMembers({ silent: true }).then(() => 'members'));
      }
      if (requirements.includes('approval') && !loadedDataKeys.has('approval') && canApproveOrPublish) {
        nextLoaders.push(loadApprovalLink({ silent: true }).then(() => 'approval'));
      }
      if (requirements.includes('analysis') && !loadedDataKeys.has('analysis')) {
        nextLoaders.push(loadAnalysisSummary({ silent: true }).then(() => 'analysis'));
      }
      if (requirements.includes('insights') && !loadedDataKeys.has('insights')) {
        nextLoaders.push(loadInsightsSummary({ silent: true }).then(() => 'insights'));
      }

      if (nextLoaders.length === 0) return;

      const settled = await Promise.allSettled(nextLoaders);
      setLoadedDataKeys((previous) => {
        const next = new Set(previous);
        settled.forEach((entry) => {
          if (entry.status === 'fulfilled' && entry.value) {
            next.add(entry.value);
          }
        });
        return next;
      });
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to prepare workspace tab');
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    if (activeWorkspaceTab !== 'calendar') return;
    loadQueueDrafts({ statusView: draftStatusFilter });
  }, [workspaceId, draftStatusFilter, activeWorkspaceTab]);

  useEffect(() => {
    if (!workspaceId) return;
    ensureTabData(activeWorkspaceTab);
  }, [workspaceId, activeWorkspaceTab, canApproveOrPublish]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const requestedTab = String(params.get('tab') || '').trim().toLowerCase();
    if (requestedTab && WORKSPACE_SECTION_DEFINITIONS.some((section) => section.key === requestedTab)) {
      setActiveWorkspaceTab(requestedTab);
    }

    const selectLinkedIn = params.get('select_linkedin_account');
    const selectionId = params.get('selectionId');
    const organizationsParam = params.get('organizations');
    const personalConnected = params.get('personalConnected') === 'true';
    const userName = params.get('userName');

    if (selectLinkedIn === 'true' && selectionId && organizationsParam) {
      try {
        const organizations = JSON.parse(decodeURIComponent(organizationsParam));
        setLinkedInSelectionData({
          selectionId,
          organizations: Array.isArray(organizations) ? organizations : [],
          personalConnected,
          userName,
        });
        setShowLinkedInSelection(true);
        setActiveWorkspaceTab('connections');
      } catch (error) {
        console.error('Failed to parse LinkedIn organizations for workspace callback:', error);
        toast.error('Failed to load LinkedIn account options.');
      }

      params.delete('select_linkedin_account');
      params.delete('selectionId');
      params.delete('organizations');
      params.delete('personalConnected');
      params.delete('userName');
      const search = params.toString();
      navigate(
        {
          pathname: `/agency/workspaces/${workspaceId}`,
          search: search ? `?${search}` : '',
        },
        { replace: true }
      );
      return;
    }

    const success = params.get('success');
    const error = params.get('error');
    const username = params.get('username');
    if (!success && !error) return;

    if (success) {
      toast.success(
        username
          ? `${username} connected successfully. Add it to this workspace below.`
          : 'Channel connected successfully. Add it to this workspace below.'
      );
    } else if (error) {
      toast.error(`Connection failed: ${error.replace(/_/g, ' ')}`);
    }

    params.delete('success');
    params.delete('error');
    params.delete('username');
    const search = params.toString();
    navigate(
      {
        pathname: `/agency/workspaces/${workspaceId}`,
        search: search ? `?${search}` : '',
      },
      { replace: true }
    );
  }, [navigate, workspaceId]);

  useEffect(() => {
    const activeIds = attachedAccounts.map((account) => account.id);
    setPublisherTargets((previous) => {
      const kept = previous.filter((id) => activeIds.includes(id));
      if (kept.length > 0) return kept;
      return activeIds;
    });
  }, [attachedAccounts]);

  useEffect(() => {
    if (generationModeOptions.length === 0) return;
    setSelectedGenerationModes((previous) => {
      const validKeys = generationModeOptions.map((mode) => mode.key);
      const kept = previous.filter((mode) => validKeys.includes(mode));
      if (kept.length > 0) return kept;
      return [generationModeOptions[0].key];
    });
  }, [generationModeOptions]);

  useEffect(() => {
    if (generationToneOptions.length === 0) return;
    const hasCurrentTone = generationToneOptions.some((option) => option.value === generationStyle);
    if (!hasCurrentTone) {
      setGenerationStyle(generationToneOptions[0].value);
    }
  }, [generationToneOptions, generationStyle]);

  useEffect(() => {
    if (!hasComposerContent) {
      setShowPromptInput(true);
    }
  }, [hasComposerContent]);

  useEffect(() => {
    const validIds = new Set(workspaceDrafts.map((draft) => String(draft.id)));
    setSelectedDraftIds((previous) => previous.filter((id) => validIds.has(String(id))));
  }, [workspaceDrafts]);

  useEffect(() => {
    const firstCalendarItem = (operationsSnapshot.calendar || []).find((item) =>
      getCalendarMonthKey(item?.scheduledFor || item?.createdAt)
    );

    if (!firstCalendarItem) {
      setSelectedCalendarDateKey('');
      return;
    }

    const firstMonthKey = getCalendarMonthKey(firstCalendarItem?.scheduledFor || firstCalendarItem?.createdAt);
    const hasVisibleMonthItems = [...calendarItemsByDate.keys()].some((dateKey) => dateKey.startsWith(calendarMonthCursor));

    if (!hasVisibleMonthItems && firstMonthKey) {
      setCalendarMonthCursor(firstMonthKey);
    }

    setSelectedCalendarDateKey((previous) => {
      if (previous && calendarItemsByDate.has(previous)) {
        return previous;
      }
      return [...calendarItemsByDate.keys()][0] || '';
    });
  }, [calendarItemsByDate, calendarMonthCursor, operationsSnapshot.calendar]);

  const saveOverview = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    try {
      await api.patch(`/agency/workspaces/${workspaceId}`, {
        name: profileForm.name,
        brand_name: profileForm.brand_name,
        timezone: profileForm.timezone,
        logo_url: profileForm.logo_url,
      });
      setProfileEditing(false);
      toast.success('Workspace identity saved');
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to update workspace');
    } finally {
      setProfileSaving(false);
    }
  };

  const saveAssignments = async () => {
    try {
      await api.put(`/agency/workspaces/${workspaceId}/members`, { memberIds: selectedMemberIds });
      toast.success('Workspace access updated');
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to update assignments');
    }
  };

  const attachAccount = async (account) => {
    try {
      await api.post(`/agency/workspaces/${workspaceId}/accounts`, account);
      toast.success('Account attached');
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to attach account');
    }
  };

  const detachAccount = async (accountId) => {
    try {
      await api.delete(`/agency/workspaces/${workspaceId}/accounts/${accountId}`);
      toast.success('Account detached');
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to detach account');
    }
  };

  const connectWorkspacePlatform = async (platform) => {
    if (!canMutate) return;
    setConnectingPlatform(platform);
    try {
      const returnUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/agency/workspaces/${workspaceId}?tab=connections`
        : `/agency/workspaces/${workspaceId}?tab=connections`;
      const response = await api.post('/pro-team/social-accounts/connect', {
        platform,
        returnUrl,
      });
      const redirectUrl = response?.data?.redirectUrl;
      if (!redirectUrl) {
        throw new Error('Missing redirect URL');
      }
      window.location.href = redirectUrl;
    } catch (error) {
      toast.error(error?.response?.data?.error || `Failed to connect ${platform}`);
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleLinkedInSelection = async (accountType, organizationId = null) => {
    if (!linkedInSelectionData) return;

    setSelectingLinkedInAccount(true);
    try {
      const linkedinApiUrl = import.meta.env.VITE_LINKEDIN_API_URL || (
        import.meta.env.MODE === 'production'
          ? 'https://apilinkedin.suitegenie.in'
          : 'http://localhost:3004'
      );

      const headers = {
        'Content-Type': 'application/json',
      };
      const csrfToken = await fetchCsrfToken().catch(() => null);
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${linkedinApiUrl}/api/oauth/linkedin/complete-team-selection`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          selectionId: linkedInSelectionData.selectionId,
          accountType,
          organizationId,
        }),
        credentials: 'include',
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to complete LinkedIn account selection.');
      }

      setShowLinkedInSelection(false);
      setLinkedInSelectionData(null);
      setActiveWorkspaceTab('connections');
      toast.success(
        accountType === 'organization'
          ? 'LinkedIn page connected. Add it to this workspace below.'
          : 'LinkedIn profile connected. Add it to this workspace below.'
      );
      await loadData();
    } catch (error) {
      console.error('Failed to complete LinkedIn workspace selection:', error);
      toast.error(error?.message || 'Failed to connect LinkedIn account.');
    } finally {
      setSelectingLinkedInAccount(false);
    }
  };

  const inviteAgencyMember = async (event) => {
    event.preventDefault();
    const email = String(inviteEmail || '').trim();
    if (!email) {
      toast.error('Enter an email to invite');
      return;
    }

    setInviteSending(true);
    try {
      await api.post('/agency/members/invite', {
        email,
        role: inviteRole,
      });
      toast.success(`Invitation sent to ${email}`);
      setInviteEmail('');
      setInviteRole('editor');
      await Promise.all([
        loadAgencyMembers({ silent: true }),
        loadData(),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to invite member');
    } finally {
      setInviteSending(false);
    }
  };

  const updateStatus = async (status) => {
    try {
      await api.post(`/agency/workspaces/${workspaceId}/status`, { status });
      toast.success(`Workspace moved to ${status}`);
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to change status');
    }
  };

  const confirmArchiveWorkspace = async () => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        `Archive ${workspace?.name || 'this workspace'}? This will stop active work but keep its history.`
      );
      if (!confirmed) return;
    }
    await updateStatus('archived');
  };

  const publishFromWorkspace = async () => {
    const normalizedContent = String(publisherContent || '').trim();
    const media = uploadedMedia.map((item) => item.url).filter(Boolean);

    if (!normalizedContent) {
      toast.error('Write content before publishing');
      return;
    }

    if (!Array.isArray(publisherTargets) || publisherTargets.length === 0) {
      toast.error('Select at least one attached account');
      return;
    }

    if (!canApproveOrPublish) {
      toast.error('Only owner/admin can publish directly. Save this as a draft for approval instead.');
      return;
    }

    let createdDraft = null;
    setDraftActionKey('publish-composer');
    setPublishing(true);
    try {
      createdDraft = await createWorkspaceDraftFromComposer({
        title: `${workspace?.name || 'Workspace'} publish-ready post`,
        content: normalizedContent,
        mediaUrls: media,
        targetWorkspaceAccountIds: publisherTargets,
        generationSource: 'manual',
        submissionAction: 'approved',
        generationMetadata: showTwitterThreadPreview
          ? {
              postMode: 'thread',
              threadParts: twitterThreadParts,
            }
          : {
              postMode: 'single',
            },
      });
      const response = await api.post(`/agency/workspaces/${workspaceId}/drafts/${createdDraft.id}/publish`, {
        postMode: showTwitterThreadPreview ? 'thread' : 'single',
        threadParts: showTwitterThreadPreview ? twitterThreadParts : [],
      });

      const results = Array.isArray(response?.data?.results)
        ? response.data.results.map((result, index) => ({
            ...result,
            id: `draft:${createdDraft.id}:${Date.now()}:${index}:${result.workspaceAccountId || result.platform || 'unknown'}`,
            draftId: createdDraft.id,
            origin: 'draft',
            createdAt: new Date().toISOString(),
          }))
        : [];
      setPublishResults(results);
      const summary = response?.data?.summary || {
        successCount: results.filter((result) => result.status === 'posted').length,
        failedCount: results.filter((result) => result.status === 'failed').length,
      };

      if (Number(summary.successCount || 0) > 0) {
        toast.success(`Published to ${summary.successCount} account${summary.successCount === 1 ? '' : 's'}`);
      }
      if (Number(summary.failedCount || 0) > 0) {
        toast.error(`${summary.failedCount} publish attempt${summary.failedCount === 1 ? '' : 's'} failed`);
      }
      resetComposerState();
      await Promise.all([
        loadOperationsSnapshot({ silent: true }),
        loadWorkspaceDrafts({ silent: true }),
        loadAnalyticsSummary({ silent: true }),
        loadInsightsSummary({ silent: true }),
      ]);
    } catch (error) {
      const fallbackMessage = createdDraft?.id
        ? 'Draft was created, but publishing failed'
        : 'Failed to publish';
      toast.error(error?.response?.data?.error || fallbackMessage);
      if (createdDraft?.id) {
        await Promise.all([
          loadOperationsSnapshot({ silent: true }),
          loadWorkspaceDrafts({ silent: true }),
          loadAnalyticsSummary({ silent: true }),
          loadInsightsSummary({ silent: true }),
        ]);
      }
    } finally {
      setDraftActionKey(null);
      setPublishing(false);
    }
  };

  const loadQueueDrafts = async ({ silent = false, statusView = draftStatusFilter } = {}) => {
    if (!silent) setDraftsLoading(true);
    try {
      const response = await api.get(`/agency/workspaces/${workspaceId}/drafts`, {
        params: {
          statusView,
        },
      });
      if (response?.data?.currentMemberRole) {
        setWorkspace((previous) => (
          previous
            ? { ...previous, currentMemberRole: response.data.currentMemberRole }
            : previous
        ));
      }
      setQueueDrafts(Array.isArray(response?.data?.drafts) ? response.data.drafts : []);
      setDraftScheduleById((previous) => {
        const next = { ...previous };
        (response?.data?.drafts || []).forEach((draft) => {
          next[draft.id] = next[draft.id] || formatDateTimeInputValue(draft.scheduled_for);
        });
        return next;
      });
    } catch (error) {
      if (!silent) {
        toast.error(error?.response?.data?.error || 'Failed to load queue drafts');
      }
    } finally {
      if (!silent) setDraftsLoading(false);
    }
  };

  const createApprovalLink = async () => {
    if (!canApproveOrPublish) return;
    setApprovalLinkCreating(true);
    try {
      const response = await api.post(`/agency/workspaces/${workspaceId}/approval-token`, {
        label: String(approvalLinkLabel || '').trim() || `${workspace?.brand_name || workspace?.name || 'Client'} approval link`,
      });
      setApprovalLink(response?.data || null);
      setApprovalLinkLabel('');
      await loadApprovalLink({ silent: true });
      toast.success('Client approval link ready');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to create client approval link');
    } finally {
      setApprovalLinkCreating(false);
    }
  };

  const copyApprovalLink = async (value = approvalLink?.approvalUrl) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Approval link copied');
    } catch (error) {
      toast.error('Failed to copy the approval link');
    }
  };

  const revokeApprovalLink = async (tokenId) => {
    if (!tokenId || !canApproveOrPublish) return;
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Revoke this client approval link? People using it will lose access immediately.');
      if (!confirmed) return;
    }

    setApprovalLinkRevokingId(String(tokenId));
    try {
      await api.delete(`/agency/workspaces/${workspaceId}/approval-link/${tokenId}`);
      await loadApprovalLink({ silent: true });
      toast.success('Approval link revoked');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to revoke approval link');
    } finally {
      setApprovalLinkRevokingId('');
    }
  };

  const addDraftComment = async (draftId) => {
    const comment = String(draftCommentById[draftId] || '').trim();
    if (!comment) {
      toast.error('Write a comment first');
      return;
    }

    setDraftActionKey(`comment:${draftId}`);
    try {
      const response = await api.post(`/agency/workspaces/${workspaceId}/drafts/${draftId}/comments`, {
        comment,
      });
      const nextComment = response?.data?.comment || null;
      if (nextComment) {
        setWorkspaceDrafts((previous) => previous.map((draft) => (
          String(draft.id) === String(draftId)
            ? { ...draft, comments: [...(Array.isArray(draft.comments) ? draft.comments : []), nextComment] }
            : draft
        )));
        setQueueDrafts((previous) => previous.map((draft) => (
          String(draft.id) === String(draftId)
            ? { ...draft, comments: [...(Array.isArray(draft.comments) ? draft.comments : []), nextComment] }
            : draft
        )));
      }
      setDraftCommentById((previous) => ({ ...previous, [draftId]: '' }));
      toast.success('Comment added');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to add comment');
    } finally {
      setDraftActionKey(null);
    }
  };

  const resetComposerState = () => {
    setPublisherContent('');
    setGenerationPrompt('');
    setUploadedMedia([]);
    setGeneratedVariants([]);
    setComposerScheduleFor('');
    setShowPromptInput(true);
  };

  const createWorkspaceDraftFromComposer = async ({
    title,
    content,
    targetWorkspaceAccountIds,
    mediaUrls,
    submissionAction = 'approval',
    generationSource = 'manual',
    generationMetadata = {},
  }) => {
    const response = await api.post(`/agency/workspaces/${workspaceId}/drafts`, {
      title,
      content,
      mediaUrls,
      targetWorkspaceAccountIds,
      generationSource,
      generationMetadata,
      submissionAction,
    });
    return response?.data?.draft || null;
  };

  const sendComposerForApproval = async () => {
    if (!canWrite) {
      toast.error('Only owner/admin/editor can create or submit drafts in this workspace');
      return;
    }

    const normalizedContent = String(publisherContent || '').trim();
    const media = uploadedMedia.map((item) => item.url).filter(Boolean);

    if (!normalizedContent) {
      toast.error('Write content before sending it for approval');
      return;
    }

    if (!Array.isArray(publisherTargets) || publisherTargets.length === 0) {
      toast.error('Select at least one target before sending for approval');
      return;
    }

    setDraftActionKey('create-manual-approval');
    try {
      await createWorkspaceDraftFromComposer({
        title: `${workspace?.name || 'Workspace'} draft`,
        content: normalizedContent,
        mediaUrls: media,
        targetWorkspaceAccountIds: publisherTargets,
        generationSource: 'manual',
        submissionAction: 'approval',
        generationMetadata: showTwitterThreadPreview
          ? {
              postMode: 'thread',
              threadParts: twitterThreadParts,
            }
          : {
              postMode: 'single',
            },
      });
      toast.success('Sent for approval');
      resetComposerState();
      await Promise.all([
        loadWorkspaceDrafts({ silent: true }),
        loadOperationsSnapshot({ silent: true }),
        loadAnalyticsSummary({ silent: true }),
        loadInsightsSummary({ silent: true }),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to send for approval');
    } finally {
      setDraftActionKey(null);
    }
  };

  const scheduleComposerContent = async () => {
    const normalizedContent = String(publisherContent || '').trim();
    const media = uploadedMedia.map((item) => item.url).filter(Boolean);

    if (!canApproveOrPublish) {
      toast.error('Only owner/admin can schedule directly from the composer');
      return;
    }

    if (!normalizedContent) {
      toast.error('Write content before scheduling it');
      return;
    }

    if (!Array.isArray(publisherTargets) || publisherTargets.length === 0) {
      toast.error('Select at least one target before scheduling');
      return;
    }

    if (!composerScheduleFor) {
      toast.error('Pick a future date and time first');
      return;
    }

    const scheduledDate = new Date(composerScheduleFor);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
      toast.error('Choose a future date and time for scheduling');
      return;
    }

    let createdDraft = null;
    setDraftActionKey('schedule-composer');
    try {
      createdDraft = await createWorkspaceDraftFromComposer({
        title: `${workspace?.name || 'Workspace'} scheduled post`,
        content: normalizedContent,
        mediaUrls: media,
        targetWorkspaceAccountIds: publisherTargets,
        generationSource: 'manual',
        submissionAction: 'approved',
        generationMetadata: showTwitterThreadPreview
          ? {
              postMode: 'thread',
              threadParts: twitterThreadParts,
            }
          : {
              postMode: 'single',
            },
      });

      await api.post(`/agency/workspaces/${workspaceId}/drafts/${createdDraft.id}/schedule`, {
        scheduledFor: scheduledDate.toISOString(),
        postMode: showTwitterThreadPreview ? 'thread' : 'single',
        threadParts: showTwitterThreadPreview ? twitterThreadParts : [],
      });

      toast.success('Saved and scheduled');
      resetComposerState();
      await Promise.all([
        loadWorkspaceDrafts({ silent: true }),
        loadOperationsSnapshot({ silent: true }),
        loadAnalyticsSummary({ silent: true }),
        loadInsightsSummary({ silent: true }),
      ]);
    } catch (error) {
      const fallbackMessage = createdDraft?.id
        ? 'Draft was created, but scheduling failed'
        : 'Failed to schedule content';
      toast.error(error?.response?.data?.error || fallbackMessage);
      if (createdDraft?.id) {
        await Promise.all([
          loadWorkspaceDrafts({ silent: true }),
          loadOperationsSnapshot({ silent: true }),
          loadAnalyticsSummary({ silent: true }),
          loadInsightsSummary({ silent: true }),
        ]);
      }
    } finally {
      setDraftActionKey(null);
    }
  };

  const generateWorkspaceDrafts = async () => {
    const prompt = String(generationPrompt || '').trim();
    if (prompt.length < 5) {
      toast.error('Write a more specific prompt to generate workspace drafts');
      return;
    }

    setDraftActionKey('generate');
    try {
      const response = await api.post(`/agency/workspaces/${workspaceId}/drafts/generate`, {
        prompt,
        style: generationStyle,
        generationModes: selectedGenerationModes,
      });
      const drafts = Array.isArray(response?.data?.drafts) ? response.data.drafts : [];
      const createdCount = drafts.length;
      const errors = Array.isArray(response?.data?.errors) ? response.data.errors : [];
      const hasPendingApproval = drafts.some((draft) => String(draft?.status || '').toLowerCase() === 'pending_approval');

      if (createdCount > 0) {
        toast.success(
          hasPendingApproval
            ? `Generated ${createdCount} draft${createdCount === 1 ? '' : 's'} and sent ${createdCount === 1 ? 'it' : 'them'} for approval`
            : `Generated ${createdCount} shared draft${createdCount === 1 ? '' : 's'}`
        );
      }
      if (errors.length > 0) {
        toast.error(errors[0]);
      }

      await Promise.all([
        loadWorkspaceDrafts({ silent: true }),
        loadOperationsSnapshot({ silent: true }),
        loadAnalyticsSummary({ silent: true }),
        loadInsightsSummary({ silent: true }),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to generate workspace drafts');
    } finally {
      setDraftActionKey(null);
    }
  };

  const refineWorkspaceContent = async () => {
    if (!canWrite) {
      toast.error('Only owner/admin/editor can generate or refine workspace content');
      return;
    }

    const content = String(publisherContent || '').trim();
    const prompt = String(generationPrompt || '').trim();

    if (content.length < 10 && prompt.length < 5) {
      toast.error('Add a prompt to generate new content, or paste content here to refine it');
      return;
    }

    setRefiningContent(true);
    try {
      const response = await api.post(`/agency/workspaces/${workspaceId}/drafts/refine`, {
        content,
        prompt,
        style: generationStyle,
        generationModes: selectedGenerationModes,
      });
      const variants = Array.isArray(response?.data?.variants)
        ? response.data.variants
            .map((variant) => ({
              mode: String(variant?.mode || '').trim(),
              content: String(variant?.content || '').trim(),
              provider: variant?.provider || null,
            }))
            .filter((variant) => variant.mode && variant.content)
        : [];

      if (variants.length > 1) {
        setGeneratedVariants(variants);
        toast.success(`${variants.length} platform variants are ready below`);
        return;
      }

      const refined = String(response?.data?.content || variants[0]?.content || '').trim();
      if (!refined) {
        throw new Error('Refinement returned empty content');
      }

      setGeneratedVariants([]);
      setPublisherContent(refined);
      setSelectedGenerationModes((previous) => {
        const nextMode = String(response?.data?.mode || variants[0]?.mode || previous[0] || '').trim();
        return nextMode ? [nextMode] : previous;
      });
      toast.success(response?.data?.action === 'generated' ? 'Content generated in the composer' : 'Content refined in the composer');
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to refine content');
    } finally {
      setRefiningContent(false);
    }
  };

  const toggleGenerationMode = (modeKey) => {
    setSelectedGenerationModes((previous) => {
      if (previous.includes(modeKey)) {
        if (previous.length === 1) return previous;
        return previous.filter((item) => item !== modeKey);
      }
      return [...previous, modeKey];
    });
  };

  const getVariantTargetIds = (modeKey) => {
    const allowedPlatforms =
      modeKey === 'threads'
        ? new Set(['threads', 'instagram', 'youtube', 'social'])
        : new Set([modeKey]);

    const selectedMatches = attachedAccounts
      .filter((account) => publisherTargets.includes(account.id))
      .filter((account) => allowedPlatforms.has(String(account.platform || '').toLowerCase()))
      .map((account) => account.id);

    if (selectedMatches.length > 0) {
      return selectedMatches;
    }

    return attachedAccounts
      .filter((account) => allowedPlatforms.has(String(account.platform || '').toLowerCase()))
      .map((account) => account.id);
  };

  const saveGeneratedVariantDraft = async (variant) => {
    if (!canWrite) {
      toast.error('Only owner/admin/editor can save generated variants in this workspace');
      return;
    }

    const targetWorkspaceAccountIds = getVariantTargetIds(variant.mode);
    if (targetWorkspaceAccountIds.length === 0) {
      toast.error(`No attached ${variant.mode} accounts are available for this draft`);
      return;
    }

    setDraftActionKey(`create-variant:${variant.mode}`);
    try {
      await createWorkspaceDraftFromComposer({
        title: `${workspace?.name || 'Workspace'} ${getWorkspacePlatformLabel(variant.mode)} draft`,
        content: variant.content,
        mediaUrls: uploadedMedia.map((item) => item.url).filter(Boolean),
        targetWorkspaceAccountIds,
        generationSource: variant.mode,
        generationMetadata: {
          mode: variant.mode,
          provider: variant.provider || null,
          generatedFrom: 'multi_select_variants',
          ...(variant.mode === 'twitter' && splitTextByCharacterLimit(variant.content, WORKSPACE_PLATFORM_LIMITS.twitter, 25).length > 1
            ? {
                postMode: 'thread',
                threadParts: splitTextByCharacterLimit(variant.content, WORKSPACE_PLATFORM_LIMITS.twitter, 25),
              }
            : {
                postMode: 'single',
              }),
        },
        submissionAction: 'approval',
      });
      toast.success(`${getWorkspacePlatformLabel(variant.mode)} draft sent for approval`);
      await Promise.all([
        loadWorkspaceDrafts({ silent: true }),
        loadOperationsSnapshot({ silent: true }),
        loadAnalyticsSummary({ silent: true }),
        loadInsightsSummary({ silent: true }),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.error || `Failed to save ${variant.mode} draft`);
    } finally {
      setDraftActionKey(null);
    }
  };

  const handleMediaUpload = async (event) => {
    if (!canWrite) {
      toast.error('Only owner/admin/editor can upload workspace media');
      if (event?.target) {
        event.target.value = '';
      }
      return;
    }

    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setMediaUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/agency/workspaces/${workspaceId}/media/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        if (response?.data?.media?.url) {
          uploaded.push({
            url: response.data.media.url,
            name: response.data.media.originalName || file.name,
            mimetype: response.data.media.mimetype || file.type,
            size: Number(response.data.media.size || file.size || 0),
          });
        }
      }

      if (uploaded.length > 0) {
        setUploadedMedia((previous) => [...previous, ...uploaded]);
        toast.success(`${uploaded.length} media file${uploaded.length === 1 ? '' : 's'} uploaded`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to upload media');
    } finally {
      setMediaUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removeUploadedMedia = (url) => {
    setUploadedMedia((previous) => previous.filter((item) => item.url !== url));
  };

  const saveDraftEdits = async (draft) => {
    if (!canWrite) {
      toast.error('Only owner/admin/editor can edit workspace drafts');
      return;
    }

    setDraftActionKey(`save:${draft.id}`);
    try {
      await api.patch(`/agency/workspaces/${workspaceId}/drafts/${draft.id}`, {
        title: draft.title,
        content: draft.content,
      });
      toast.success('Draft updated');
      await Promise.all([
        loadWorkspaceDrafts({ silent: true }),
        loadOperationsSnapshot({ silent: true }),
        loadAnalyticsSummary({ silent: true }),
        loadInsightsSummary({ silent: true }),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to update draft');
    } finally {
      setDraftActionKey(null);
    }
  };

  const approveDraft = async (draftId) => {
    if (!canApproveOrPublish) {
      toast.error('Only owner/admin can approve workspace drafts');
      return;
    }

    setDraftActionKey(`approve:${draftId}`);
    try {
      await api.post(`/agency/workspaces/${workspaceId}/drafts/${draftId}/approve`);
      toast.success('Draft approved');
      await Promise.all([
        loadWorkspaceDrafts({ silent: true }),
        loadOperationsSnapshot({ silent: true }),
        loadAnalyticsSummary({ silent: true }),
        loadInsightsSummary({ silent: true }),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to approve draft');
    } finally {
      setDraftActionKey(null);
    }
  };

  const rejectDraft = async (draftId, explicitReason = null) => {
    if (!canApproveOrPublish) {
      toast.error('Only owner/admin can reject workspace drafts');
      return;
    }

    const fallbackPrompt = typeof window !== 'undefined'
      ? window.prompt('Why are you rejecting this draft? This reason will be shown back to the editor.', '')
      : '';

    const normalizedReason = String(explicitReason ?? fallbackPrompt ?? '').trim();
    if (!normalizedReason) {
      toast.error('Enter a rejection reason first');
      return;
    }

    setDraftActionKey(`reject:${draftId}`);
    try {
      await api.post(`/agency/workspaces/${workspaceId}/drafts/${draftId}/reject`, {
        rejectedReason: normalizedReason,
      });
      setRejectReasonById((previous) => ({ ...previous, [draftId]: '' }));
      toast.success('Draft rejected');
      await Promise.all([
        loadWorkspaceDrafts({ silent: true }),
        loadOperationsSnapshot({ silent: true }),
        loadAnalyticsSummary({ silent: true }),
        loadInsightsSummary({ silent: true }),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to reject draft');
    } finally {
      setDraftActionKey(null);
    }
  };

  const sendDraftForApproval = async (draft) => {
    if (!canWrite) {
      toast.error('Only owner/admin/editor can send drafts for approval');
      return;
    }

    setDraftActionKey(`submit:${draft.id}`);
    try {
      await api.patch(`/agency/workspaces/${workspaceId}/drafts/${draft.id}`, {
        title: draft.title,
        content: draft.content,
        status: 'pending_approval',
      });
      toast.success('Draft sent for approval');
      await Promise.all([
        loadWorkspaceDrafts({ silent: true }),
        loadOperationsSnapshot({ silent: true }),
        loadAnalyticsSummary({ silent: true }),
        loadInsightsSummary({ silent: true }),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to send draft for approval');
    } finally {
      setDraftActionKey(null);
    }
  };

  const deleteDraft = async (draftId) => {
    if (!canWrite) {
      toast.error('Only owner/admin/editor can delete workspace drafts');
      return;
    }

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Delete this shared draft? This action cannot be undone.');
      if (!confirmed) return;
    }

    setDraftActionKey(`delete:${draftId}`);
    try {
      await api.delete(`/agency/workspaces/${workspaceId}/drafts/${draftId}`);
      toast.success('Draft deleted');
      await Promise.all([
        loadWorkspaceDrafts({ silent: true }),
        loadOperationsSnapshot({ silent: true }),
        loadAnalyticsSummary({ silent: true }),
        loadInsightsSummary({ silent: true }),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to delete draft');
    } finally {
      setDraftActionKey(null);
    }
  };

  const scheduleDraft = async (draftId) => {
    if (!canApproveOrPublish) {
      toast.error('Only owner/admin can schedule workspace drafts');
      return;
    }

    const scheduledFor = draftScheduleById[draftId];
    if (!scheduledFor) {
      toast.error('Pick a future date and time first');
      return;
    }

    setDraftActionKey(`schedule:${draftId}`);
    try {
      await api.post(`/agency/workspaces/${workspaceId}/drafts/${draftId}/schedule`, {
        scheduledFor: new Date(scheduledFor).toISOString(),
      });
      toast.success('Draft scheduled in workspace calendar');
      await Promise.all([
        loadWorkspaceDrafts({ silent: true }),
        loadOperationsSnapshot({ silent: true }),
        loadAnalyticsSummary({ silent: true }),
        loadInsightsSummary({ silent: true }),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to schedule draft');
    } finally {
      setDraftActionKey(null);
    }
  };

  const publishDraftNow = async (draftId) => {
    if (!canApproveOrPublish) {
      toast.error('Only owner/admin can publish workspace drafts');
      return;
    }

    setDraftActionKey(`publish:${draftId}`);
    try {
      const response = await api.post(`/agency/workspaces/${workspaceId}/drafts/${draftId}/publish`);
      const results = Array.isArray(response?.data?.results)
        ? response.data.results.map((result, index) => ({
            ...result,
            id: `draft:${draftId}:${Date.now()}:${index}:${result.workspaceAccountId || result.platform || 'unknown'}`,
            draftId,
            origin: 'draft',
            createdAt: new Date().toISOString(),
          }))
        : [];
      setPublishResults(results);
      toast.success('Draft published from workspace');
      await Promise.all([
        loadWorkspaceDrafts({ silent: true }),
        loadOperationsSnapshot({ silent: true }),
        loadAnalyticsSummary({ silent: true }),
        loadInsightsSummary({ silent: true }),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to publish draft');
    } finally {
      setDraftActionKey(null);
    }
  };

  const retryPublishHistoryEntry = async (entry) => {
    if (!entry) return;

    if (entry.origin === 'draft' && entry.draftId) {
      await publishDraftNow(entry.draftId);
      return;
    }

    if (entry.origin === 'composer' && entry.retryPayload) {
      setPublishing(true);
      try {
        const response = await api.post(`/agency/workspaces/${workspaceId}/publish`, entry.retryPayload);
        const results = Array.isArray(response?.data?.results)
          ? response.data.results.map((result, index) => ({
              ...result,
              id: `composer-retry:${Date.now()}:${index}:${result.workspaceAccountId || result.platform || 'unknown'}`,
              origin: 'composer',
              createdAt: new Date().toISOString(),
              retryPayload: {
                ...entry.retryPayload,
                targetWorkspaceAccountIds: result.workspaceAccountId ? [result.workspaceAccountId] : entry.retryPayload.targetWorkspaceAccountIds,
              },
            }))
          : [];
        setPublishResults(results);
        toast.success('Retry attempted');
        await Promise.all([
          loadOperationsSnapshot({ silent: true }),
          loadWorkspaceDrafts({ silent: true }),
          loadAnalyticsSummary({ silent: true }),
          loadInsightsSummary({ silent: true }),
        ]);
      } catch (error) {
        toast.error(error?.response?.data?.error || 'Failed to retry publish');
      } finally {
        setPublishing(false);
      }
    }
  };

  const bulkApproveDrafts = async () => {
    if (!canApproveOrPublish || selectedFilteredDraftIds.length === 0) return;

    setDraftActionKey('bulk-approve');
    try {
      const results = await Promise.allSettled(
        selectedFilteredDraftIds.map((draftId) => api.post(`/agency/workspaces/${workspaceId}/drafts/${draftId}/approve`))
      );
      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failureCount = results.length - successCount;
      setSelectedDraftIds([]);
      if (successCount > 0) {
        toast.success(`Approved ${successCount} draft${successCount === 1 ? '' : 's'}`);
      }
      if (failureCount > 0) {
        toast.error(`${failureCount} draft${failureCount === 1 ? '' : 's'} could not be approved`);
      }
      await Promise.all([
        loadWorkspaceDrafts({ silent: true }),
        loadOperationsSnapshot({ silent: true }),
        loadAnalyticsSummary({ silent: true }),
        loadInsightsSummary({ silent: true }),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to bulk approve drafts');
    } finally {
      setDraftActionKey(null);
    }
  };

  const bulkDeleteDrafts = async () => {
    if (!canWrite) {
      toast.error('Only owner/admin/editor can delete workspace drafts');
      return;
    }

    if (selectedFilteredDraftIds.length === 0) return;
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`Delete ${selectedFilteredDraftIds.length} selected draft${selectedFilteredDraftIds.length === 1 ? '' : 's'}? This cannot be undone.`);
      if (!confirmed) return;
    }

    setDraftActionKey('bulk-delete');
    try {
      const results = await Promise.allSettled(
        selectedFilteredDraftIds.map((draftId) => api.delete(`/agency/workspaces/${workspaceId}/drafts/${draftId}`))
      );
      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failureCount = results.length - successCount;
      setSelectedDraftIds([]);
      if (successCount > 0) {
        toast.success(`Deleted ${successCount} draft${successCount === 1 ? '' : 's'}`);
      }
      if (failureCount > 0) {
        toast.error(`${failureCount} draft${failureCount === 1 ? '' : 's'} could not be deleted`);
      }
      await Promise.all([
        loadWorkspaceDrafts({ silent: true }),
        loadOperationsSnapshot({ silent: true }),
        loadAnalyticsSummary({ silent: true }),
        loadInsightsSummary({ silent: true }),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to bulk delete drafts');
    } finally {
      setDraftActionKey(null);
    }
  };

  const saveProfileContext = async () => {
    setSettingsSaving(true);
    try {
      await api.put(`/agency/workspaces/${workspaceId}/settings`, {
        profileNotes: profileContextForm.profile_notes,
        competitorTargets: Array.isArray(workspaceSettings.competitor_targets) ? workspaceSettings.competitor_targets : [],
        automationEnabled: workspaceSettings.automation_enabled,
        requireAdminApproval: workspaceSettings.require_admin_approval,
        autoGenerateTwitter: workspaceSettings.auto_generate_twitter,
        autoGenerateLinkedin: workspaceSettings.auto_generate_linkedin,
        autoGenerateSocial: workspaceSettings.auto_generate_social,
        engagementAutoReply: workspaceSettings.engagement_auto_reply,
        industry: profileContextForm.industry,
        brandColors: String(profileContextForm.brand_colors || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        targetAudience: profileContextForm.target_audience,
        tonePresets: normalizeTonePresetEntries(profileContextForm.tone_presets),
        portalTitle: profileContextForm.portal_title,
        portalMessage: profileContextForm.portal_message,
      });
      toast.success('Client AI context saved');
      setProfileContextEditing(false);
      await Promise.all([
        loadWorkspaceSettings({ silent: true }),
        loadInsightsSummary({ silent: true }),
        loadAnalysisSummary({ silent: true }),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to save workspace settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const saveCompetitorTargets = async () => {
    if (!canWrite) {
      toast.error('Only owner/admin/editor can update competitor targets');
      return;
    }

    const competitorTargets = parseCompetitorTargetsInput(workspaceCompetitorsInput);
    setSettingsSaving(true);
    try {
      await api.put(`/agency/workspaces/${workspaceId}/settings`, {
        profileNotes: profileContextForm.profile_notes,
        competitorTargets,
        automationEnabled: workspaceSettings.automation_enabled,
        requireAdminApproval: workspaceSettings.require_admin_approval,
        autoGenerateTwitter: workspaceSettings.auto_generate_twitter,
        autoGenerateLinkedin: workspaceSettings.auto_generate_linkedin,
        autoGenerateSocial: workspaceSettings.auto_generate_social,
        engagementAutoReply: workspaceSettings.engagement_auto_reply,
        industry: profileContextForm.industry,
        brandColors: String(profileContextForm.brand_colors || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        targetAudience: profileContextForm.target_audience,
        tonePresets: normalizeTonePresetEntries(profileContextForm.tone_presets),
        portalTitle: profileContextForm.portal_title,
        portalMessage: profileContextForm.portal_message,
      });
      toast.success('Competitor watchlist saved');
      await Promise.all([
        loadWorkspaceSettings({ silent: true }),
        loadInsightsSummary({ silent: true }),
        loadAnalysisSummary({ silent: true }),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to save competitor targets');
    } finally {
      setSettingsSaving(false);
    }
  };

  const useAnalysisIdeaInComposer = (idea) => {
    const prompt = String(idea?.prompt || '').trim();
    if (!prompt) {
      toast.error('This idea is missing a compose prompt');
      return;
    }

    const availableModeKeys = new Set(generationModeOptions.map((option) => option?.key).filter(Boolean));
    const recommendedModes = Array.isArray(idea?.recommendedPlatforms)
      ? idea.recommendedPlatforms.filter((mode) => availableModeKeys.has(mode))
      : [];

    setPublisherContent('');
    setGenerationPrompt(prompt);
    setGeneratedVariants([]);
    setShowPromptInput(true);
    if (recommendedModes.length > 0) {
      setSelectedGenerationModes(recommendedModes);
      const recommendedTargets = attachedAccounts
        .filter((account) => recommendedModes.includes(String(account?.platform || '').toLowerCase()))
        .map((account) => account.id);
      if (recommendedTargets.length > 0) {
        setPublisherTargets(recommendedTargets);
      }
    }
    setActiveWorkspaceTab('compose');
    focusSection('compose');
    toast.success('Idea moved into Compose');
  };

  const retryFailedDraft = async (draftId) => {
    if (!canApproveOrPublish) {
      toast.error('Only owner/admin can retry failed publishes');
      return;
    }

    setDraftActionKey(`retry:${draftId}`);
    try {
      await publishDraftNow(draftId);
    } finally {
      setDraftActionKey(null);
    }
  };

  const cancelProfileEditing = () => {
    setProfileForm({
      name: workspace?.name || '',
      brand_name: workspace?.brand_name || '',
      timezone: workspace?.timezone || '',
      logo_url: workspace?.logo_url || '',
    });
    setProfileEditing(false);
  };

  const cancelProfileContextEditing = () => {
    setProfileContextForm({
      industry: workspaceSettings.industry || '',
      brand_colors: Array.isArray(workspaceSettings.brand_colors) ? workspaceSettings.brand_colors.join(', ') : '',
      target_audience: workspaceSettings.target_audience || '',
      profile_notes: workspaceSettings.profile_notes || '',
      tone_presets: normalizeTonePresetEntries(workspaceSettings.tone_presets),
      portal_title: workspaceSettings.portal_title || '',
      portal_message: workspaceSettings.portal_message || '',
    });
    setProfileContextEditing(false);
  };

  const addTonePresetRow = () => {
    setProfileContextForm((previous) => {
      if ((previous.tone_presets || []).length >= 5) return previous;
      return {
        ...previous,
        tone_presets: [...(previous.tone_presets || []), { name: '', guidance: '' }],
      };
    });
  };

  const updateTonePresetRow = (index, field, value) => {
    setProfileContextForm((previous) => ({
      ...previous,
      tone_presets: (previous.tone_presets || []).map((preset, presetIndex) => (
        presetIndex === index ? { ...preset, [field]: value } : preset
      )),
    }));
  };

  const removeTonePresetRow = (index) => {
    setProfileContextForm((previous) => ({
      ...previous,
      tone_presets: (previous.tone_presets || []).filter((_, presetIndex) => presetIndex !== index),
    }));
  };

  if (loading) return <div className="text-gray-600">Loading workspace...</div>;
  if (!workspace) return null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_38%,_#eef2f7_100%)]">
      <div className="mx-auto w-full max-w-[1760px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="min-w-0 space-y-6">
          <AgencyWorkspaceShell
            workspace={workspace}
            workspaceStatusMeta={workspaceStatusMeta}
            attachedAccounts={attachedAccounts}
            workspaceDrafts={workspaceDrafts}
            analyticsSummary={analyticsSummary}
            pendingApprovalCount={pendingApprovalCount}
            lastActiveAt={lastActiveAt}
            formatDateTime={formatDateTime}
            formatMetric={formatMetric}
            workspaceCompletionPercent={workspaceCompletionPercent}
            workspaceCompletionCount={workspaceCompletionCount}
            workspaceChecklist={workspaceChecklist}
            nextRecommendedAction={nextRecommendedAction}
            activeWorkspaceTab={activeWorkspaceTab}
            focusSection={focusSection}
            onBackToHub={() => navigate('/agency')}
          />

      {isWorkspaceTab('overview') && (
        <AgencyWorkspaceOverviewTab
          workspace={workspace}
          profileForm={profileForm}
          workspaceStatusMeta={workspaceStatusMeta}
          attachedAccounts={attachedAccounts}
          lastActiveAt={lastActiveAt}
          formatDateTime={formatDateTime}
          formatMetric={formatMetric}
          pendingApprovalCount={pendingApprovalCount}
          openPendingApprovals={openPendingApprovals}
          openFailedSources={openFailedSources}
          sourceFailedCount={sourceFailedCount}
          workspaceControlMetrics={workspaceControlMetrics}
          recentActivityEntries={recentActivityEntries}
          focusSection={focusSection}
        />
      )}


      {isWorkspaceTab('setup') && (
        <AgencyWorkspaceSetupTab
          workspace={workspace}
          canApproveOrPublish={canApproveOrPublish}
          profileEditing={profileEditing}
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          profileSaving={profileSaving}
          canMutate={canMutate}
          saveOverview={saveOverview}
          cancelProfileEditing={cancelProfileEditing}
          workspaceSettings={workspaceSettings}
          profileContextEditing={profileContextEditing}
          setProfileContextEditing={setProfileContextEditing}
          profileContextForm={profileContextForm}
          setProfileContextForm={setProfileContextForm}
          settingsSaving={settingsSaving}
          addTonePresetRow={addTonePresetRow}
          updateTonePresetRow={updateTonePresetRow}
          removeTonePresetRow={removeTonePresetRow}
          saveProfileContext={saveProfileContext}
          cancelProfileContextEditing={cancelProfileContextEditing}
          formatMetric={formatMetric}
          approvalLink={approvalLink}
          approvalLinks={approvalLinks}
          approvalLinkLoading={approvalLinkLoading}
          approvalLinkCreating={approvalLinkCreating}
          approvalLinkRevokingId={approvalLinkRevokingId}
          approvalLinkLabel={approvalLinkLabel}
          setApprovalLinkLabel={setApprovalLinkLabel}
          createApprovalLink={createApprovalLink}
          refreshApprovalLink={() => loadApprovalLink()}
          copyApprovalLink={copyApprovalLink}
          revokeApprovalLink={revokeApprovalLink}
          updateStatus={updateStatus}
          confirmArchiveWorkspace={confirmArchiveWorkspace}
        />
      )}

      {isWorkspaceTab('analysis') && (
        <AgencyWorkspaceAnalysisTab
          analysisSummary={analysisSummary}
          analysisLoading={analysisLoading}
          analysisQueuePressureMeta={analysisQueuePressureMeta}
          formatDateTime={formatDateTime}
          formatMetric={formatMetric}
          loadAnalysisSummary={loadAnalysisSummary}
          workspaceCompetitorsInput={workspaceCompetitorsInput}
          setWorkspaceCompetitorsInput={setWorkspaceCompetitorsInput}
          canWrite={canWrite}
          settingsSaving={settingsSaving}
          saveCompetitorTargets={saveCompetitorTargets}
          useAnalysisIdeaInComposer={useAnalysisIdeaInComposer}
        />
      )}
      {isWorkspaceTab('analytics') && (
        <AgencyWorkspaceAnalyticsTab
          insightsSummary={insightsSummary}
          formatDateTime={formatDateTime}
          loadInsightsSummary={loadInsightsSummary}
          insightsLoading={insightsLoading}
          formatMetric={formatMetric}
          operationsSnapshot={operationsSnapshot}
          focusSection={focusSection}
          analyticsSummary={analyticsSummary}
          publishedCount={publishedCount}
          failedCount={failedCount}
          pendingApprovalCount={pendingApprovalCount}
          activeAccountCount={activeAccountCount}
          sourceHealthyCount={sourceHealthyCount}
          sourceFailedCount={sourceFailedCount}
          socialConnectedCount={socialConnectedCount}
        />
      )}

      {isWorkspaceTab('compose') && (
        <AgencyWorkspaceComposeTab
          workspace={workspace}
          canWrite={canWrite}
          currentWorkspaceRole={currentWorkspaceRole}
          attachedAccounts={attachedAccounts}
          selectedTargetAccounts={selectedTargetAccounts}
          setActiveWorkspaceTab={setActiveWorkspaceTab}
          generationStyle={generationStyle}
          generationModeOptions={generationModeOptions}
          toggleGenerationMode={toggleGenerationMode}
          composeWriteLocked={composeWriteLocked}
          draftActionKey={draftActionKey}
          refiningContent={refiningContent}
          selectedGenerationModes={selectedGenerationModes}
          selectedGenerationServiceLabel={selectedGenerationServiceLabel}
          activeGenerationModes={activeGenerationModes}
          primaryGenerationMode={primaryGenerationMode}
          publisherContent={publisherContent}
          setPublisherContent={setPublisherContent}
          publishing={publishing}
          selectedPlatformCounters={selectedPlatformCounters}
          showTwitterThreadPreview={showTwitterThreadPreview}
          twitterThreadParts={twitterThreadParts}
          composerActionHint={composerActionHint}
          setPublisherTargets={setPublisherTargets}
          canApproveOrPublish={canApproveOrPublish}
          composerScheduleFor={composerScheduleFor}
          setComposerScheduleFor={setComposerScheduleFor}
          sendComposerForApproval={sendComposerForApproval}
          scheduleComposerContent={scheduleComposerContent}
          publishFromWorkspace={publishFromWorkspace}
          uploadedMedia={uploadedMedia}
          removeUploadedMedia={removeUploadedMedia}
          publisherTargets={publisherTargets}
          showPromptInput={showPromptInput}
          setShowPromptInput={setShowPromptInput}
          hasComposerContent={hasComposerContent}
          generationPrompt={generationPrompt}
          setGenerationPrompt={setGenerationPrompt}
          generationToneOptions={generationToneOptions}
          selectedToneOption={selectedToneOption}
          setGenerationStyle={setGenerationStyle}
          refineWorkspaceContent={refineWorkspaceContent}
          mediaInputRef={mediaInputRef}
          handleMediaUpload={handleMediaUpload}
          mediaUploading={mediaUploading}
          generatedVariants={generatedVariants}
          setGeneratedVariants={setGeneratedVariants}
          saveGeneratedVariantDraft={saveGeneratedVariantDraft}
          setSelectedGenerationModes={setSelectedGenerationModes}
        />
      )}

      {isWorkspaceTab('calendar') && (
        <AgencyWorkspaceOperationsTab
          operationsLoading={operationsLoading}
          draftsLoading={draftsLoading}
          loadOperationsSnapshot={loadOperationsSnapshot}
          loadWorkspaceDrafts={loadWorkspaceDrafts}
          workspaceDrafts={workspaceDrafts}
          canWrite={canWrite}
          canApproveOrPublish={canApproveOrPublish}
          queueDrafts={queueDrafts}
          draftStatusFilter={draftStatusFilter}
          setDraftStatusFilter={setDraftStatusFilter}
          draftPlatformFilter={draftPlatformFilter}
          setDraftPlatformFilter={setDraftPlatformFilter}
          workspaceDraftPlatformOptions={workspaceDraftPlatformOptions}
          selectedFilteredDraftIds={selectedFilteredDraftIds}
          allFilteredDraftIds={allFilteredDraftIds}
          setSelectedDraftIds={setSelectedDraftIds}
          bulkApproveDrafts={bulkApproveDrafts}
          bulkDeleteDrafts={bulkDeleteDrafts}
          draftActionKey={draftActionKey}
          filteredWorkspaceDrafts={filteredWorkspaceDrafts}
          draftScheduleById={draftScheduleById}
          formatDateTimeInputValue={formatDateTimeInputValue}
          getDraftPlatformKeys={getDraftPlatformKeys}
          selectedDraftIds={selectedDraftIds}
          formatDateTime={formatDateTime}
          canMutate={canMutate}
          workspace={workspace}
          setWorkspaceDrafts={setWorkspaceDrafts}
          draftCommentById={draftCommentById}
          setDraftCommentById={setDraftCommentById}
          rejectReasonById={rejectReasonById}
          setRejectReasonById={setRejectReasonById}
          addDraftComment={addDraftComment}
          approvalLink={approvalLink}
          createApprovalLink={createApprovalLink}
          copyApprovalLink={copyApprovalLink}
          saveDraftEdits={saveDraftEdits}
          deleteDraft={deleteDraft}
          sendDraftForApproval={sendDraftForApproval}
          approveDraft={approveDraft}
          rejectDraft={rejectDraft}
          scheduleDraft={scheduleDraft}
          publishDraftNow={publishDraftNow}
          retryFailedDraft={retryFailedDraft}
          publishHistoryEntries={publishHistoryEntries}
          retryPublishHistoryEntry={retryPublishHistoryEntry}
          publishing={publishing}
          operationsSnapshot={operationsSnapshot}
          operationsView={operationsView}
          setOperationsView={setOperationsView}
          calendarMonthGrid={calendarMonthGrid}
          setCalendarMonthCursor={setCalendarMonthCursor}
          shiftCalendarMonthKey={shiftCalendarMonthKey}
          getCalendarMonthKey={getCalendarMonthKey}
          setSelectedCalendarDateKey={setSelectedCalendarDateKey}
          visibleCalendarDateKey={visibleCalendarDateKey}
          visibleCalendarItems={visibleCalendarItems}
        />
      )}
      {isWorkspaceTab('team') && (
        <AgencyWorkspaceTeamTab
          canMutate={canMutate}
          inviteSending={inviteSending}
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          inviteRole={inviteRole}
          setInviteRole={setInviteRole}
          inviteAgencyMember={inviteAgencyMember}
          agencyMembers={agencyMembers}
          seatUsage={seatUsage}
          seatLimit={seatLimit}
          availableMembers={availableMembers}
          selectedMap={selectedMap}
          setSelectedMemberIds={setSelectedMemberIds}
          saveAssignments={saveAssignments}
        />
      )}
      {isWorkspaceTab('connections') && (
        <AgencyWorkspaceConnectionsTab
          canMutate={canMutate}
          teamPermissions={teamPermissions}
          loadData={loadData}
          availableAccountsByPlatform={availableAccountsByPlatform}
          attachedAccountsByPlatform={attachedAccountsByPlatform}
          connectingPlatform={connectingPlatform}
          connectWorkspacePlatform={connectWorkspacePlatform}
          detachAccount={detachAccount}
          attachAccount={attachAccount}
          formatMetric={formatMetric}
        />
      )}
      {showLinkedInSelection && linkedInSelectionData && (
        <AgencyLinkedInSelectionModal
          linkedInSelectionData={linkedInSelectionData}
          selectingLinkedInAccount={selectingLinkedInAccount}
          handleLinkedInSelection={handleLinkedInSelection}
          setShowLinkedInSelection={setShowLinkedInSelection}
          setLinkedInSelectionData={setLinkedInSelectionData}
        />
      )}
        </div>
      </div>
    </div>
  );
};

export default AgencyWorkspacePage;






