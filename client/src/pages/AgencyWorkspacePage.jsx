import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  BarChart3,
  CalendarDays,
  Clock3,
  History,
  LayoutDashboard,
  Link2,
  ListChecks,
  MessageSquare,
  PenSquare,
  RefreshCw,
} from 'lucide-react';

const TOOL_DEFINITIONS = [
  {
    key: 'linkedin',
    label: 'LinkedIn Genie',
    description: 'Client-first LinkedIn publishing and engagement operations.',
    targets: ['dashboard', 'compose', 'calendar', 'scheduling', 'engagement', 'analytics', 'connections', 'history'],
  },
  {
    key: 'twitter',
    label: 'Tweet Genie',
    description: 'Daily queue, threads, calendar scheduling, and analytics.',
    targets: ['dashboard', 'compose', 'calendar', 'scheduling', 'analytics', 'connections', 'history'],
  },
  {
    key: 'social',
    label: 'Social Genie',
    description: 'Multi-platform workspace for compose, queue, and reporting.',
    targets: ['dashboard', 'compose', 'calendar', 'scheduling', 'analytics', 'connections', 'history'],
  },
];

const OPERATION_DEFINITIONS = [
  { target: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { target: 'compose', label: 'Compose', icon: PenSquare },
  { target: 'calendar', label: 'Calendar', icon: CalendarDays },
  { target: 'scheduling', label: 'Queue', icon: Clock3 },
  { target: 'engagement', label: 'Engagement', icon: MessageSquare },
  { target: 'analytics', label: 'Analytics', icon: BarChart3 },
  { target: 'connections', label: 'Connections', icon: Link2 },
  { target: 'history', label: 'History', icon: History },
];

const AgencyWorkspacePage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [attachedAccounts, setAttachedAccounts] = useState([]);
  const [launchingKey, setLaunchingKey] = useState(null);
  const [publisherContent, setPublisherContent] = useState('');
  const [publisherMediaInput, setPublisherMediaInput] = useState('');
  const [publisherTargets, setPublisherTargets] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationsView, setOperationsView] = useState('queue');
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

  const selectedMap = useMemo(() => new Set(selectedMemberIds), [selectedMemberIds]);
  const attachedCountsByPlatform = useMemo(() => {
    return attachedAccounts.reduce((acc, account) => {
      const key = String(account.platform || '').toLowerCase();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [attachedAccounts]);

  const groupedCalendar = useMemo(() => {
    const groups = new Map();
    (operationsSnapshot.calendar || []).forEach((item) => {
      const rawDate = item?.scheduledFor || item?.createdAt;
      const date = rawDate ? new Date(rawDate) : null;
      const key = date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : 'No schedule time';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    return [...groups.entries()];
  }, [operationsSnapshot.calendar]);

  const resolveToolForPlatform = (platform) => {
    const normalized = String(platform || '').toLowerCase();
    if (normalized === 'twitter' || normalized === 'x') return 'twitter';
    if (normalized === 'linkedin') return 'linkedin';
    return 'social';
  };

  const formatDateTime = (value) => {
    if (!value) return 'Not set';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleString();
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [workspacesRes, membersRes, availableAccRes, attachedAccRes] = await Promise.all([
        api.get('/agency/workspaces?includeArchived=true'),
        api.get(`/agency/workspaces/${workspaceId}/members`),
        api.get('/agency/accounts/available'),
        api.get(`/agency/workspaces/${workspaceId}/accounts`),
      ]);

      const currentWorkspace = (workspacesRes.data.workspaces || []).find((item) => item.id === workspaceId);
      if (!currentWorkspace) {
        toast.error('Workspace not found');
        navigate('/agency');
        return;
      }

      setWorkspace(currentWorkspace);
      setAssignedMembers(membersRes.data.assignedMembers || []);
      setAvailableMembers(membersRes.data.availableMembers || []);
      setSelectedMemberIds((membersRes.data.assignedMembers || []).map((item) => item.id));
      setAvailableAccounts(availableAccRes.data.accounts || []);
      setAttachedAccounts(attachedAccRes.data.accounts || []);
      await loadOperationsSnapshot({ silent: true });
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  useEffect(() => {
    const activeIds = attachedAccounts.map((account) => account.id);
    setPublisherTargets((previous) => {
      const kept = previous.filter((id) => activeIds.includes(id));
      if (kept.length > 0) return kept;
      return activeIds;
    });
  }, [attachedAccounts]);

  const saveOverview = async (event) => {
    event.preventDefault();
    try {
      await api.patch(`/agency/workspaces/${workspaceId}`, {
        name: workspace.name,
        brand_name: workspace.brand_name,
        timezone: workspace.timezone,
        logo_url: workspace.logo_url,
      });
      toast.success('Workspace updated');
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to update workspace');
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

  const updateStatus = async (status) => {
    try {
      await api.post(`/agency/workspaces/${workspaceId}/status`, { status });
      toast.success(`Workspace moved to ${status}`);
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to change status');
    }
  };

  const launchWorkspaceTool = async (tool, target = 'dashboard') => {
    const key = `${tool}:${target}`;
    setLaunchingKey(key);
    try {
      const response = await api.post(`/agency/workspaces/${workspaceId}/launch-token`, { tool, target });
      const url = response?.data?.launchUrl || response?.data?.launchUrls?.[tool];
      if (!url) {
        toast.error('Launch URL is unavailable for this tool');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to launch workspace tool');
    } finally {
      setLaunchingKey(null);
    }
  };

  const publishFromWorkspace = async (event) => {
    event.preventDefault();
    const normalizedContent = String(publisherContent || '').trim();
    const media = String(publisherMediaInput || '')
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!normalizedContent) {
      toast.error('Write content before publishing');
      return;
    }

    if (!Array.isArray(publisherTargets) || publisherTargets.length === 0) {
      toast.error('Select at least one attached account');
      return;
    }

    setPublishing(true);
    try {
      const response = await api.post(`/agency/workspaces/${workspaceId}/publish`, {
        content: normalizedContent,
        media,
        targetWorkspaceAccountIds: publisherTargets,
      });

      const summary = response?.data?.summary || {};
      const results = Array.isArray(response?.data?.results) ? response.data.results : [];
      setPublishResults(results);

      if (Number(summary.successCount || 0) > 0) {
        toast.success(`Published to ${summary.successCount} account${summary.successCount === 1 ? '' : 's'}`);
      }
      if (Number(summary.failedCount || 0) > 0) {
        toast.error(`${summary.failedCount} publish attempt${summary.failedCount === 1 ? '' : 's'} failed`);
      }
      await loadOperationsSnapshot({ silent: true });
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="text-gray-600">Loading workspace...</div>;
  if (!workspace) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{workspace.name}</h1>
          <p className="text-gray-600">Status: {workspace.status}</p>
        </div>
        <button onClick={() => navigate('/agency')} className="text-sm text-blue-600 hover:text-blue-700">Back to Agency Hub</button>
      </div>

      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-white border border-blue-200 rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-1 uppercase tracking-wide">Agency Pro</p>
            <h2 className="text-lg font-semibold text-gray-900 mt-2">Client Operations Launchpad</h2>
            <p className="text-sm text-gray-600 mt-1">Open compose, calendar, queue, analytics, and account connections directly from this workspace.</p>
          </div>
          <div className="text-xs text-gray-600 bg-white border border-blue-100 rounded-lg px-3 py-2">
            Workspace status: <span className="font-semibold text-gray-900">{workspace.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
          {TOOL_DEFINITIONS.map((tool) => (
            <div key={tool.key} className="bg-white border border-blue-100 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{tool.label}</h3>
                <span className="text-[11px] text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-1">
                  {(attachedCountsByPlatform[tool.key] || 0)} accounts
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{tool.description}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {OPERATION_DEFINITIONS
                  .filter((op) => tool.targets.includes(op.target))
                  .map((operation) => {
                    const Icon = operation.icon;
                    const key = `${tool.key}:${operation.target}`;
                    const isLaunching = launchingKey === key;
                    return (
                      <button
                        key={operation.target}
                        type="button"
                        disabled={isLaunching || workspace.status === 'archived'}
                        onClick={() => launchWorkspaceTool(tool.key, operation.target)}
                        className="inline-flex items-center gap-1 text-xs rounded-md border border-gray-200 px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {isLaunching ? 'Opening...' : operation.label}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-1 uppercase tracking-wide">Agency Pro</p>
            <h2 className="text-lg font-semibold text-gray-900 mt-2">Workspace Publisher</h2>
            <p className="text-sm text-gray-600 mt-1">Publish once from this workspace and fan out to selected attached accounts.</p>
          </div>
          <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            Selected targets: <span className="font-semibold text-gray-900">{publisherTargets.length}</span>
          </div>
        </div>

        <form onSubmit={publishFromWorkspace} className="mt-4 space-y-3">
          <textarea
            className="w-full border rounded-lg px-3 py-2 min-h-[140px]"
            placeholder="Write your post once. Publish to selected workspace accounts."
            value={publisherContent}
            onChange={(event) => setPublisherContent(event.target.value)}
            disabled={publishing || !canMutate || workspace.status !== 'active'}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Optional media URLs (comma or new line separated)"
            value={publisherMediaInput}
            onChange={(event) => setPublisherMediaInput(event.target.value)}
            disabled={publishing || !canMutate || workspace.status !== 'active'}
          />

          <div className="border rounded-lg p-3">
            <p className="text-sm font-medium text-gray-800 mb-2">Publish targets</p>
            {attachedAccounts.length === 0 ? (
              <p className="text-sm text-gray-500">Attach accounts below to enable workspace fan-out posting.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {attachedAccounts.map((account) => {
                  const checked = publisherTargets.includes(account.id);
                  return (
                    <label key={account.id} className="flex items-center gap-2 border rounded-lg px-3 py-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setPublisherTargets((previous) => {
                            if (event.target.checked) return [...new Set([...previous, account.id])];
                            return previous.filter((id) => id !== account.id);
                          });
                        }}
                        disabled={publishing || !canMutate || workspace.status !== 'active'}
                      />
                      <span className="text-sm">
                        {account.account_display_name || account.account_username || account.account_id || account.source_id}
                        <span className="text-gray-500"> ({account.platform})</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={publishing || !canMutate || workspace.status !== 'active' || attachedAccounts.length === 0}
            className="rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
          >
            {publishing ? 'Publishing...' : 'Publish to Selected Accounts'}
          </button>
        </form>

        {publishResults.length > 0 && (
          <div className="mt-4 border rounded-lg overflow-hidden">
            {publishResults.map((result) => (
              <div key={`${result.workspaceAccountId}:${result.platform}`} className="px-3 py-2 border-b last:border-b-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900">{result.accountDisplayName} <span className="text-gray-500">({result.platform})</span></p>
                  <span className={`text-xs px-2 py-1 rounded-full ${result.status === 'posted' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {result.status}
                  </span>
                </div>
                {result.status === 'posted' ? (
                  <p className="text-xs text-gray-600 mt-1">
                    {result.postId ? `Post ID: ${result.postId}` : 'Published successfully'}
                  </p>
                ) : (
                  <p className="text-xs text-red-600 mt-1">{result.error || 'Publish failed'}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-1 uppercase tracking-wide">Agency Pro</p>
            <h2 className="text-lg font-semibold text-gray-900 mt-2">Unified Queue + Calendar</h2>
            <p className="text-sm text-gray-600 mt-1">Track pending queue and scheduled posts across attached workspace channels.</p>
          </div>
          <button
            type="button"
            onClick={() => loadOperationsSnapshot()}
            disabled={operationsLoading}
            className="inline-flex items-center gap-2 text-sm border rounded-lg px-3 py-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${operationsLoading ? 'animate-spin' : ''}`} />
            {operationsLoading ? 'Refreshing...' : 'Refresh snapshot'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <div className="border rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500">Queue items</p>
            <p className="text-xl font-semibold text-gray-900">{operationsSnapshot.summary?.queueCount || 0}</p>
          </div>
          <div className="border rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500">Calendar posts</p>
            <p className="text-xl font-semibold text-gray-900">{operationsSnapshot.summary?.calendarCount || 0}</p>
          </div>
          <div className="border rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500">Healthy sources</p>
            <p className="text-xl font-semibold text-emerald-700">{operationsSnapshot.summary?.sourceHealthyCount || 0}</p>
          </div>
          <div className="border rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500">Failed sources</p>
            <p className="text-xl font-semibold text-red-700">{operationsSnapshot.summary?.sourceFailedCount || 0}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOperationsView('queue')}
            className={`inline-flex items-center gap-1.5 text-sm border rounded-md px-3 py-1.5 ${operationsView === 'queue' ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-700'}`}
          >
            <ListChecks className="h-4 w-4" />
            Queue
          </button>
          <button
            type="button"
            onClick={() => setOperationsView('calendar')}
            className={`inline-flex items-center gap-1.5 text-sm border rounded-md px-3 py-1.5 ${operationsView === 'calendar' ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-700'}`}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </button>
          <p className="text-xs text-gray-500 ml-1">
            Last refresh: {operationsSnapshot.summary?.lastRefreshedAt ? formatDateTime(operationsSnapshot.summary.lastRefreshedAt) : 'Not available'}
          </p>
        </div>

        {operationsView === 'queue' ? (
          <div className="mt-4 space-y-2">
            {(operationsSnapshot.queue || []).length === 0 ? (
              <p className="text-sm text-gray-500 border rounded-lg px-3 py-6 text-center">No queue items in attached workspace channels.</p>
            ) : (
              (operationsSnapshot.queue || []).map((item) => (
                <div key={`${item.platform}:${item.id}`} className="border rounded-lg px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-full">{item.platform}</span>
                      <span className="text-[11px] uppercase tracking-wide bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded-full">{item.status || 'pending'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => launchWorkspaceTool(resolveToolForPlatform(item.platform), 'scheduling')}
                      className="text-xs border rounded-md px-2 py-1"
                    >
                      Open queue
                    </button>
                  </div>
                  {item.title && <p className="text-sm font-semibold text-gray-900 mt-2">{item.title}</p>}
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{String(item.content || '').slice(0, 280)}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {item.scheduledFor ? `Suggested/Scheduled: ${formatDateTime(item.scheduledFor)}` : 'No suggested time'}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {(operationsSnapshot.calendar || []).length === 0 ? (
              <p className="text-sm text-gray-500 border rounded-lg px-3 py-6 text-center">No scheduled calendar posts in attached workspace channels.</p>
            ) : (
              groupedCalendar.map(([dateLabel, items]) => (
                <div key={dateLabel} className="border rounded-lg">
                  <div className="px-3 py-2 border-b bg-gray-50">
                    <p className="text-sm font-semibold text-gray-900">{dateLabel}</p>
                  </div>
                  <div className="divide-y">
                    {items.map((item) => (
                      <div key={`${item.platform}:${item.id}`} className="px-3 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-full">{item.platform}</span>
                            <span className="text-[11px] uppercase tracking-wide bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded-full">{item.status || 'scheduled'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => launchWorkspaceTool(resolveToolForPlatform(item.platform), 'calendar')}
                            className="text-xs border rounded-md px-2 py-1"
                          >
                            Open calendar
                          </button>
                        </div>
                        <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{String(item.content || '').slice(0, 280)}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {item.scheduledFor ? `Scheduled: ${formatDateTime(item.scheduledFor)}` : `Created: ${formatDateTime(item.createdAt)}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {(operationsSnapshot.sources || []).length > 0 && (
          <div className="mt-4 border rounded-lg px-3 py-3">
            <p className="text-sm font-medium text-gray-900 mb-2">Source health</p>
            <div className="space-y-2">
              {(operationsSnapshot.sources || []).map((source) => (
                <div key={`${source.channel}:${source.teamId || 'personal'}`} className="flex items-center justify-between gap-3 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium uppercase">{source.channel}</span>
                    {source.teamId ? <span className="text-gray-500"> • team {source.teamId}</span> : <span className="text-gray-500"> • personal</span>}
                  </p>
                  {source.status === 'ok' ? (
                    <span className="text-emerald-700 text-xs bg-emerald-50 border border-emerald-100 rounded-full px-2 py-1">
                      ok • q:{source.queueCount} c:{source.calendarCount}
                    </span>
                  ) : (
                    <span className="text-red-700 text-xs bg-red-50 border border-red-100 rounded-full px-2 py-1">
                      failed • {source.error || source.code || 'unknown'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
        <form onSubmit={saveOverview} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border rounded-lg px-3 py-2" value={workspace.name || ''} onChange={(e) => setWorkspace((prev) => ({ ...prev, name: e.target.value }))} disabled={!canMutate} />
          <input className="border rounded-lg px-3 py-2" value={workspace.brand_name || ''} onChange={(e) => setWorkspace((prev) => ({ ...prev, brand_name: e.target.value }))} disabled={!canMutate} />
          <input className="border rounded-lg px-3 py-2" value={workspace.timezone || ''} onChange={(e) => setWorkspace((prev) => ({ ...prev, timezone: e.target.value }))} disabled={!canMutate} />
          <input className="border rounded-lg px-3 py-2" value={workspace.logo_url || ''} placeholder="Logo URL (optional)" onChange={(e) => setWorkspace((prev) => ({ ...prev, logo_url: e.target.value }))} disabled={!canMutate} />
          <button disabled={!canMutate} className="md:col-span-2 rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-50">Save Overview</button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Team Access</h2>
        <p className="text-sm text-gray-600 mb-4">Assign who can access this client workspace.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {availableMembers.map((member) => (
            <label key={member.id} className="flex items-center gap-2 border rounded-lg px-3 py-2">
              <input
                type="checkbox"
                checked={selectedMap.has(member.id)}
                onChange={(e) => {
                  setSelectedMemberIds((prev) => {
                    if (e.target.checked) return [...new Set([...prev, member.id])];
                    return prev.filter((id) => id !== member.id);
                  });
                }}
                disabled={!canMutate}
              />
              <span className="text-sm">{member.display_name || member.email} <span className="text-gray-500">({member.role})</span></span>
            </label>
          ))}
        </div>
        <button onClick={saveAssignments} disabled={!canMutate} className="mt-4 rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-50">Save Access Matrix</button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Attached Accounts</h2>
        <p className="text-sm text-gray-600 mb-4">Phase-1 uses existing connected accounts and maps them to this workspace.</p>

        <div className="space-y-2 mb-5">
          {attachedAccounts.length === 0 ? <p className="text-sm text-gray-500">No accounts attached yet.</p> : attachedAccounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div>
                <p className="text-sm font-medium">{account.account_display_name || account.account_username || account.account_id || account.source_id}</p>
                <p className="text-xs text-gray-500">{account.platform} - {account.source_type}</p>
              </div>
              <button onClick={() => detachAccount(account.id)} disabled={!canMutate} className="text-xs border border-red-200 text-red-700 rounded px-2 py-1 disabled:opacity-50">Detach</button>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-gray-900 mb-2">Attach from available connected accounts</h3>
        <div className="space-y-2 max-h-72 overflow-auto pr-1">
          {availableAccounts.map((account) => (
            <div key={`${account.sourceType}:${account.sourceId}`} className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div>
                <p className="text-sm font-medium">{account.accountDisplayName || account.accountUsername || account.accountId || account.sourceId}</p>
                <p className="text-xs text-gray-500">{account.platform} - {account.sourceType}</p>
              </div>
              <button onClick={() => attachAccount(account)} disabled={!canMutate} className="text-xs border rounded px-2 py-1 disabled:opacity-50">Attach</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Workspace Status</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => updateStatus('active')} className="border rounded px-3 py-1.5 text-sm">Activate</button>
          <button onClick={() => updateStatus('paused')} className="border rounded px-3 py-1.5 text-sm">Pause</button>
          <button onClick={() => updateStatus('archived')} className="border border-red-200 text-red-700 rounded px-3 py-1.5 text-sm">Archive</button>
        </div>
      </div>
    </div>
  );
};

export default AgencyWorkspacePage;
