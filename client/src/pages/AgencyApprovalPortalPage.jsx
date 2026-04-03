import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

const STATUS_STYLES = {
  pending_approval: 'border-amber-200 bg-amber-50 text-amber-800',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  rejected: 'border-rose-200 bg-rose-50 text-rose-800',
};

const formatDateTime = (value) => {
  if (!value) return 'Not set';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
};

const toTitle = (value) => String(value || '')
  .split(/[_\s-]+/)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const commentTone = {
  client: 'border-blue-200 bg-blue-50/70',
  agency: 'border-slate-200 bg-white',
};

const AgencyApprovalPortalPage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [portal, setPortal] = useState(null);
  const [clientName, setClientName] = useState('');
  const [rejectReasonByDraftId, setRejectReasonByDraftId] = useState({});
  const [commentByDraftId, setCommentByDraftId] = useState({});
  const [draftActionKey, setDraftActionKey] = useState(null);

  const loadPortal = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/agency/public/approval/${token}`);
      setPortal(response?.data || null);
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Failed to load the approval portal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortal();
  }, [token]);

  useEffect(() => {
    const brandName = portal?.branding?.brandName;
    const portalTitle = portal?.branding?.portalTitle;
    if (!brandName && !portalTitle) return;
    document.title = `${portalTitle || `${brandName} Approval Portal`}`;
  }, [portal?.branding?.brandName, portal?.branding?.portalTitle]);

  const updateDraftInState = (draftId, updater) => {
    setPortal((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        drafts: (previous.drafts || []).map((draft) => (
          String(draft.id) === String(draftId) ? updater(draft) : draft
        )),
      };
    });
  };

  const handleApprove = async (draftId) => {
    setDraftActionKey(`approve:${draftId}`);
    try {
      const response = await api.post(`/agency/public/approval/${token}/approve/${draftId}`, {
        clientName,
      });
      updateDraftInState(draftId, (draft) => ({
        ...draft,
        ...response?.data?.draft,
      }));
      await loadPortal();
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Failed to approve this draft');
    } finally {
      setDraftActionKey(null);
    }
  };

  const handleReject = async (draftId) => {
    const reason = String(rejectReasonByDraftId[draftId] || '').trim();
    if (!reason) {
      setError('Add a short rejection reason before sending the draft back.');
      return;
    }

    setDraftActionKey(`reject:${draftId}`);
    try {
      const response = await api.post(`/agency/public/approval/${token}/reject/${draftId}`, {
        clientName,
        reason,
      });
      updateDraftInState(draftId, (draft) => ({
        ...draft,
        ...response?.data?.draft,
      }));
      setRejectReasonByDraftId((previous) => ({ ...previous, [draftId]: '' }));
      await loadPortal();
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Failed to reject this draft');
    } finally {
      setDraftActionKey(null);
    }
  };

  const handleComment = async (draftId) => {
    const comment = String(commentByDraftId[draftId] || '').trim();
    if (!comment) {
      setError('Write a comment before posting feedback.');
      return;
    }

    setDraftActionKey(`comment:${draftId}`);
    try {
      const response = await api.post(`/agency/public/approval/${token}/comment/${draftId}`, {
        clientName,
        comment,
      });
      updateDraftInState(draftId, (draft) => ({
        ...draft,
        comments: [...(Array.isArray(draft.comments) ? draft.comments : []), response?.data?.comment].filter(Boolean),
      }));
      setCommentByDraftId((previous) => ({ ...previous, [draftId]: '' }));
      setError('');
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Failed to post this comment');
    } finally {
      setDraftActionKey(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-600">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          Loading approval portal...
        </div>
      </div>
    );
  }

  if (error && !portal) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-rose-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Approval portal unavailable</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">This review link is invalid or expired</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  const pendingDrafts = (portal?.drafts || []).filter((draft) => draft.status === 'pending_approval');
  const reviewedDrafts = (portal?.drafts || []).filter((draft) => draft.status !== 'pending_approval');
  const accentColor = portal?.branding?.accentColor || '#2563eb';

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                {portal?.branding?.logoUrl ? (
                  <img
                    src={portal.branding.logoUrl}
                    alt={portal.branding.brandName || portal?.workspace?.name || 'Brand logo'}
                    className="h-14 w-14 rounded-2xl border border-slate-200 object-cover bg-white"
                  />
                ) : (
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-sm"
                    style={{ backgroundColor: accentColor }}
                  >
                    {(portal?.branding?.brandName || portal?.workspace?.name || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Review workspace</p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    {portal?.branding?.portalTitle || portal?.branding?.brandName || portal?.workspace?.brand_name || portal?.workspace?.name}
                  </h1>
                </div>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {portal?.branding?.portalMessage || 'Review pending social drafts, approve what is ready, reject anything that needs changes, and leave comments without creating an account.'}
              </p>
              {(portal?.branding?.industry || portal?.branding?.audience) ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {portal?.branding?.industry ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                      Industry: {portal.branding.industry}
                    </span>
                  ) : null}
                  {portal?.branding?.audience ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                      Audience: {portal.branding.audience}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:min-w-[260px]">
              <label className="text-sm font-medium text-slate-900" htmlFor="client-name-input">Your name</label>
              <input
                id="client-name-input"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="Client reviewer name"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Pending</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-700">{portal?.portalMeta?.pendingCount || 0}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Approved</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-700">{portal?.portalMeta?.approvedCount || 0}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Rejected</p>
                  <p className="mt-2 text-2xl font-semibold text-rose-700">{portal?.portalMeta?.rejectedCount || 0}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Portal label</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{portal?.portalMeta?.label || 'Client approval link'}</p>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}
        </div>

        {(portal?.drafts || []).length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-950">No drafts are waiting for review right now</p>
            <p className="mt-2 text-sm text-slate-500">The agency will see your earlier approvals and add new work here when it is ready.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {pendingDrafts.length > 0 ? (
              <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Needs review</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Pending approvals</h2>
                <p className="mt-2 text-sm text-slate-600">Approve the drafts that are ready to go live, or send back changes with notes.</p>
              </div>
            ) : null}

            {pendingDrafts.map((draft) => {
              const isPending = draft.status === 'pending_approval';
              const mediaUrls = Array.isArray(draft.media_urls) ? draft.media_urls : [];
              const targets = Array.isArray(draft.platform_targets) ? draft.platform_targets : [];

              return (
                <div key={draft.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${STATUS_STYLES[draft.status] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                          {toTitle(draft.status)}
                        </span>
                        {targets.map((target, index) => (
                          <span key={`${draft.id}:target:${index}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                            {toTitle(target)}
                          </span>
                        ))}
                      </div>
                      <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{draft.title || 'Untitled draft'}</h2>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{draft.content || 'No draft content available.'}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span>Created {formatDateTime(draft.created_at)}</span>
                        {draft.scheduled_for ? <span>Scheduled {formatDateTime(draft.scheduled_for)}</span> : null}
                        {draft.reviewed_at ? <span>Reviewed {formatDateTime(draft.reviewed_at)}</span> : null}
                      </div>
                    </div>

                    {mediaUrls.length > 0 ? (
                      <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                        {mediaUrls.slice(0, 4).map((mediaUrl, index) => (
                          <div key={`${draft.id}:media:${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            <img
                              src={typeof mediaUrl === 'string' ? mediaUrl : mediaUrl?.url}
                              alt=""
                              className="h-28 w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {draft.rejected_reason ? (
                    <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                      <span className="font-semibold">Rejected reason:</span> {draft.rejected_reason}
                    </div>
                  ) : null}

                  <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-slate-900">Comment thread</h3>
                        <span className="text-xs text-slate-500">{(draft.comments || []).length} comment{(draft.comments || []).length === 1 ? '' : 's'}</span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {(draft.comments || []).length === 0 ? (
                          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
                            No comments yet. Add feedback if you want edits before approval.
                          </p>
                        ) : (
                          (draft.comments || []).map((comment) => (
                            <div key={comment.id} className={`rounded-2xl border px-4 py-3 ${commentTone[comment.author_type] || 'border-slate-200 bg-white'}`}>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900">
                                  {comment.author_name || (comment.author_type === 'client' ? 'Client' : 'Agency')}
                                  <span className="ml-2 text-xs font-medium uppercase tracking-wide text-slate-500">{comment.author_type || 'note'}</span>
                                </p>
                                <span className="text-xs text-slate-500">{formatDateTime(comment.created_at)}</span>
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-4 lg:sticky lg:top-6">
                      <h3 className="text-sm font-semibold text-slate-900">Review actions</h3>
                      <p className="mt-1 text-sm text-slate-600">Approve, reject with a reason, or leave feedback for the agency team.</p>

                      <textarea
                        value={commentByDraftId[draft.id] || ''}
                        onChange={(event) => setCommentByDraftId((previous) => ({ ...previous, [draft.id]: event.target.value }))}
                        placeholder="Leave a comment or revision note"
                        className="mt-4 min-h-[110px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleComment(draft.id)}
                        disabled={draftActionKey === `comment:${draft.id}`}
                        className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        {draftActionKey === `comment:${draft.id}` ? 'Posting comment...' : 'Post comment'}
                      </button>

                      <textarea
                        value={rejectReasonByDraftId[draft.id] || ''}
                        onChange={(event) => setRejectReasonByDraftId((previous) => ({ ...previous, [draft.id]: event.target.value }))}
                        placeholder="Explain what should change before this goes live"
                        className="mt-4 min-h-[110px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                        disabled={!isPending}
                      />

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => handleApprove(draft.id)}
                          disabled={!isPending || draftActionKey === `approve:${draft.id}`}
                          className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        >
                          {draftActionKey === `approve:${draft.id}` ? 'Approving...' : 'Approve draft'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(draft.id)}
                          disabled={!isPending || draftActionKey === `reject:${draft.id}`}
                          className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                        >
                          {draftActionKey === `reject:${draft.id}` ? 'Rejecting...' : 'Reject with feedback'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {reviewedDrafts.length > 0 ? (
              <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Earlier decisions</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Reviewed drafts</h2>
                <p className="mt-2 text-sm text-slate-600">This section helps clients keep track of what was approved or sent back.</p>
              </div>
            ) : null}

            {reviewedDrafts.map((draft) => {
              const mediaUrls = Array.isArray(draft.media_urls) ? draft.media_urls : [];
              const targets = Array.isArray(draft.platform_targets) ? draft.platform_targets : [];
              return (
                <div key={draft.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${STATUS_STYLES[draft.status] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                          {toTitle(draft.status)}
                        </span>
                        {targets.map((target, index) => (
                          <span key={`${draft.id}:reviewed-target:${index}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                            {toTitle(target)}
                          </span>
                        ))}
                      </div>
                      <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{draft.title || 'Untitled draft'}</h2>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{draft.content || 'No draft content available.'}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span>Created {formatDateTime(draft.created_at)}</span>
                        {draft.reviewed_at ? <span>Reviewed {formatDateTime(draft.reviewed_at)}</span> : null}
                      </div>
                      {draft.rejected_reason ? (
                        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                          <span className="font-semibold">Rejected reason:</span> {draft.rejected_reason}
                        </div>
                      ) : null}
                    </div>
                    {mediaUrls.length > 0 ? (
                      <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                        {mediaUrls.slice(0, 4).map((mediaUrl, index) => (
                          <div key={`${draft.id}:reviewed-media:${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            <img
                              src={typeof mediaUrl === 'string' ? mediaUrl : mediaUrl?.url}
                              alt=""
                              className="h-28 w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyApprovalPortalPage;
