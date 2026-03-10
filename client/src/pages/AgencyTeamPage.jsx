import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AgencyTeamPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState(null);
  const [members, setMembers] = useState([]);
  const [matrixMembers, setMatrixMembers] = useState([]);
  const [matrixWorkspaces, setMatrixWorkspaces] = useState([]);
  const [matrixAssignments, setMatrixAssignments] = useState(new Set());
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviting, setInviting] = useState(false);
  const [lastInvitation, setLastInvitation] = useState(null);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const [ctx, list, matrix] = await Promise.all([
        api.get('/agency/context'),
        api.get('/agency/members'),
        api.get('/agency/access-matrix'),
      ]);
      setContext(ctx.data);
      setMembers(list.data.members || []);
      setMatrixMembers(matrix.data.members || []);
      setMatrixWorkspaces(matrix.data.workspaces || []);
      setMatrixAssignments(new Set((matrix.data.assignments || []).map((item) => `${item.workspace_id}:${item.agency_member_id}`)));
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to load agency members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const invite = async (event) => {
    event.preventDefault();
    setInviting(true);
    try {
      const response = await api.post('/agency/members/invite', {
        email: inviteEmail,
        role: inviteRole,
      });
      const invitation = response.data?.invitation || null;
      const inviteUrl = invitation?.invite_url
        || (invitation?.token ? `${window.location.origin}/agency/invite/${invitation.token}` : null);
      const emailSent = Boolean(response.data?.emailDelivery?.sent);

      setLastInvitation({
        email: invitation?.email || inviteEmail,
        role: invitation?.role || inviteRole,
        inviteUrl,
        emailSent,
      });

      if (inviteUrl && navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(inviteUrl);
        } catch {
          // Ignore clipboard errors and still continue.
        }
      }

      toast.success(emailSent ? 'Invite sent successfully' : 'Invite created. Share the link manually.');
      setInviteEmail('');
      setInviteRole('editor');
      await loadMembers();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (memberId, role) => {
    try {
      await api.patch(`/agency/members/${memberId}`, { role });
      toast.success('Role updated');
      await loadMembers();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to update role');
    }
  };

  const removeMember = async (memberId) => {
    try {
      await api.delete(`/agency/members/${memberId}`);
      toast.success('Member removed');
      await loadMembers();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to remove member');
    }
  };

  if (loading) return <div className="text-gray-600">Loading agency team...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Agency Team</h1>
          <p className="text-gray-600">Seat usage: {context?.usage?.activeSeatCount || 0}/{context?.limits?.seatLimit || 6}</p>
        </div>
        <button onClick={() => navigate('/agency')} className="text-sm text-blue-600 hover:text-blue-700">Back to Agency Hub</button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Invite Member</h2>
        <form onSubmit={invite} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="email@client.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
          <select className="border rounded-lg px-3 py-2" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button disabled={inviting} className="rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-50">
            {inviting ? 'Inviting...' : 'Send Invite'}
          </button>
        </form>
        {lastInvitation?.inviteUrl && (
          <div className="mt-4 border border-blue-200 rounded-lg bg-blue-50 p-3">
            <p className="text-sm font-medium text-blue-900">
              Invite ready for {lastInvitation.email} ({lastInvitation.role})
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {lastInvitation.emailSent ? 'Email sent via Resend.' : 'Email delivery failed; share this link manually.'}
            </p>
            <div className="mt-2 flex flex-col md:flex-row md:items-center gap-2">
              <input
                readOnly
                value={lastInvitation.inviteUrl}
                className="flex-1 border border-blue-200 rounded px-2 py-1 text-xs bg-white"
              />
              <button
                type="button"
                onClick={async () => {
                  if (navigator?.clipboard?.writeText) {
                    await navigator.clipboard.writeText(lastInvitation.inviteUrl);
                    toast.success('Invite link copied');
                  }
                }}
                className="text-xs px-3 py-1.5 rounded border border-blue-300 text-blue-700 bg-white hover:bg-blue-100"
              >
                Copy link
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Members</h2>
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col md:flex-row md:items-center md:justify-between border rounded-lg px-3 py-2 gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{member.display_name || member.email}</p>
                <p className="text-xs text-gray-500">{member.email} - {member.status}</p>
              </div>
              <div className="flex items-center gap-2">
                {member.role !== 'owner' ? (
                  <select className="border rounded px-2 py-1 text-sm" value={member.role} onChange={(e) => changeRole(member.id, e.target.value)}>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">Owner</span>
                )}
                {member.role !== 'owner' && (
                  <button onClick={() => removeMember(member.id)} className="text-xs border border-red-200 text-red-700 rounded px-2 py-1">Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Matrix</h2>
        <p className="text-sm text-gray-600 mb-4">Who has access to what across active workspaces.</p>
        {matrixWorkspaces.length === 0 ? (
          <p className="text-sm text-gray-500">No workspaces found. Create a workspace in Agency Hub to start assigning access.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 border-b border-gray-200">Member</th>
                  {matrixWorkspaces.map((workspace) => (
                    <th key={workspace.id} className="text-left px-3 py-2 border-b border-gray-200 whitespace-nowrap">
                      {workspace.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixMembers.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900">{member.email}</div>
                      <div className="text-xs text-gray-500">{member.role}</div>
                    </td>
                    {matrixWorkspaces.map((workspace) => {
                      const hasAccess = member.role === 'owner' || member.role === 'admin' || matrixAssignments.has(`${workspace.id}:${member.id}`);
                      return (
                        <td key={`${member.id}:${workspace.id}`} className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${hasAccess ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {hasAccess ? 'Yes' : 'No'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyTeamPage;
