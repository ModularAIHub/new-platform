import React from 'react';
import { RefreshCw } from 'lucide-react';

const AgencyWorkspaceAnalyticsTab = ({
  insightsSummary,
  formatDateTime,
  loadInsightsSummary,
  insightsLoading,
  formatMetric,
  operationsSnapshot,
  focusSection,
  analyticsSummary,
  publishedCount,
  failedCount,
  pendingApprovalCount,
  activeAccountCount,
  sourceHealthyCount,
  sourceFailedCount,
  socialConnectedCount,
}) => (
  <>
    <div id="agency-workspace-analytics" className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-1 uppercase tracking-wide">Client Intelligence</p>
          <h2 className="text-lg font-semibold text-gray-900 mt-2">Workspace Insights + Engagement Signals</h2>
          <p className="text-sm text-gray-600 mt-1">Pull shared performance and engagement context directly into this client workspace.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-xs text-gray-500">
            Refreshed: {insightsSummary.generatedAt ? formatDateTime(insightsSummary.generatedAt) : 'Not available'}
          </p>
          <button
            type="button"
            onClick={() => loadInsightsSummary()}
            disabled={insightsLoading}
            className="inline-flex items-center gap-2 text-sm border rounded-lg px-3 py-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${insightsLoading ? 'animate-spin' : ''}`} />
            {insightsLoading ? 'Refreshing...' : 'Refresh insights'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-4">
        <div className="border rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500">Connected accounts</p>
          <p className="text-xl font-semibold text-gray-900">{formatMetric(insightsSummary.workspace?.activeAccounts || 0)}</p>
        </div>
        <div className="border rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500">Drafts in studio</p>
          <p className="text-xl font-semibold text-gray-900">{formatMetric(insightsSummary.workspace?.drafts || 0)}</p>
        </div>
        <div className="border rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500">Scheduled</p>
          <p className="text-xl font-semibold text-amber-700">{formatMetric(insightsSummary.workspace?.scheduled || 0)}</p>
        </div>
        <div className="border rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500">Published</p>
          <p className="text-xl font-semibold text-emerald-700">{formatMetric(insightsSummary.workspace?.published || 0)}</p>
        </div>
        <div className="border rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500">Queue items</p>
          <p className="text-xl font-semibold text-gray-900">{formatMetric(operationsSnapshot.summary?.queueCount || 0)}</p>
        </div>
        <div className="border rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500">Automation mode</p>
          <p className={`text-sm font-semibold mt-2 ${insightsSummary.automation?.automationEnabled ? 'text-emerald-700' : 'text-gray-700'}`}>
            {insightsSummary.automation?.automationEnabled ? 'Enabled' : 'Manual'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mt-5">
        <div className="border rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Twitter / X</h3>
              <p className="text-xs text-gray-600 mt-1">Posting, approvals, and reach for X inside this workspace.</p>
            </div>
            <button type="button" onClick={() => focusSection('analytics')} className="text-xs border rounded-md px-2 py-1">Viewing in workspace</button>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div><p className="text-xs text-gray-500">Accounts</p><p className="text-lg font-semibold text-gray-900">{formatMetric(insightsSummary.platforms?.twitter?.connectedAccounts || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Posts</p><p className="text-lg font-semibold text-gray-900">{formatMetric(insightsSummary.platforms?.twitter?.totalPosts || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Impressions</p><p className="text-lg font-semibold text-gray-900">{formatMetric(insightsSummary.platforms?.twitter?.totalImpressions || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Engagement</p><p className="text-lg font-semibold text-blue-700">{formatMetric(insightsSummary.platforms?.twitter?.totalEngagement || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Pending approvals</p><p className="text-lg font-semibold text-amber-700">{formatMetric(insightsSummary.platforms?.twitter?.pendingApprovals || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Pending queue</p><p className="text-lg font-semibold text-gray-900">{formatMetric(insightsSummary.platforms?.twitter?.pendingQueue || 0)}</p></div>
          </div>
          {(insightsSummary.platforms?.twitter?.errors || []).length > 0 && (
            <p className="text-xs text-red-600 mt-3">{insightsSummary.platforms.twitter.errors[0]}</p>
          )}
        </div>

        <div className="border rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">LinkedIn</h3>
              <p className="text-xs text-gray-600 mt-1">Publishing, queue health, and performance for LinkedIn profiles and pages.</p>
            </div>
            <button type="button" onClick={() => focusSection('analytics')} className="text-xs border rounded-md px-2 py-1">Viewing in workspace</button>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div><p className="text-xs text-gray-500">Accounts</p><p className="text-lg font-semibold text-gray-900">{formatMetric(insightsSummary.platforms?.linkedin?.connectedAccounts || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Posts</p><p className="text-lg font-semibold text-gray-900">{formatMetric(insightsSummary.platforms?.linkedin?.totalPosts || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Views</p><p className="text-lg font-semibold text-gray-900">{formatMetric(insightsSummary.platforms?.linkedin?.totalViews || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Engagement</p><p className="text-lg font-semibold text-blue-700">{formatMetric(insightsSummary.platforms?.linkedin?.totalEngagement || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Pending approvals</p><p className="text-lg font-semibold text-amber-700">{formatMetric(insightsSummary.platforms?.linkedin?.pendingApprovals || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Approved queue</p><p className="text-lg font-semibold text-gray-900">{formatMetric(insightsSummary.platforms?.linkedin?.approvedQueue || 0)}</p></div>
          </div>
          {(insightsSummary.platforms?.linkedin?.errors || []).length > 0 && (
            <p className="text-xs text-red-600 mt-3">{insightsSummary.platforms.linkedin.errors[0]}</p>
          )}
        </div>

        <div className="border rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Cross-platform Social</h3>
              <p className="text-xs text-gray-600 mt-1">Threads, Instagram, YouTube, and shared social execution from this workspace.</p>
            </div>
            <button type="button" onClick={() => focusSection('connections')} className="text-xs border rounded-md px-2 py-1">Open connections</button>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div><p className="text-xs text-gray-500">Accounts</p><p className="text-lg font-semibold text-gray-900">{formatMetric(insightsSummary.platforms?.social?.connectedAccounts || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Posted</p><p className="text-lg font-semibold text-emerald-700">{formatMetric(insightsSummary.platforms?.social?.totalPosted || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Scheduled</p><p className="text-lg font-semibold text-amber-700">{formatMetric(insightsSummary.platforms?.social?.totalScheduled || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Failed</p><p className="text-lg font-semibold text-red-700">{formatMetric(insightsSummary.platforms?.social?.totalFailed || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Threads posts</p><p className="text-lg font-semibold text-gray-900">{formatMetric(insightsSummary.platforms?.social?.threadsPosts || 0)}</p></div>
            <div><p className="text-xs text-gray-500">Instagram posts</p><p className="text-lg font-semibold text-gray-900">{formatMetric(insightsSummary.platforms?.social?.instagramPosts || 0)}</p></div>
          </div>
          {(insightsSummary.platforms?.social?.connectedAccounts || 0) === 0 && (
            <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3">
              <p className="text-sm font-medium text-gray-800">No social accounts connected yet</p>
              <p className="mt-1 text-xs text-gray-600">Connect Threads, Instagram, or YouTube in the Connections tab to populate this card.</p>
            </div>
          )}
          {(insightsSummary.platforms?.social?.errors || []).length > 0 && (
            <p className="text-xs text-red-600 mt-3">{insightsSummary.platforms.social.errors[0]}</p>
          )}
        </div>

        <div className="border rounded-xl p-4 bg-gray-50">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Engagement + Approvals</h3>
              <p className="text-xs text-gray-600 mt-1">Reply workload, approvals, and moderation signals for this workspace.</p>
            </div>
            <button type="button" onClick={() => focusSection('analytics')} className="text-xs border rounded-md px-2 py-1 bg-white">Engagement signals</button>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2 bg-white">
              <p className="text-sm text-gray-700">LinkedIn reply drafts ready</p>
              <p className="text-lg font-semibold text-gray-900">{formatMetric(insightsSummary.engagement?.linkedin?.readyReplyDrafts || 0)}</p>
            </div>
            <div className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2 bg-white">
              <p className="text-sm text-gray-700">LinkedIn replies sent</p>
              <p className="text-lg font-semibold text-emerald-700">{formatMetric(insightsSummary.engagement?.linkedin?.sentReplies || 0)}</p>
            </div>
            <div className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2 bg-white">
              <p className="text-sm text-gray-700">Posts with comments</p>
              <p className="text-lg font-semibold text-blue-700">{formatMetric(insightsSummary.engagement?.linkedin?.postsWithComments || 0)}</p>
            </div>
          </div>

          <div className="border rounded-lg px-3 py-3 mt-4 bg-white">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Automation policy</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {insightsSummary.automation?.requireAdminApproval && (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2 py-1">Admin approval required</span>
              )}
              {insightsSummary.automation?.autoGenerateTwitter && (
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-1">Twitter generation on</span>
              )}
              {insightsSummary.automation?.autoGenerateLinkedin && (
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-1">LinkedIn generation on</span>
              )}
              {insightsSummary.automation?.autoGenerateSocial && (
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-1">Cross-post generation on</span>
              )}
              {insightsSummary.automation?.engagementAutoReply && (
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-1">Auto-reply drafts on</span>
              )}
              {!insightsSummary.automation?.automationEnabled && (
                <span className="text-xs bg-gray-100 text-gray-700 border border-gray-200 rounded-full px-2 py-1">Manual workspace mode</span>
              )}
            </div>
          </div>

          {(insightsSummary.engagement?.linkedin?.errors || []).length > 0 && (
            <p className="text-xs text-red-600 mt-3">{insightsSummary.engagement.linkedin.errors[0]}</p>
          )}
        </div>
      </div>
    </div>

    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-1 uppercase tracking-wide">Agency Pro</p>
          <h2 className="text-lg font-semibold text-gray-900 mt-2">Workspace Analytics Summary</h2>
          <p className="text-sm text-gray-600 mt-1">A shared snapshot of draft activity and attached client accounts.</p>
        </div>
        <p className="text-xs text-gray-500">
          Refreshed: {analyticsSummary.generatedAt ? formatDateTime(analyticsSummary.generatedAt) : 'Not available'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
        <div className="border rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500">Drafts</p>
          <p className="text-xl font-semibold text-gray-900">{analyticsSummary.drafts || 0}</p>
        </div>
        <div className="border rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500">Scheduled</p>
          <p className="text-xl font-semibold text-amber-700">{analyticsSummary.scheduled || 0}</p>
        </div>
        <div className="border rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500">Published</p>
          <p className="text-xl font-semibold text-emerald-700">{analyticsSummary.published || 0}</p>
        </div>
        <div className="border rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500">Failed</p>
          <p className="text-xl font-semibold text-red-700">{analyticsSummary.failed || 0}</p>
        </div>
        <div className="border rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500">Accounts</p>
          <p className="text-xl font-semibold text-gray-900">{analyticsSummary.totalAccounts || 0}</p>
        </div>
        <div className="border rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500">Active accounts</p>
          <p className="text-xl font-semibold text-blue-700">{analyticsSummary.activeAccounts || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Publishing Health</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{formatMetric(publishedCount)} published</p>
          <p className="mt-1 text-sm text-gray-600">{failedCount > 0 ? `${formatMetric(failedCount)} failures need review` : 'No publish failures recorded in this workspace yet.'}</p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Review Load</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{formatMetric(pendingApprovalCount)} awaiting approval</p>
          <p className="mt-1 text-sm text-gray-600">{formatMetric(operationsSnapshot.summary?.queueCount || 0)} total queue items across drafts and channel queues.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Workspace Readiness</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{formatMetric(activeAccountCount)} active accounts</p>
          <p className="mt-1 text-sm text-gray-600">
            {sourceFailedCount > 0
              ? `${formatMetric(sourceHealthyCount)} healthy sources, ${formatMetric(sourceFailedCount)} failing`
              : `${formatMetric(sourceHealthyCount)} healthy connected sources.`}
          </p>
          {socialConnectedCount === 0 && (
            <p className="mt-2 text-xs text-gray-500">Social analytics stays empty until Threads, Instagram, or YouTube is connected.</p>
          )}
        </div>
      </div>
    </div>
  </>
);

export default AgencyWorkspaceAnalyticsTab;
