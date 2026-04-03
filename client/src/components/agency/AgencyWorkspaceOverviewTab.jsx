import React from 'react';
import {
  getWorkspacePlatformLabel,
  WORKSPACE_OVERVIEW_ACTIONS,
  WORKSPACE_OVERVIEW_HIGHLIGHTS,
} from '../../pages/agencyWorkspaceHelpers';

const AgencyWorkspaceOverviewTab = ({
  workspace,
  profileForm,
  workspaceStatusMeta,
  attachedAccounts,
  lastActiveAt,
  formatDateTime,
  formatMetric,
  pendingApprovalCount,
  openPendingApprovals,
  openFailedSources,
  sourceFailedCount,
  workspaceControlMetrics,
  recentActivityEntries,
  focusSection,
}) => (
  <div id="agency-workspace-overview" className="rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96)_0%,_rgba(244,248,255,0.98)_100%)] p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:rounded-[32px] sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
          Workspace Briefing
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Client operations control center</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Run setup, connections, composing, scheduling, analytics, and team access directly here without leaving the Agency workspace.
        </p>
      </div>
      <div className={`rounded-full border px-3 py-2 text-xs shadow-sm ${workspaceStatusMeta.className}`}>
        Workspace status: <span className="font-semibold">{workspaceStatusMeta.label}</span>
      </div>
    </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.08fr_0.92fr] xl:gap-5">
      <div className="rounded-[24px] border border-slate-200/80 bg-slate-950 p-4 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:rounded-[28px] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100">
              Agency Pro
            </p>
            <h3 className="mt-3 text-xl font-semibold">{workspace.brand_name || workspace.name}</h3>
            <p className="mt-1 text-sm text-slate-300">Workspace for {workspace.name}.</p>
          </div>
          {(workspace.logo_url || profileForm.logo_url) ? (
            <img
              src={workspace.logo_url || profileForm.logo_url}
              alt={`${workspace.name} logo`}
              className="h-16 w-16 rounded-2xl border border-white/10 bg-white object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-center text-xs text-slate-300">
              No logo
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Plan</p>
            <p className="mt-2 text-sm font-semibold text-cyan-100">Agency Pro</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Connected accounts</p>
            <p className="mt-2 text-2xl font-semibold text-white">{formatMetric(attachedAccounts.length)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Last active</p>
            <p className="mt-2 text-sm font-semibold text-white">{lastActiveAt ? formatDateTime(lastActiveAt) : 'No recent activity'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-[28px] sm:p-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Quick actions</h3>
        <p className="mt-2 text-base font-semibold text-slate-950">Reduce time-to-action for this client.</p>

        <div className="mt-4 grid gap-3">
          <button
            type="button"
            onClick={() => focusSection('compose')}
            className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md"
          >
            <p className="text-sm font-semibold text-slate-900">Compose new post</p>
            <p className="mt-1 text-sm text-slate-600">Open the composer and create the next draft quickly.</p>
          </button>
          <button
            type="button"
            onClick={openPendingApprovals}
            className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-white hover:shadow-md"
          >
            <p className="text-sm font-semibold text-slate-900">View pending approvals</p>
            <p className="mt-1 text-sm text-slate-600">
              {pendingApprovalCount > 0 ? `${formatMetric(pendingApprovalCount)} approvals waiting right now.` : 'Jump straight into the review queue.'}
            </p>
          </button>
          <button
            type="button"
            onClick={openFailedSources}
            className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-white hover:shadow-md"
          >
            <p className="text-sm font-semibold text-slate-900">Check failed sources</p>
            <p className="mt-1 text-sm text-slate-600">
              {sourceFailedCount > 0 ? `${formatMetric(sourceFailedCount)} source failures need attention.` : 'All connected sources are currently healthy.'}
            </p>
          </button>
        </div>
      </div>
    </div>

    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {workspaceControlMetrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <div key={metric.label} className={`rounded-[26px] border border-white/80 border-l-4 ${metric.borderTheme} bg-white/92 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)]`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                <p className={`mt-3 text-3xl font-semibold ${metric.accent}`}>{formatMetric(metric.value)}</p>
              </div>
              <div className={`rounded-2xl p-3 ${metric.iconTheme}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">{metric.context}</p>
            <p className="mt-1 text-xs text-slate-500">{metric.hint}</p>
          </div>
        );
      })}
    </div>

    <div className="mt-6 grid gap-4 xl:grid-cols-[1.08fr_0.92fr] xl:gap-5">
      <div className="rounded-[24px] border border-white/80 bg-white/82 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-[28px] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Recent activity</h3>
            <p className="mt-2 text-base font-semibold text-slate-950">The latest drafting, approval, and publishing actions in this workspace.</p>
          </div>
          <button
            type="button"
            onClick={() => focusSection('calendar')}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            Open review flow
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {recentActivityEntries.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No recent workspace activity yet. Connect accounts or create the first draft to start the timeline.
            </p>
          ) : (
            recentActivityEntries.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${item.tone}`}>
                      {item.actionLabel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                      {getWorkspacePlatformLabel(item.platform)}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-slate-900">{item.detail}</p>
                </div>
                  <p className="shrink-0 text-xs text-slate-500 sm:text-right">{formatDateTime(item.timestamp)}</p>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-4 sm:rounded-[28px] sm:p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">Getting started</h3>
          <p className="mt-2 text-base font-semibold text-slate-950">Use this flow if you are testing a new client workspace.</p>

          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-white bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700">1. Setup</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Finish identity, AI context, and the client approval link.</p>
            </div>
            <div className="rounded-2xl border border-white bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700">2. Connect</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Attach channels and assign teammates so the workspace is ready to operate.</p>
            </div>
            <div className="rounded-2xl border border-white bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700">3. Run</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Draft in Compose, send for approval, then move approved work into Calendar.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/80 bg-white/82 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-[28px] sm:p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">How this workspace works</h3>
          <p className="mt-2 text-base font-semibold text-slate-950">A clearer flow for connections, approvals, and publishing.</p>

          <div className="mt-4 grid gap-4">
            {WORKSPACE_OVERVIEW_HIGHLIGHTS.map((card) => {
              const Icon = card.icon;

              return (
                <div key={card.title} className={`rounded-2xl border bg-gradient-to-br ${card.theme} p-4 transition hover:-translate-y-0.5 hover:shadow-md`}>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">{card.title}</h4>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 sm:rounded-[28px] sm:p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Jump into work</h3>
          <p className="mt-2 text-base font-semibold text-slate-950">Move straight to the part of the workspace you need.</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {WORKSPACE_OVERVIEW_ACTIONS.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => focusSection(action.key)}
                  className="rounded-2xl border border-white bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AgencyWorkspaceOverviewTab;
