import { useState } from 'react';
import { Link2, RefreshCw } from 'lucide-react';
import AgencyWorkspaceCalendarPanel from './AgencyWorkspaceCalendarPanel.jsx';
import {
  getDraftStatusMeta,
  getWorkspacePlatformLabel,
  QUEUE_STATUS_FILTER_OPTIONS,
} from '../../pages/agencyWorkspaceHelpers';

const AgencyWorkspaceOperationsTab = (props) => {
  const {
    operationsLoading,
    draftsLoading,
    loadOperationsSnapshot,
    loadWorkspaceDrafts,
    workspaceDrafts,
    canWrite,
    canApproveOrPublish,
    queueDrafts,
    draftStatusFilter,
    setDraftStatusFilter,
    draftPlatformFilter,
    setDraftPlatformFilter,
    workspaceDraftPlatformOptions,
    selectedFilteredDraftIds,
    allFilteredDraftIds,
    setSelectedDraftIds,
    bulkApproveDrafts,
    bulkDeleteDrafts,
    draftActionKey,
    filteredWorkspaceDrafts,
    draftScheduleById,
    formatDateTimeInputValue,
    getDraftPlatformKeys,
    selectedDraftIds,
    formatDateTime,
    canMutate,
    workspace,
    setWorkspaceDrafts,
    draftCommentById,
    setDraftCommentById,
    rejectReasonById,
    setRejectReasonById,
    addDraftComment,
    approvalLink,
    createApprovalLink,
    copyApprovalLink,
    saveDraftEdits,
    deleteDraft,
    sendDraftForApproval,
    approveDraft,
    rejectDraft,
    scheduleDraft,
    publishDraftNow,
    retryFailedDraft,
    publishHistoryEntries,
    retryPublishHistoryEntry,
    publishing,
    operationsSnapshot,
    operationsView,
    setOperationsView,
    calendarMonthGrid,
    setCalendarMonthCursor,
    shiftCalendarMonthKey,
    getCalendarMonthKey,
    setSelectedCalendarDateKey,
    visibleCalendarDateKey,
    visibleCalendarItems,
  } = props;
  const [sharingLink, setSharingLink] = useState(false);

  const handleShareApprovalLink = async () => {
    setSharingLink(true);
    try {
      if (!approvalLink?.approvalUrl) {
        await createApprovalLink();
      } else {
        await copyApprovalLink(approvalLink.approvalUrl);
      }
    } finally {
      setSharingLink(false);
    }
  };

  return (
    <div id="agency-workspace-calendar" className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-1 uppercase tracking-wide">Agency Pro</p>
          <h2 className="text-lg font-semibold text-gray-900 mt-2">Unified Queue + Calendar</h2>
          <p className="text-sm text-gray-600 mt-1">Track pending queue and scheduled posts across attached workspace channels.</p>
        </div>
        <button
          type="button"
          onClick={() => Promise.all([
            loadOperationsSnapshot(),
            loadWorkspaceDrafts(),
          ])}
          disabled={operationsLoading || draftsLoading}
          className="inline-flex items-center gap-2 text-sm border rounded-lg px-3 py-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${(operationsLoading || draftsLoading) ? 'animate-spin' : ''}`} />
          {(operationsLoading || draftsLoading) ? 'Refreshing...' : 'Refresh workflow'}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="border rounded-2xl p-5 bg-white">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-1 uppercase tracking-wide">Review Flow</p>
              <h3 className="text-base font-semibold text-gray-900 mt-2">Approval Queue + Draft History</h3>
              <p className="text-sm text-gray-600 mt-1">Everything saved from Compose lands here for approval, scheduling, editing, publishing, or deletion.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canApproveOrPublish ? (
                <button
                  type="button"
                  onClick={handleShareApprovalLink}
                  disabled={sharingLink}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 disabled:opacity-50"
                >
                  <Link2 className="h-4 w-4" />
                  {sharingLink ? 'Preparing...' : approvalLink?.approvalUrl ? 'Copy client approval link' : 'Share with client'}
                </button>
              ) : null}
              <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                Shared drafts: <span className="font-semibold text-gray-900">{workspaceDrafts.length || 0}</span>
              </div>
            </div>
          </div>

          {canApproveOrPublish ? (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
              <p className="text-sm font-semibold text-blue-900">Client review link</p>
              <p className="mt-1 text-sm text-blue-800">Send clients one link so they can review pending drafts without logging in.</p>
              {approvalLink?.approvalUrl ? (
                <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center">
                  <p className="min-w-0 flex-1 break-all rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-slate-700">
                    {approvalLink.approvalUrl}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyApprovalLink(approvalLink.approvalUrl)}
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-700"
                  >
                    Copy link
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {QUEUE_STATUS_FILTER_OPTIONS.map((option) => {
                    const active = draftStatusFilter === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDraftStatusFilter(option.value)}
                        className={`rounded-full px-3 py-2 text-sm border transition ${
                          active
                            ? 'border-blue-200 bg-blue-600 text-white'
                            : 'border-gray-300 bg-white text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                  <select
                    value={draftPlatformFilter}
                    onChange={(event) => setDraftPlatformFilter(event.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="all">All platforms</option>
                    {workspaceDraftPlatformOptions.map((platform) => (
                      <option key={platform} value={platform}>{getWorkspacePlatformLabel(platform)}</option>
                    ))}
                  </select>
                </div>

                {(canWrite || canApproveOrPublish) && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedFilteredDraftIds.length === allFilteredDraftIds.length) {
                          setSelectedDraftIds((previous) => previous.filter((id) => !allFilteredDraftIds.includes(id)));
                          return;
                        }
                        setSelectedDraftIds((previous) => [...new Set([...previous, ...allFilteredDraftIds])]);
                      }}
                      disabled={allFilteredDraftIds.length === 0}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
                    >
                      {selectedFilteredDraftIds.length === allFilteredDraftIds.length && allFilteredDraftIds.length > 0 ? 'Clear selection' : 'Select filtered'}
                    </button>
                    {canApproveOrPublish && (
                      <button
                        type="button"
                        onClick={bulkApproveDrafts}
                        disabled={selectedFilteredDraftIds.length === 0 || draftActionKey === 'bulk-approve'}
                        className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 disabled:opacity-50"
                      >
                        {draftActionKey === 'bulk-approve' ? 'Approving...' : 'Approve selected'}
                      </button>
                    )}
                    {canWrite && (
                      <button
                        type="button"
                        onClick={bulkDeleteDrafts}
                        disabled={selectedFilteredDraftIds.length === 0 || draftActionKey === 'bulk-delete'}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
                      >
                        {draftActionKey === 'bulk-delete' ? 'Deleting...' : 'Delete selected'}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Showing {filteredWorkspaceDrafts.length} of {queueDrafts.length} queue items in this view. Selected: {selectedFilteredDraftIds.length}.
              </p>
            </div>

            {filteredWorkspaceDrafts.length === 0 ? (
              <p className="text-sm text-gray-500 border rounded-lg px-3 py-6 text-center">No shared drafts yet. Compose something first, then review it here.</p>
            ) : (
              filteredWorkspaceDrafts.map((draft) => {
                const targetCount = Array.isArray(draft.platform_targets) ? draft.platform_targets.length : 0;
                const scheduleValue = draftScheduleById[draft.id] || formatDateTimeInputValue(draft.scheduled_for);
                const draftStatus = getDraftStatusMeta(draft.status);
                const draftPlatforms = getDraftPlatformKeys(draft);
                const selected = selectedDraftIds.includes(String(draft.id));
                const normalizedDraftStatus = String(draft.status || '').toLowerCase();
                const canEditDraft = canWrite && ['draft', 'rejected'].includes(normalizedDraftStatus);
                const canDeleteDraft = canWrite && ['draft', 'rejected', 'failed'].includes(normalizedDraftStatus);
                const canSendDraftForApproval = canWrite && ['draft', 'rejected'].includes(normalizedDraftStatus);
                const canReviewDraft = canApproveOrPublish && normalizedDraftStatus === 'pending_approval';
                const canScheduleApprovedDraft = canApproveOrPublish && ['approved', 'scheduled'].includes(normalizedDraftStatus);
                const canPublishApprovedDraft = canApproveOrPublish && ['approved', 'scheduled'].includes(normalizedDraftStatus);
                const canRetryFailedPublish = canApproveOrPublish && normalizedDraftStatus === 'failed';

                return (
                  <div key={draft.id} className="border rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(canWrite || canApproveOrPublish) && (
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(event) => {
                              setSelectedDraftIds((previous) => (
                                event.target.checked
                                  ? [...new Set([...previous, String(draft.id)])]
                                  : previous.filter((id) => id !== String(draft.id))
                              ));
                            }}
                            className="h-4 w-4"
                          />
                        )}
                        <span className="text-[11px] uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-full">{draft.generation_source || 'manual'}</span>
                        <span className={`text-[11px] uppercase tracking-wide px-2 py-1 rounded-full ${draftStatus.className}`}>{draftStatus.label}</span>
                        <span className="text-[11px] uppercase tracking-wide bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded-full">{targetCount} targets</span>
                        {draftPlatforms.map((platform) => (
                          <span key={`${draft.id}:${platform}`} className="text-[11px] uppercase tracking-wide bg-white text-gray-700 border border-gray-200 px-2 py-1 rounded-full">
                            {getWorkspacePlatformLabel(platform)}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Updated: {formatDateTime(draft.updated_at || draft.created_at)}
                      </p>
                    </div>

                    <input
                      className="w-full border rounded-lg px-3 py-2 mt-3"
                      value={draft.title || ''}
                      placeholder="Draft title"
                      onChange={(event) => {
                        setWorkspaceDrafts((previous) => previous.map((item) => (
                          item.id === draft.id ? { ...item, title: event.target.value } : item
                        )));
                      }}
                      disabled={!canEditDraft || !canMutate || workspace.status === 'archived'}
                    />
                    <textarea
                      className="w-full border rounded-lg px-3 py-2 min-h-[120px] mt-3"
                      value={draft.content || ''}
                      onChange={(event) => {
                        setWorkspaceDrafts((previous) => previous.map((item) => (
                          item.id === draft.id ? { ...item, content: event.target.value } : item
                        )));
                      }}
                      disabled={!canEditDraft || !canMutate || workspace.status === 'archived'}
                    />

                    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">Draft comments</p>
                        <span className="text-xs text-gray-500">
                          {(Array.isArray(draft.comments) ? draft.comments.length : 0)} comment{(Array.isArray(draft.comments) ? draft.comments.length : 0) === 1 ? '' : 's'}
                        </span>
                      </div>

                      {(Array.isArray(draft.comments) ? draft.comments.length : 0) === 0 ? (
                        <p className="mt-3 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-3 text-sm text-gray-500">
                          No comments yet. Client and agency feedback will appear here.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {(draft.comments || []).map((comment) => (
                            <div key={comment.id} className="rounded-lg border border-gray-200 bg-white px-3 py-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {comment.author_name || (comment.author_type === 'client' ? 'Client' : 'Agency')}
                                </p>
                                <span className="text-xs text-gray-500">{formatDateTime(comment.created_at)}</span>
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <textarea
                          className="min-h-[88px] flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          placeholder="Add internal feedback or reply to the client"
                          value={draftCommentById[draft.id] || ''}
                          onChange={(event) => {
                            setDraftCommentById((previous) => ({
                              ...previous,
                              [draft.id]: event.target.value,
                            }));
                          }}
                          disabled={!canMutate || draftActionKey === `comment:${draft.id}`}
                        />
                        <button
                          type="button"
                          onClick={() => addDraftComment(draft.id)}
                          disabled={!canMutate || draftActionKey === `comment:${draft.id}`}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 disabled:opacity-50"
                        >
                          {draftActionKey === `comment:${draft.id}` ? 'Posting...' : 'Add comment'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      {(canEditDraft || canDeleteDraft) && (
                        <>
                          {canEditDraft && (
                            <button
                              type="button"
                              onClick={() => saveDraftEdits(draft)}
                              disabled={!canMutate || workspace.status === 'archived' || draftActionKey === `save:${draft.id}`}
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
                            >
                              {draftActionKey === `save:${draft.id}` ? 'Saving...' : 'Save changes'}
                            </button>
                          )}
                          {canDeleteDraft && (
                            <button
                              type="button"
                              onClick={() => deleteDraft(draft.id)}
                              disabled={!canMutate || draftActionKey === `delete:${draft.id}`}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
                            >
                              {draftActionKey === `delete:${draft.id}` ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
                        </>
                      )}
                      {canSendDraftForApproval && (
                        <button
                          type="button"
                          onClick={() => sendDraftForApproval(draft)}
                          disabled={!canMutate || workspace.status === 'archived' || draftActionKey === `submit:${draft.id}`}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 disabled:opacity-50"
                        >
                          {draftActionKey === `submit:${draft.id}` ? 'Sending...' : normalizedDraftStatus === 'rejected' ? 'Edit + resubmit' : 'Send for approval'}
                        </button>
                      )}
                      {canReviewDraft && (
                        <>
                          <textarea
                            className="min-h-[88px] w-full rounded-lg border border-rose-200 bg-rose-50/40 px-3 py-2 text-sm text-gray-900"
                            placeholder="What should change before this draft goes live? This is required for rejection."
                            value={rejectReasonById[draft.id] || ''}
                            onChange={(event) => {
                              setRejectReasonById((previous) => ({
                                ...previous,
                                [draft.id]: event.target.value,
                              }));
                            }}
                            disabled={!canMutate || workspace.status === 'archived' || draftActionKey === `reject:${draft.id}`}
                          />
                          <button
                            type="button"
                            onClick={() => approveDraft(draft.id)}
                            disabled={!canMutate || workspace.status === 'archived' || draftActionKey === `approve:${draft.id}`}
                            className="rounded-lg border border-emerald-300 text-emerald-800 px-3 py-2 text-sm disabled:opacity-50"
                          >
                            {draftActionKey === `approve:${draft.id}` ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => rejectDraft(draft.id, rejectReasonById[draft.id] || '')}
                            disabled={!canMutate || workspace.status === 'archived' || draftActionKey === `reject:${draft.id}`}
                            className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm disabled:opacity-50"
                          >
                            {draftActionKey === `reject:${draft.id}` ? 'Rejecting...' : 'Reject'}
                          </button>
                        </>
                      )}
                      {canScheduleApprovedDraft && (
                        <>
                          <input
                            type="datetime-local"
                            className="border rounded-lg px-3 py-2 text-sm"
                            value={scheduleValue}
                            onChange={(event) => {
                              setDraftScheduleById((previous) => ({
                                ...previous,
                                [draft.id]: event.target.value,
                              }));
                            }}
                            disabled={!canMutate || workspace.status !== 'active'}
                          />
                          <button
                            type="button"
                            onClick={() => scheduleDraft(draft.id)}
                            disabled={!canMutate || workspace.status !== 'active' || draftActionKey === `schedule:${draft.id}`}
                            className="rounded-lg border border-amber-300 text-amber-800 px-3 py-2 text-sm disabled:opacity-50"
                          >
                            {draftActionKey === `schedule:${draft.id}` ? 'Scheduling...' : 'Schedule'}
                          </button>
                        </>
                      )}
                      {canPublishApprovedDraft && (
                        <button
                          type="button"
                          onClick={() => publishDraftNow(draft.id)}
                          disabled={!canMutate || workspace.status !== 'active' || draftActionKey === `publish:${draft.id}`}
                          className="rounded-lg bg-gray-900 text-white px-3 py-2 text-sm disabled:opacity-50"
                        >
                          {draftActionKey === `publish:${draft.id}` ? 'Publishing...' : 'Publish now'}
                        </button>
                      )}
                      {canRetryFailedPublish && (
                        <button
                          type="button"
                          onClick={() => retryFailedDraft(draft.id)}
                          disabled={!canMutate || workspace.status !== 'active' || draftActionKey === `retry:${draft.id}` || draftActionKey === `publish:${draft.id}`}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 disabled:opacity-50"
                        >
                          {draftActionKey === `retry:${draft.id}` || draftActionKey === `publish:${draft.id}` ? 'Retrying...' : 'Retry publish'}
                        </button>
                      )}
                    </div>

                    {!canApproveOrPublish && normalizedDraftStatus === 'pending_approval' && (
                      <p className="text-xs text-amber-700 mt-3">Waiting for an owner/admin to approve, schedule, or publish this draft.</p>
                    )}
                    {!canApproveOrPublish && normalizedDraftStatus === 'approved' && (
                      <p className="text-xs text-emerald-700 mt-3">Approved and ready for an owner/admin to schedule or publish.</p>
                    )}
                    {draft.rejected_reason && (
                      <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Rejection reason</p>
                        <p className="mt-1 text-sm text-rose-800">{draft.rejected_reason}</p>
                      </div>
                    )}
                    {draft.scheduled_for && (
                      <p className="text-xs text-gray-500 mt-3">Scheduled for: {formatDateTime(draft.scheduled_for)}</p>
                    )}
                    {draft.last_error && (
                      <p className="text-xs text-red-600 mt-2">{draft.last_error}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="border rounded-2xl p-5 bg-white">
          <div>
            <p className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-1 uppercase tracking-wide">Publish History</p>
            <h3 className="text-base font-semibold text-gray-900 mt-2">Latest Publish Results</h3>
            <p className="text-sm text-gray-600 mt-1">Recent publish attempts live here instead of cluttering the composer.</p>
          </div>

          <div className="mt-4 space-y-3">
            {publishHistoryEntries.length === 0 ? (
              <p className="text-sm text-gray-500 border rounded-lg px-3 py-6 text-center">No recent publish attempts yet.</p>
            ) : (
              publishHistoryEntries.map((result) => (
                <div key={result.id} className="border rounded-lg px-3 py-3">
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
                    <div className="mt-1">
                      <p className="text-xs text-red-600">{result.error || 'Publish failed'}</p>
                      {canApproveOrPublish && (
                        <button
                          type="button"
                          onClick={() => retryPublishHistoryEntry(result)}
                          disabled={publishing || draftActionKey === `publish:${result.draftId}`}
                          className="mt-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 disabled:opacity-50"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  )}
                  {result.createdAt && (
                    <p className="mt-2 text-[11px] text-gray-500">Attempted: {formatDateTime(result.createdAt)}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AgencyWorkspaceCalendarPanel
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
        formatDateTime={formatDateTime}
      />
    </div>
  );
};

export default AgencyWorkspaceOperationsTab;
