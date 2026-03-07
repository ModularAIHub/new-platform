import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Users, Layers3, ExternalLink } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TOOL_OPTIONS = [
  { key: 'twitter', label: 'Tweet Genie' },
  { key: 'linkedin', label: 'LinkedIn Genie' },
  { key: 'social', label: 'Social Genie' },
];

const AgencyHubPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [summary, setSummary] = useState({ active: 0, paused: 0, archived: 0 });
  const [form, setForm] = useState({ name: '', brand_name: '', timezone: 'Asia/Kolkata' });
  const [creating, setCreating] = useState(false);

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
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to load agency hub');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgency();
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

  const launchTool = async (workspaceId, tool) => {
    try {
      const response = await api.post(`/agency/workspaces/${workspaceId}/launch-token`, { tool });
      const url = response.data?.launchUrl;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to create launch token');
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading agency hub...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Agency Hub</h1>
        <p className="text-gray-600 mt-1">Workspace-first control center for client operations.</p>
        {context && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="rounded-lg border p-4 bg-gray-50">
              <p className="text-xs uppercase tracking-wide text-gray-500">Workspaces</p>
              <p className="text-2xl font-semibold text-gray-900">{context.usage?.workspaceCount || 0}/{context.limits?.workspaceLimit || 6}</p>
            </div>
            <div className="rounded-lg border p-4 bg-gray-50">
              <p className="text-xs uppercase tracking-wide text-gray-500">Seats</p>
              <p className="text-2xl font-semibold text-gray-900">{context.usage?.activeSeatCount || 0}/{context.limits?.seatLimit || 6}</p>
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

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Plus className="h-5 w-5" />Create Client Workspace</h2>
          <button onClick={() => navigate('/agency/team')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Manage Team</button>
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
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Building2 className="h-4 w-4" />{workspace.name}</h3>
                <p className="text-sm text-gray-600">{workspace.brand_name} - {workspace.timezone}</p>
                <p className="text-xs text-gray-500 mt-1">Status: <span className="font-medium">{workspace.status}</span></p>
              </div>
              <button onClick={() => navigate(`/agency/workspaces/${workspace.id}`)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Open</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="border rounded-lg p-3 bg-gray-50">
                <p className="text-xs text-gray-500">Team Access</p>
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-1"><Users className="h-4 w-4" />{workspace.member_count || 0}</p>
              </div>
              <div className="border rounded-lg p-3 bg-gray-50">
                <p className="text-xs text-gray-500">Attached Accounts</p>
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-1"><Layers3 className="h-4 w-4" />{workspace.account_count || 0}/8</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {TOOL_OPTIONS.map((tool) => (
                <button key={tool.key} onClick={() => launchTool(workspace.id, tool.key)} className="text-xs border rounded-md px-2.5 py-1.5 hover:bg-gray-50 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> {tool.label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {workspace.status !== 'paused' && (
                <button onClick={() => onUpdateStatus(workspace.id, 'paused')} className="text-xs border rounded-md px-2.5 py-1.5 hover:bg-gray-50">Pause</button>
              )}
              {workspace.status !== 'active' && (
                <button onClick={() => onUpdateStatus(workspace.id, 'active')} className="text-xs border rounded-md px-2.5 py-1.5 hover:bg-gray-50">Activate</button>
              )}
              {workspace.status !== 'archived' && (
                <button onClick={() => onUpdateStatus(workspace.id, 'archived')} className="text-xs border border-red-200 text-red-700 rounded-md px-2.5 py-1.5 hover:bg-red-50">Archive</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgencyHubPage;
