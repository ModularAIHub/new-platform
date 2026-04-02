import React from 'react';
import {
  Building2,
  FileText,
  ListChecks,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { getWorkspacePlatformLabel } from '../../pages/agencyWorkspaceHelpers.jsx';

const AgencyWorkspaceAnalysisTab = ({
  analysisSummary,
  analysisLoading,
  analysisQueuePressureMeta,
  formatDateTime,
  formatMetric,
  loadAnalysisSummary,
  workspaceCompetitorsInput,
  setWorkspaceCompetitorsInput,
  canWrite,
  settingsSaving,
  saveCompetitorTargets,
  useAnalysisIdeaInComposer,
}) => (
  <div id="agency-workspace-analysis" className="rounded-[28px] border border-white/75 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-700">
          <Sparkles className="h-3.5 w-3.5" />
          Strategy studio
        </span>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">Signal, gaps, and next content opportunities</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Use the workspace itself as a briefing engine: read channel health, watch the queue, and turn that signal into ideas worth publishing.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Refreshed: {analysisSummary.refreshedAt ? formatDateTime(analysisSummary.refreshedAt) : 'Not available'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => loadAnalysisSummary()}
        disabled={analysisLoading}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${analysisLoading ? 'animate-spin' : ''}`} />
        {analysisLoading ? 'Refreshing...' : 'Refresh analysis'}
      </button>
    </div>

    <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-5">
      <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(248,250,252,0.92)_0%,_rgba(255,255,255,0.98)_100%)] px-4 py-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Connected accounts</p>
        <p className="mt-3 text-3xl font-semibold text-slate-950">{formatMetric(analysisSummary.overview?.connectedAccountCount || 0)}</p>
      </div>
      <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(248,250,252,0.92)_0%,_rgba(255,255,255,0.98)_100%)] px-4 py-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Platforms with signal</p>
        <p className="mt-3 text-3xl font-semibold text-slate-950">{formatMetric(analysisSummary.overview?.platformCount || 0)}</p>
      </div>
      <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(248,250,252,0.92)_0%,_rgba(255,255,255,0.98)_100%)] px-4 py-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Competitor targets</p>
        <p className="mt-3 text-3xl font-semibold text-slate-950">{formatMetric(analysisSummary.overview?.competitorTargetCount || 0)}</p>
      </div>
      <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(248,250,252,0.92)_0%,_rgba(255,255,255,0.98)_100%)] px-4 py-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Idea bank</p>
        <p className="mt-3 text-3xl font-semibold text-slate-950">{formatMetric(analysisSummary.overview?.ideaCount || 0)}</p>
      </div>
      <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(248,250,252,0.92)_0%,_rgba(255,255,255,0.98)_100%)] px-4 py-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Queue pressure</p>
        <div className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${analysisQueuePressureMeta.className}`}>
          {analysisQueuePressureMeta.label}
        </div>
      </div>
    </div>

    <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.18fr_0.82fr]">
      <div className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-600" />
          <h3 className="text-base font-semibold text-slate-950">Own analysis</h3>
        </div>
        <p className="mt-1 text-sm text-slate-600">A quick read on what this workspace is already telling us.</p>

        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Top recurring themes</p>
          {(analysisSummary.ownAnalysis?.topThemes || []).length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              Not enough recent workspace copy yet. Publish or queue a few items and the theme layer will sharpen.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {(analysisSummary.ownAnalysis?.topThemes || []).map((theme) => (
                <span key={theme} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {theme}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {(analysisSummary.ownAnalysis?.platformCards || []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              Connect a platform and move a few drafts through the workspace to unlock channel-specific analysis.
            </div>
          ) : (
            (analysisSummary.ownAnalysis?.platformCards || []).map((card) => (
              <div key={card.key} className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(248,250,252,0.7)_0%,_rgba(255,255,255,0.98)_100%)] p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-950">{card.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        card.status === 'ready'
                          ? 'bg-emerald-50 text-emerald-700'
                          : card.status === 'busy'
                            ? 'bg-amber-50 text-amber-700'
                            : card.status === 'warning'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-slate-100 text-slate-600'
                      }`}>
                        {card.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatMetric(card.connectedAccounts || 0)} accounts / {formatMetric(card.postedCount || 0)} posted / {formatMetric(card.queueItems || 0)} queue / {formatMetric(card.scheduledItems || 0)} scheduled
                    </p>
                  </div>
                  {(card.themes || []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(card.themes || []).slice(0, 3).map((theme) => (
                        <span key={`${card.key}-${theme}`} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {(card.strengths || []).length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Strengths</p>
                    <div className="mt-2 space-y-2">
                      {(card.strengths || []).map((item) => (
                        <p key={`${card.key}-strength-${item}`} className="text-sm text-slate-700">{item}</p>
                      ))}
                    </div>
                  </div>
                )}

                {(card.gaps || []).length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">Gaps</p>
                    <div className="mt-2 space-y-2">
                      {(card.gaps || []).map((item) => (
                        <p key={`${card.key}-gap-${item}`} className="text-sm text-slate-700">{item}</p>
                      ))}
                    </div>
                  </div>
                )}

                {(card.nextMoves || []).length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700">Next moves</p>
                    <div className="mt-2 space-y-2">
                      {(card.nextMoves || []).map((item) => (
                        <p key={`${card.key}-next-${item}`} className="text-sm text-slate-700">{item}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {(analysisSummary.ownAnalysis?.summaryNotes || []).length > 0 && (
          <div className="mt-5 rounded-[24px] border border-blue-100 bg-blue-50/80 p-4">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-blue-700" />
              <p className="text-sm font-semibold text-blue-900">What this means right now</p>
            </div>
            <div className="mt-3 space-y-2">
              {(analysisSummary.ownAnalysis?.summaryNotes || []).map((item) => (
                <p key={`analysis-note-${item}`} className="text-sm text-blue-900">{item}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-violet-600" />
            <h3 className="text-base font-semibold text-slate-950">Competitor watchlist</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Auto-detecting is great when the signal is strong, but this stays editable so strategy can stay deliberate.
          </p>
          <textarea
            className="mt-4 min-h-[160px] w-full rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            value={workspaceCompetitorsInput}
            onChange={(event) => setWorkspaceCompetitorsInput(event.target.value)}
            disabled={!canWrite || settingsSaving}
            placeholder="Add competitor handles or profile URLs, separated by commas or new lines"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveCompetitorTargets}
              disabled={!canWrite || settingsSaving}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {settingsSaving ? 'Saving...' : 'Save watchlist'}
            </button>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              analysisSummary.competitors?.status === 'ready'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {analysisSummary.competitors?.status === 'ready' ? 'Configured' : 'Needs targets'}
            </span>
            {Number(analysisSummary.competitors?.autoDetectedCount || 0) > 0 && (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                Auto-detected
              </span>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {(analysisSummary.competitors?.watchlistNotes || []).map((note) => (
              <p key={`watchlist-note-${note}`} className="text-sm text-slate-700">{note}</p>
            ))}
          </div>
          {(analysisSummary.competitors?.targets || []).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {(analysisSummary.competitors?.targets || []).map((target) => (
                <span key={target} className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm text-violet-700">
                  {target}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <h3 className="text-base font-semibold text-slate-950">Source health</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">Which layers are contributing signal to analysis right now.</p>
          <div className="mt-4 space-y-3">
            {(analysisSummary.sourceHealth || []).length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Source health appears once the workspace has connected accounts or shared drafts.
              </p>
            ) : (
              (analysisSummary.sourceHealth || []).map((source) => (
                <div key={`${source.channel}:${source.teamId || 'personal'}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4 text-sm">
                  <div>
                    <p className="font-medium text-slate-950">{String(source.channel || 'source').toUpperCase()}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatMetric(source.queueCount || 0)} queue / {formatMetric(source.calendarCount || 0)} calendar</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    source.status === 'ok'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {source.status === 'ok' ? 'Healthy' : 'Needs attention'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>

    <div className="mt-6 rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-emerald-600" />
        <h3 className="text-base font-semibold text-slate-950">Idea bank</h3>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Generation-ready directions built from workspace context, queue pressure, and the competitor watchlist.
      </p>

      {(analysisSummary.ideaBank || []).length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
          No idea bank yet. Refresh analysis after adding context, accounts, or competitor targets.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {(analysisSummary.ideaBank || []).map((idea) => (
            <div key={idea.id} className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(248,250,252,0.8)_0%,_rgba(255,255,255,0.98)_100%)] p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {String(idea.sourceType || 'idea').replace(/_/g, ' ')}
                  </div>
                  <h4 className="mt-3 text-base font-semibold text-slate-950">{idea.title}</h4>
                  <p className="mt-2 text-sm text-slate-600">{idea.whyItFits}</p>
                </div>
                <button
                  type="button"
                  onClick={() => useAnalysisIdeaInComposer(idea)}
                  disabled={!canWrite}
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-3.5 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  Use in Compose
                </button>
              </div>

              {(idea.recommendedPlatforms || []).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(idea.recommendedPlatforms || []).map((platformKey) => (
                    <span key={`${idea.id}-${platformKey}`} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">
                      {getWorkspacePlatformLabel(platformKey)}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Compose prompt</p>
                <p className="mt-2 text-sm whitespace-pre-wrap text-slate-700">{idea.prompt}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default AgencyWorkspaceAnalysisTab;
