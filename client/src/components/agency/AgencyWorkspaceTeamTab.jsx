import React from 'react';
import toast from 'react-hot-toast';

const AgencyWorkspaceTeamTab = ({
  canMutate,
  inviteSending,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  inviteAgencyMember,
  agencyMembers,
  seatUsage,
  seatLimit,
  availableMembers,
  selectedMap,
  setSelectedMemberIds,
  saveAssignments,
}) => (
  <div id="agency-workspace-team" className="rounded-[28px] border border-white/75 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-700">
          Team orchestration
        </span>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">Invite, assign, and govern access</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Keep the right operators inside the workspace while client planning, approvals, and publishing stay visible to everyone involved.
        </p>
      </div>
      <div className="rounded-[24px] border border-slate-200 bg-slate-950 px-5 py-4 text-white shadow-lg">
        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-300">Seat usage</p>
        <p className="mt-2 text-3xl font-semibold">{seatUsage}/{seatLimit || 5}</p>
        <p className="mt-1 text-sm text-slate-300">Assigned seats for this client.</p>
      </div>
    </div>

    <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[26px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(248,250,252,0.9)_0%,_rgba(255,255,255,0.98)_100%)] p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Invite agency member</h3>
            <p className="mt-1 text-sm text-slate-600">Bring someone into the agency directory, then assign them to this workspace.</p>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Client seats {seatUsage}/{seatLimit || 5}
          </span>
        </div>

        <form onSubmit={inviteAgencyMember} className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_170px_auto]">
          <input
            type="email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="teammate@client.com"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            disabled={!canMutate || inviteSending}
          />
          <select
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            disabled={!canMutate || inviteSending}
          >
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={!canMutate || inviteSending}
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {inviteSending ? 'Sending...' : 'Invite member'}
          </button>
        </form>
      </div>

      <div className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-950">Agency directory</h3>
        <p className="mt-1 text-sm text-slate-600">Everyone available to place inside this client workspace.</p>
        <div className="mt-4 space-y-3 max-h-[280px] overflow-auto pr-1">
          {agencyMembers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              No agency members yet.
            </p>
          ) : (
            agencyMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{member.display_name || member.email}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{member.email} / {member.role}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${member.status === 'active' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-amber-200 bg-amber-50 text-amber-700'}`}>
                  {member.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>

    <div className="mt-6 rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-slate-950">Workspace access matrix</h3>
          <p className="mt-1 text-sm text-slate-600">Choose which people can actually operate inside this client workspace.</p>
        </div>
        <button onClick={saveAssignments} disabled={!canMutate} className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
          Save access matrix
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {availableMembers.map((member) => (
          <label key={member.id} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 transition hover:border-blue-200 hover:bg-white">
            <input
              type="checkbox"
              checked={selectedMap.has(member.id)}
              onChange={(event) => {
                setSelectedMemberIds((previous) => {
                  if (event.target.checked) {
                    if (previous.includes(member.id)) {
                      return previous;
                    }
                    if (previous.length >= seatLimit) {
                      toast.error(`This client can have up to ${seatLimit} assigned members.`);
                      return previous;
                    }
                    return [...new Set([...previous, member.id])];
                  }
                  return previous.filter((id) => id !== member.id);
                });
              }}
              disabled={!canMutate}
              className="mt-1 h-4 w-4"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-950">{member.display_name || member.email}</span>
              <span className="mt-1 block text-xs text-slate-500">{member.email} / {member.role}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  </div>
);

export default AgencyWorkspaceTeamTab;
