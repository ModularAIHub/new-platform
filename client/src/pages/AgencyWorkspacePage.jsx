import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

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

  const canMutate = workspace?.status !== 'archived';

  const selectedMap = useMemo(() => new Set(selectedMemberIds), [selectedMemberIds]);

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
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

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
