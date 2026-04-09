import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Crown,
  Layers3,
  Mail,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MANAGEABLE_ROLES = new Set(['owner', 'admin']);
const ASSIGNABLE_MEMBER_ROLES = ['admin', 'editor', 'viewer'];

const WORKSPACE_STATUS_STYLES = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  paused: 'border-amber-200 bg-amber-50 text-amber-700',
  archived: 'border-slate-200 bg-slate-100 text-slate-600',
};

const formatRoleLabel = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'Member';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const AgencyHubPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [summary, setSummary] = useState({ active: 0, paused: 0, archived: 0 });
  const [members, setMembers] = useState([]);
  const [seatUsage, setSeatUsage] = useState(0);
  const [seatLimit, setSeatLimit] = useState(6);
  const [workspaceMemberLimit, setWorkspaceMemberLimit] = useState(5);
  const [form, setForm] = useState({ name: '', brand_name: '', timezone: 'Asia/Kolkata' });
  const [creating, setCreating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviteSending, setInviteSending] = useState(false);
  const [memberBusyKey, setMemberBusyKey] = useState('');
  const [accessError, setAccessError] = useState(null);
  const lastLoadedAtRef = useRef(0);
  const currentRole = String(context?.member?.role || '').trim().toLowerCase();
  const canManageAgency = MANAGEABLE_ROLES.has(currentRole);

  const activeMembers = useMemo(() => (
    members.filter((member) => String(member.status || '').toLowerCase() === 'active')
  ), [members]);

  const pendingMembers = useMemo(() => (
    members.filter((member) => String(member.status || '').toLowerCase() === 'pending')
  ), [members]);

  const slotsRemaining = useMemo(() => {
    if (!context) return 0;
    return Math.max(0, Number(context.limits?.workspaceLimit || 0) - Number(context.usage?.workspaceCount || 0));
  }, [context]);

  const seatSlotsRemaining = useMemo(() => (
    Math.max(0, Number(seatLimit || 0) - Number(seatUsage || 0))
  ), [seatLimit, seatUsage]);

  const activeAddonCount = useMemo(() => {
    if (!context?.addons) return 0;
    return [
      context.addons.whiteLabelEnabled,
      context.addons.reportingExportEnabled,
      context.addons.mediaLibraryEnabled,
    ].filter(Boolean).length;
  }, [context]);

  const workspaceReadiness = useMemo(() => {
    const checks = [
      Number(context?.usage?.workspaceCount || 0) > 0,
      Number(activeMembers.length || 0) > 0,
      Number(summary.active || 0) > 0,
      activeAddonCount > 0,
    ];
    const completed = checks.filter(Boolean).length;
    return {
      completed,
      total: checks.length,
      percent: Math.round((completed / checks.length) * 100),
    };
  }, [activeAddonCount, activeMembers.length, context, summary.active]);

  const fetchAgency = async () => {
    setLoading(true);
    try {
      const [ctx, ws, memberResponse] = await Promise.all([
        api.get('/agency/context'),
        api.get('/agency/workspaces'),
        api.get('/agency/members'),
      ]);
      setContext(ctx.data);
      setWorkspaces(ws.data.workspaces || []);
      setSummary(ws.data.summary || { active: 0, paused: 0, archived: 0 });
      setMembers(memberResponse.data.members || []);
      setSeatUsage(Number(memberResponse.data.seatUsage || 0));
      setSeatLimit(Number(memberResponse.data.seatLimit || 6));
      setWorkspaceMemberLimit(Number(memberResponse.data.workspaceMemberLimit || 5));
      lastLoadedAtRef.current = Date.now();
      setAccessError(null);
    } catch (error) {
      const code = String(error?.response?.data?.code || '').trim().toUpperCase();
      const message = error?.response?.data?.error || 'Failed to load agency hub';
      const requiresUpgrade = ['AGENCY_ACCESS_DENIED', 'AGENCY_PLAN_REQUIRED', 'AGENCY_SUBSCRIPTION_INACTIVE'].includes(code);
      setAccessError({ code, message, requiresUpgrade });
      if (!requiresUpgrade) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgency();

    const refreshOnFocus = () => {
      if (Date.now() - lastLoadedAtRef.current < 30000) return;
      fetchAgency();
    };
    const refreshOnVisibility = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible' && Date.now() - lastLoadedAtRef.current >= 30000) {
        fetchAgency();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', refreshOnFocus);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', refreshOnVisibility);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', refreshOnFocus);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', refreshOnVisibility);
      }
    };
  }, []);

  const onCreateWorkspace = async (event) => {
    event.preventDefault();
    setCreating(true);
    try {
      await api.post('/agency/workspaces', form);
      setForm({ name: '', brand_name: '', timezone: form.timezone || 'Asia/Kolkata' });
      toast.success('Workspace created');
      await fetchAgency();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  const onInviteMember = async (event) => {
    event.preventDefault();
    if (!canManageAgency) return;
    setInviteSending(true);
    try {
      await api.post('/agency/members/invite', {
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteEmail('');
      setInviteRole('editor');
      toast.success('Agency invite sent');
      await fetchAgency();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to invite agency member');
    } finally {
      setInviteSending(false);
    }
  };

  const onResendInvite = async (member) => {
    if (!member?.email || !canManageAgency) return;
    const busyKey = `resend:${member.id}`;
    setMemberBusyKey(busyKey);
    try {
      await api.post('/agency/members/invite', {
        email: member.email,
        role: member.role || 'editor',
      });
      toast.success('Invitation resent');
      await fetchAgency();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to resend invitation');
    } finally {
      setMemberBusyKey('');
    }
  };

  const onUpdateMemberRole = async (memberId, role) => {
    if (!memberId || !role || !canManageAgency) return;
    const busyKey = `role:${memberId}`;
    setMemberBusyKey(busyKey);
    try {
      await api.patch(`/agency/members/${memberId}`, { role });
      toast.success('Member role updated');
      await fetchAgency();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to update member role');
    } finally {
      setMemberBusyKey('');
    }
  };

  const onRemoveMember = async (member) => {
    if (!member?.id || !canManageAgency) return;
    const confirmed = window.confirm(`Remove ${member.email} from this agency?`);
    if (!confirmed) return;

    const busyKey = `remove:${member.id}`;
    setMemberBusyKey(busyKey);
    try {
      await api.delete(`/agency/members/${member.id}`);
      toast.success('Member removed');
      await fetchAgency();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to remove member');
    } finally {
      setMemberBusyKey('');
    }
  };

  const onUpdateStatus = async (workspaceId, status) => {
    try {
      await api.post(`/agency/workspaces/${workspaceId}/status`, { status });
      toast.success(`Workspace moved to ${status}`);
      await fetchAgency();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to update workspace status');
    }
  };

  const openWorkspace = (workspaceId) => {
    navigate(`/agency/workspaces/${workspaceId}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-10 w-80 max-w-full animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-28 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (accessError?.requiresUpgrade) {
    const isInactiveSubscription = accessError.code === 'AGENCY_SUBSCRIPTION_INACTIVE';
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[28px] border border-amber-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
          <p className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
            Agency plan required
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            {isInactiveSubscription ? 'Reactivate Agency plan' : 'Upgrade to Agency plan'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {isInactiveSubscription
              ? 'Your Agency subscription is inactive. Reactivate it to restore client workspaces, approvals, and pooled delivery controls.'
              : 'Agency Hub is available on the Agency plan. Upgrade to unlock client workspaces, pooled credits, and team access control.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/plans?intent=agency')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {isInactiveSubscription ? 'Reactivate Agency plan' : 'Upgrade to Agency plan'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[28px] border border-red-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Agency Hub is unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{accessError.message}</p>
          <button
            type="button"
            onClick={fetchAgency}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,_rgba(255,255,255,0.98)_0%,_rgba(244,247,255,0.96)_55%,_rgba(238,246,255,0.98)_100%)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
              Agency operating system
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Agency Hub</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Create client workspaces, assign seats, manage shared channels, and keep approvals and publishing grounded in the right workspace.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                Role: {formatRoleLabel(currentRole)}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                {summary.active || 0} active client workspace{Number(summary.active || 0) === 1 ? '' : 's'}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                {activeAddonCount} delivery add-on{activeAddonCount === 1 ? '' : 's'} active
              </span>
            </div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-950 px-5 py-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] xl:max-w-[320px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Workspace readiness</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{workspaceReadiness.percent}% ready</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {workspaceReadiness.completed}/{workspaceReadiness.total} core Agency plan layers are live for day-to-day delivery.
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,_#38bdf8_0%,_#2563eb_55%,_#14b8a6_100%)]"
                style={{ width: `${workspaceReadiness.percent}%` }}
              />
            </div>
          </div>
        </div>
        {context && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Workspaces</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{context.usage?.workspaceCount || 0}/{context.limits?.workspaceLimit || 6}</p>
              <p className="mt-2 text-sm text-slate-600">{slotsRemaining} slot{slotsRemaining === 1 ? '' : 's'} remaining.</p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Agency seats</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{seatUsage}/{seatLimit || 6}</p>
              <p className="mt-2 text-sm text-slate-600">{seatSlotsRemaining} seat{seatSlotsRemaining === 1 ? '' : 's'} remaining.</p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace member cap</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{workspaceMemberLimit}</p>
              <p className="mt-2 text-sm text-slate-600">People assignable inside each client workspace.</p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Account cap per workspace</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{context.limits?.workspaceAccountLimit || 8}</p>
              <p className="mt-2 text-sm text-slate-600">Shared channels available inside each workspace.</p>
            </div>
          </div>
        )}
      </div>

      {context && (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Agency add-ons</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Expansion packs and delivery extras</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Buy more seats, more workspaces, or unlock white-label, reporting export, and media library when a client delivery workflow needs it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/plans?intent=agency')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Manage agency add-ons
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">White-label</p>
              <p className="mt-3 text-lg font-semibold text-slate-950">{context.addons?.whiteLabelEnabled ? 'Active' : 'Locked'}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Brand the approval-facing client experience when you need a cleaner agency presentation layer.</p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Reporting export</p>
              <p className="mt-3 text-lg font-semibold text-slate-950">{context.addons?.reportingExportEnabled ? 'Active' : 'Locked'}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Unlock export-ready reporting flows for client delivery and stakeholder reporting.</p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Media library</p>
              <p className="mt-3 text-lg font-semibold text-slate-950">
                {context.addons?.mediaLibraryEnabled ? `${context.addons?.mediaLibraryStorageGb || 25} GB active` : 'Locked'}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Centralize reusable assets for client teams that circulate creative across multiple workspaces.</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[28px] border border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">Agency workspace model</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">One client, one workspace</h2>
            <p className="text-sm text-gray-600 mt-1">Set the client name and brand, connect the client’s channels, assign your team, and do all work from inside that workspace.</p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-950"><Plus className="h-5 w-5" />Create client workspace</h2>
        </div>
        <form onSubmit={onCreateWorkspace} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Workspace name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required disabled={!canManageAgency || creating} />
          <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Brand name" value={form.brand_name} onChange={(e) => setForm((p) => ({ ...p, brand_name: e.target.value }))} disabled={!canManageAgency || creating} />
          <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Timezone (for example Asia/Kolkata)" value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))} disabled={!canManageAgency || creating} />
          <button disabled={!canManageAgency || creating || slotsRemaining <= 0} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50">
            {creating ? 'Creating...' : slotsRemaining <= 0 ? 'Workspace limit reached' : 'Create workspace'}
          </button>
        </form>
        {!canManageAgency && (
          <p className="mt-3 text-xs text-slate-500">
            Your current role is {formatRoleLabel(currentRole)}. Owner or Admin access is required to create or reconfigure client workspaces.
          </p>
        )}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Agency directory</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Invite, manage, and govern agency seats</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Agency plan includes {seatLimit || 6} total seats and workspace-level assignments. Pending invites stay visible until the teammate joins.
            </p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Seats in use</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{seatUsage}/{seatLimit || 6}</p>
          </div>
        </div>

        <form onSubmit={onInviteMember} className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_auto]">
          <input
            type="email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="teammate@agency.com"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            disabled={!canManageAgency || inviteSending}
          />
          <select
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            disabled={!canManageAgency || inviteSending}
          >
            {ASSIGNABLE_MEMBER_ROLES.map((role) => (
              <option key={role} value={role}>{formatRoleLabel(role)}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!canManageAgency || inviteSending || !inviteEmail.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {inviteSending ? 'Sending...' : 'Invite member'}
          </button>
        </form>

        {!canManageAgency && (
          <p className="mt-3 text-xs text-slate-500">
            Your current role is {formatRoleLabel(currentRole)}. Owner or Admin access is required to invite or edit agency members.
          </p>
        )}

        <div className="mt-6 grid gap-3">
          {members.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No agency members yet. Invite your first teammate to start assigning workspace access.
            </div>
          ) : (
            members.map((member) => {
              const isOwner = String(member.role || '').toLowerCase() === 'owner';
              const isTargetAdmin = String(member.role || '').toLowerCase() === 'admin';
              const currentUserIsAdmin = currentRole === 'admin';
              const canEditThisMember = canManageAgency && !isOwner && !(currentUserIsAdmin && isTargetAdmin);
              const status = String(member.status || '').toLowerCase();

              return (
                <div key={member.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-950">{member.display_name || member.email}</p>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {status}
                        </span>
                        {isOwner && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                            <Crown className="h-3 w-3" />
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="mt-2 truncate text-sm text-slate-600">{member.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                          Role: {formatRoleLabel(member.role)}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                          Assigned to {member.workspace_assignment_count || 0} workspace{Number(member.workspace_assignment_count || 0) === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={member.role || 'viewer'}
                        onChange={(event) => onUpdateMemberRole(member.id, event.target.value)}
                        disabled={!canEditThisMember || memberBusyKey === `role:${member.id}`}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-50"
                      >
                        {ASSIGNABLE_MEMBER_ROLES.map((role) => (
                          <option key={role} value={role}>{formatRoleLabel(role)}</option>
                        ))}
                      </select>

                      {status === 'pending' && canManageAgency && (
                        <button
                          type="button"
                          onClick={() => onResendInvite(member)}
                          disabled={memberBusyKey === `resend:${member.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Resend
                        </button>
                      )}

                      {!isOwner && (
                        <button
                          type="button"
                          onClick={() => onRemoveMember(member)}
                          disabled={!canEditThisMember || memberBusyKey === `remove:${member.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Active members</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{activeMembers.length}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Pending invites</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{pendingMembers.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {workspaces.map((workspace) => (
          <div key={workspace.id} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {workspace.logo_url ? (
                  <img
                    src={workspace.logo_url}
                    alt={workspace.name}
                    className="h-12 w-12 rounded-xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-blue-50 font-semibold text-blue-700">
                    {String(workspace.name || 'W').trim().slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-950"><Building2 className="h-4 w-4" />{workspace.name}</h3>
                  <p className="text-sm text-gray-600">{workspace.brand_name || 'No brand name yet'} • {workspace.timezone}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${WORKSPACE_STATUS_STYLES[String(workspace.status || '').toLowerCase()] || WORKSPACE_STATUS_STYLES.archived}`}>
                      {workspace.status}
                    </span>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      Your access {formatRoleLabel(workspace.currentMemberRole || currentRole)}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => openWorkspace(workspace.id)} className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800">Open workspace</button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-xs text-slate-500">Team access</p>
                <p className="flex items-center gap-1 text-sm font-semibold text-slate-950"><Users className="h-4 w-4" />{workspace.member_count || 0}/{workspaceMemberLimit}</p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-xs text-slate-500">Connected channels</p>
                <p className="flex items-center gap-1 text-sm font-semibold text-slate-950"><Layers3 className="h-4 w-4" />{workspace.account_count || 0}/{context?.limits?.workspaceAccountLimit || 8}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-xs text-slate-500">Delivery status</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {String(workspace.status || '').toLowerCase() === 'active'
                  ? 'Ready for planning, approvals, and publishing.'
                  : String(workspace.status || '').toLowerCase() === 'paused'
                    ? 'Paused until your team reactivates this workspace.'
                    : 'Archived and read-only.'}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => openWorkspace(workspace.id)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Open workspace
              </button>
              {canManageAgency && workspace.status !== 'paused' && (
                <button onClick={() => onUpdateStatus(workspace.id, 'paused')} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Pause</button>
              )}
              {canManageAgency && workspace.status !== 'active' && (
                <button onClick={() => onUpdateStatus(workspace.id, 'active')} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Activate</button>
              )}
              {canManageAgency && workspace.status !== 'archived' && (
                <button onClick={() => onUpdateStatus(workspace.id, 'archived')} className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50">Archive</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgencyHubPage;
