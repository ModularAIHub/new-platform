import React from 'react';
import { ArrowLeft, CalendarDays, Menu, PenSquare, X } from 'lucide-react';
import { WORKSPACE_SECTION_DEFINITIONS } from '../../pages/agencyWorkspaceHelpers';

const SECTION_SUMMARIES = {
  overview: 'Workspace brief and recent movement',
  setup: 'Brand system, context, and workspace status',
  compose: 'Draft and generate client content',
  calendar: 'Queue, schedule, and source health',
  analysis: 'Ideas, signals, and competitor discovery',
  analytics: 'Performance and engagement signals',
  connections: 'Connected channels and permissions',
  team: 'Workspace seats and access control',
};

const STAT_CARDS = [
  { key: 'connected', label: 'Connected channels', helper: 'Live destinations available for drafting and publishing.' },
  { key: 'drafts', label: 'Drafts in motion', helper: 'Shared work currently moving through the workspace.' },
  { key: 'reviews', label: 'Waiting for review', helper: 'Items blocked on owner or admin approval.' },
  { key: 'activity', label: 'Latest activity', helper: 'Most recent drafting or publishing movement.' },
];

const AgencyWorkspaceShell = ({
  workspace,
  workspaceStatusMeta,
  attachedAccounts,
  workspaceDrafts,
  analyticsSummary,
  pendingApprovalCount,
  lastActiveAt,
  formatDateTime,
  formatMetric,
  workspaceCompletionPercent,
  workspaceCompletionCount,
  workspaceChecklist,
  nextRecommendedAction,
  activeWorkspaceTab,
  focusSection,
  onBackToHub,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const statValues = {
    connected: formatMetric(attachedAccounts.length),
    drafts: formatMetric(workspaceDrafts.length || analyticsSummary.drafts || 0),
    reviews: formatMetric(pendingApprovalCount),
    activity: lastActiveAt ? formatDateTime(lastActiveAt) : 'No activity yet',
  };

  const mobileFocusSection = (sectionKey) => {
    focusSection(sectionKey);
    setMobileMenuOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(248,250,252,0.98)_100%)] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.06)] lg:hidden">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={onBackToHub}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Hub
            </button>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${workspaceStatusMeta.className}`}>
                {workspaceStatusMeta.label}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((previous) => !previous)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                aria-label={mobileMenuOpen ? 'Close workspace menu' : 'Open workspace menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{workspace.brand_name || workspace.name}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{workspace.name}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Run this client from one calmer workspace, without dragging desktop chrome onto mobile.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => mobileFocusSection('compose')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <PenSquare className="h-4 w-4" />
              Compose
            </button>
            <button
              type="button"
              onClick={() => mobileFocusSection('calendar')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {STAT_CARDS.slice(0, 4).map((card) => (
              <div key={card.key} className="rounded-[20px] border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
                <p className={`mt-2 font-semibold tracking-tight text-slate-950 ${card.key === 'activity' ? 'text-sm leading-5' : 'text-xl'}`}>
                  {statValues[card.key]}
                </p>
              </div>
            ))}
          </div>

          {mobileMenuOpen && (
            <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-3">
              <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Readiness</p>
                    <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{workspaceCompletionPercent}% operational</p>
                    <p className="mt-1 text-sm text-slate-600">{workspaceCompletionCount}/{workspaceChecklist.length} workflow steps complete.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => mobileFocusSection(nextRecommendedAction.key)}
                    className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-medium text-white"
                  >
                    {nextRecommendedAction.cta}
                  </button>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,_#0f172a_0%,_#2563eb_55%,_#14b8a6_100%)]"
                    style={{ width: `${workspaceCompletionPercent}%` }}
                  />
                </div>
              </div>

              <div className="rounded-[20px] border border-slate-200 bg-white p-2 shadow-sm">
                <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace menu</p>
                <div className="space-y-2">
                  {WORKSPACE_SECTION_DEFINITIONS.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeWorkspaceTab === section.key;

                    return (
                      <button
                        key={section.key}
                        type="button"
                        onClick={() => mobileFocusSection(section.key)}
                        className={`flex w-full items-start gap-3 rounded-[18px] px-3 py-3 text-left transition ${
                          isActive
                            ? 'bg-slate-950 text-white shadow-lg'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`rounded-2xl p-2 ${isActive ? 'bg-white/10 text-white' : 'bg-white text-slate-700'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{section.label}</p>
                          <p className={`mt-1 text-xs leading-5 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                            {SECTION_SUMMARIES[section.key]}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(248,250,252,0.98)_100%)] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5 lg:block">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onBackToHub}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Agency Hub
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                Agency workspace
              </span>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${workspaceStatusMeta.className}`}>
                {workspaceStatusMeta.label}
              </span>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] xl:gap-5">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{workspace.brand_name || workspace.name}</p>
                <h1 className="mt-1 break-words text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{workspace.name}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Plan, approve, publish, and monitor this client from one calmer operating surface.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={() => focusSection('compose')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 sm:w-auto"
                >
                  <PenSquare className="h-4 w-4" />
                  New draft
                </button>
                <button
                  type="button"
                  onClick={() => focusSection('calendar')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                >
                  <CalendarDays className="h-4 w-4" />
                  Open calendar
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Recommended next move</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{nextRecommendedAction.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{nextRecommendedAction.description}</p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={() => focusSection(nextRecommendedAction.key)}
                  className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-slate-100 sm:w-auto"
                >
                  {nextRecommendedAction.cta}
                </button>
                <button
                  type="button"
                  onClick={() => focusSection('overview')}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 sm:w-auto"
                >
                  Review workspace
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {STAT_CARDS.map((card) => (
              <div key={card.key} className={`rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm ${card.key === 'activity' ? 'sm:col-span-2 xl:col-span-1' : ''}`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{card.label}</p>
                <p className={`mt-3 font-semibold tracking-tight text-slate-950 ${card.key === 'activity' ? 'text-lg leading-7 sm:text-xl' : 'text-2xl'}`}>{statValues[card.key]}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{card.helper}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] xl:gap-5">
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:rounded-[28px] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace readiness</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{workspaceCompletionPercent}% operational</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                A quick read on whether this client is fully set up for planning, approvals, and publishing.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Completed</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{workspaceCompletionCount}/{workspaceChecklist.length}</p>
            </div>
          </div>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,_#0f172a_0%,_#2563eb_55%,_#14b8a6_100%)]"
              style={{ width: `${workspaceCompletionPercent}%` }}
            />
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {workspaceChecklist.map((step) => (
              <button
                key={step.key}
                type="button"
                onClick={() => focusSection(step.key)}
                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-left transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${step.complete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {step.complete ? 'Done' : 'Next'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-[26px] border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:rounded-[28px]">
          <div className="mb-3 px-2 pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace navigation</p>
            <p className="mt-1 text-sm text-slate-600">Move between planning, operations, insights, and access control.</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {WORKSPACE_SECTION_DEFINITIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeWorkspaceTab === section.key;

              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => focusSection(section.key)}
                  className={`min-w-0 rounded-[22px] border px-3 py-3 text-left transition sm:px-4 sm:py-4 ${
                    isActive
                      ? 'border-slate-950 bg-slate-950 text-white shadow-lg'
                      : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-blue-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-2xl p-2 sm:p-2.5 ${isActive ? 'bg-white/10 text-white' : 'bg-white text-slate-700'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{section.label}</p>
                      <p className={`mt-1 line-clamp-2 text-xs leading-5 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                        {SECTION_SUMMARIES[section.key]}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyWorkspaceShell;
