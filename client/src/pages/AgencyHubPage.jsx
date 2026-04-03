import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Layers3, Plus, Users } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AgencyHubPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [summary, setSummary] = useState({ active: 0, paused: 0, archived: 0 });
  const [form, setForm] = useState({ name: '', brand_name: '', timezone: 'Asia/Kolkata' });
  const [creating, setCreating] = useState(false);
  const [accessError, setAccessError] = useState(null);
  const lastLoadedAtRef = useRef(0);

  const slotsRemaining = useMemo(() => {
    if (!context) return 0;
    return Math.max(0, Number(context.limits?.workspaceLimit || 0) - Number(context.usage?.workspaceCount || 0));
  }, [context]);

  const fetchAgency = async () => {
    setLoading(true);
    try {
      const [ctx, ws] = await Promise.all([
        api.get('/agency/context'),
        api.get('/agency/workspaces'),
      ]);
      setContext(ctx.data);
      setWorkspaces(ws.data.workspaces || []);
      setSummary(ws.data.summary || { active: 0, paused: 0, archived: 0 });
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
    const path = `/agency/workspaces/${workspaceId}`;
    if (typeof window !== 'undefined') {
      window.open(path, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(path);
  };

  if (loading) {
    return <div className="text-gray-600">Loading agency hub...</div>;
  }

  if (accessError?.requiresUpgrade) {
    const isInactiveSubscription = accessError.code === 'AGENCY_SUBSCRIPTION_INACTIVE';
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-amber-200 rounded-xl p-6">
          <p className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold px-2 py-1 uppercase tracking-wide">
            Agency Plan Required
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 mt-3">
            {isInactiveSubscription ? 'Reactivate Agency Plan' : 'Upgrade to Agency Plan'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isInactiveSubscription
              ? 'Your Agency subscription is inactive. Reactivate it to continue using Agency Hub.'
              : 'Agency Hub is available on the Agency plan. Upgrade to unlock client workspaces and team access controls.'}
          </p>
          <button
            onClick={() => navigate('/plans?intent=agency')}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
          >
            {isInactiveSubscription ? 'Reactivate Agency Plan' : 'Upgrade to Agency Plan'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-red-200 rounded-xl p-6">
          <h1 className="text-xl font-semibold text-gray-900">Agency Hub is unavailable</h1>
          <p className="text-gray-600 mt-2">{accessError.message}</p>
          <button
            onClick={fetchAgency}
            className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Agency Hub</h1>
        <p className="text-gray-600 mt-1">Create client workspaces, manage access, and open each workspace when you want to work on that client.</p>
        {context && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="rounded-lg border p-4 bg-gray-50">
              <p className="text-xs uppercase tracking-wide text-gray-500">Workspaces</p>
              <p className="text-2xl font-semibold text-gray-900">{context.usage?.workspaceCount || 0}/{context.limits?.workspaceLimit || 6}</p>
            </div>
            <div className="rounded-lg border p-4 bg-gray-50">
              <p className="text-xs uppercase tracking-wide text-gray-500">Agency Members</p>
              <p className="text-2xl font-semibold text-gray-900">{context.usage?.activeSeatCount || 0}</p>
            </div>
            <div className="rounded-lg border p-4 bg-gray-50">
              <p className="text-xs uppercase tracking-wide text-gray-500">Active Clients</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.active || 0}</p>
            </div>
            <div className="rounded-lg border p-4 bg-gray-50">
              <p className="text-xs uppercase tracking-wide text-gray-500">Paused/Archived</p>
              <p className="text-2xl font-semibold text-gray-900">{(summary.paused || 0) + (summary.archived || 0)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-white border border-blue-200 rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-1 uppercase tracking-wide">Agency Workspace Model</p>
            <h2 className="text-lg font-semibold text-gray-900 mt-2">One client, one workspace</h2>
            <p className="text-sm text-gray-600 mt-1">Set the client name and brand, connect the client’s channels, assign your team, and do all work from inside that workspace.</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Plus className="h-5 w-5" />Create Client Workspace</h2>
        </div>
        <form onSubmit={onCreateWorkspace} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="border rounded-lg px-3 py-2" placeholder="Workspace name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <input className="border rounded-lg px-3 py-2" placeholder="Brand name" value={form.brand_name} onChange={(e) => setForm((p) => ({ ...p, brand_name: e.target.value }))} />
          <input className="border rounded-lg px-3 py-2" placeholder="Timezone (e.g. Asia/Kolkata)" value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))} />
          <button disabled={creating || slotsRemaining <= 0} className="rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-50">
            {creating ? 'Creating...' : slotsRemaining <= 0 ? 'Limit Reached' : 'Create Workspace'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {workspaces.map((workspace) => (
          <div key={workspace.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {workspace.logo_url ? (
                  <img
                    src={workspace.logo_url}
                    alt={workspace.name}
                    className="h-12 w-12 rounded-xl object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl border border-gray-200 bg-blue-50 text-blue-700 flex items-center justify-center font-semibold">
                    {String(workspace.name || 'W').trim().slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Building2 className="h-4 w-4" />{workspace.name}</h3>
                  <p className="text-sm text-gray-600">{workspace.brand_name || 'No brand name yet'} • {workspace.timezone}</p>
                  <p className="text-xs text-gray-500 mt-1">Status: <span className="font-medium">{workspace.status}</span></p>
                </div>
              </div>
              <button onClick={() => openWorkspace(workspace.id)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Open Workspace</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="border rounded-lg p-3 bg-gray-50">
                <p className="text-xs text-gray-500">Team Access</p>
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-1"><Users className="h-4 w-4" />{workspace.member_count || 0}/5</p>
              </div>
              <div className="border rounded-lg p-3 bg-gray-50">
                <p className="text-xs text-gray-500">Connected Channels</p>
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-1"><Layers3 className="h-4 w-4" />{workspace.account_count || 0}/8</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => openWorkspace(workspace.id)}
                className="text-xs rounded-md bg-blue-600 text-white px-3 py-2 hover:bg-blue-700"
              >
                Open Workspace
              </button>
              {workspace.status !== 'paused' && (
                <button onClick={() => onUpdateStatus(workspace.id, 'paused')} className="text-xs border rounded-md px-2.5 py-2 hover:bg-gray-50">Pause</button>
              )}
              {workspace.status !== 'active' && (
                <button onClick={() => onUpdateStatus(workspace.id, 'active')} className="text-xs border rounded-md px-2.5 py-2 hover:bg-gray-50">Activate</button>
              )}
              {workspace.status !== 'archived' && (
                <button onClick={() => onUpdateStatus(workspace.id, 'archived')} className="text-xs border border-red-200 text-red-700 rounded-md px-2.5 py-2 hover:bg-red-50">Archive</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgencyHubPage;
