import React from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  RadioTower,
} from 'lucide-react';
import { CALENDAR_WEEKDAY_LABELS } from './agencyWorkspaceCalendar.js';

const CALENDAR_METRICS = [
  {
    key: 'queue',
    label: 'Queue items',
    valueKey: 'queueCount',
    accent: 'text-blue-700',
    theme: 'border-blue-100 bg-blue-50/70',
  },
  {
    key: 'calendar',
    label: 'Calendar posts',
    valueKey: 'calendarCount',
    accent: 'text-violet-700',
    theme: 'border-violet-100 bg-violet-50/70',
  },
  {
    key: 'healthy',
    label: 'Healthy sources',
    valueKey: 'sourceHealthyCount',
    accent: 'text-emerald-700',
    theme: 'border-emerald-100 bg-emerald-50/70',
  },
  {
    key: 'failed',
    label: 'Failed sources',
    valueKey: 'sourceFailedCount',
    accent: 'text-rose-700',
    theme: 'border-rose-100 bg-rose-50/70',
  },
];

const AgencyWorkspaceCalendarPanel = ({
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
  formatDateTime,
}) => (
  <div className="space-y-4 sm:space-y-5">
    <div className="rounded-[26px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(246,250,255,0.98)_100%)] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
            Planning view
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Queue and calendar command center</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            See the entire publishing flow in one place: pipeline pressure, scheduled inventory, and source reliability across attached client channels.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Last refresh</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {operationsSnapshot.summary?.lastRefreshedAt ? formatDateTime(operationsSnapshot.summary.lastRefreshedAt) : 'Not available'}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {CALENDAR_METRICS.map((metric) => (
          <div key={metric.key} className={`rounded-2xl border px-4 py-4 ${metric.theme}`}>
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{metric.label}</p>
            <p className={`mt-3 text-3xl font-semibold ${metric.accent}`}>
              {operationsSnapshot.summary?.[metric.valueKey] || 0}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="inline-flex w-full rounded-2xl border border-slate-200 bg-slate-100/80 p-1 sm:w-auto">
          <button
            type="button"
            onClick={() => setOperationsView('queue')}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition sm:flex-none ${
              operationsView === 'queue'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            <ListChecks className="h-4 w-4" />
            Queue
          </button>
          <button
            type="button"
            onClick={() => setOperationsView('calendar')}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition sm:flex-none ${
              operationsView === 'calendar'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </button>
        </div>

        <p className="text-sm text-slate-500">
          {operationsView === 'queue'
            ? 'Review approval pressure and unscheduled work before it slips.'
            : 'Use the month view to spot posting clusters and quiet days.'}
        </p>
      </div>
    </div>

    {operationsView === 'queue' ? (
      <div className="rounded-[26px] border border-slate-200/80 bg-white/92 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Workspace queue</h3>
            <p className="mt-1 text-sm text-slate-600">Everything waiting to be scheduled, approved, or pushed across connected channels.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            {(operationsSnapshot.queue || []).length} items
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {(operationsSnapshot.queue || []).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No queue items in attached workspace channels.
            </p>
          ) : (
            (operationsSnapshot.queue || []).map((item) => (
              <div key={`${item.platform}:${item.id}`} className="rounded-[26px] border border-slate-200 bg-slate-50/70 px-4 py-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                      {item.platform}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                      {item.status || 'pending'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">Workspace queue</span>
                </div>
                {item.title && <p className="mt-3 text-sm font-semibold text-slate-950">{item.title}</p>}
                <p className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-wrap">{String(item.content || '').slice(0, 280)}</p>
                <p className="mt-3 text-xs text-slate-500">
                  {item.scheduledFor ? `Suggested or scheduled: ${formatDateTime(item.scheduledFor)}` : 'No suggested time'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    ) : (
      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr] xl:gap-5">
        <div className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:rounded-[30px]">
          {(operationsSnapshot.calendar || []).length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-lg font-semibold text-slate-950">No scheduled posts yet</p>
              <p className="mt-2 text-sm text-slate-500">Scheduled calendar posts from attached workspace channels will appear here.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(37,99,235,0.92)_100%)] px-5 py-4 text-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{calendarMonthGrid.label}</p>
                    <p className="mt-1 text-xs text-slate-200">Month view for approved and scheduled workspace activity.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCalendarMonthCursor((previous) => shiftCalendarMonthKey(previous, -1))}
                      className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-2.5 py-2 text-white transition hover:bg-white/16"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarMonthCursor(getCalendarMonthKey(new Date()))}
                      className="rounded-xl border border-white/15 bg-white px-3 py-2 text-xs font-medium text-slate-900 transition hover:bg-slate-100"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarMonthCursor((previous) => shiftCalendarMonthKey(previous, 1))}
                      className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-2.5 py-2 text-white transition hover:bg-white/16"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="block md:hidden">
                <div className="space-y-3 p-4">
                  {(operationsSnapshot.calendar || []).slice(0, 8).map((item) => (
                    <button
                      key={`mobile-calendar:${item.platform}:${item.id}`}
                      type="button"
                      onClick={() => item.scheduledFor && setSelectedCalendarDateKey(String(item.scheduledFor).slice(0, 10))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-left"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                            {item.platform}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                            {item.status || 'scheduled'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {item.scheduledFor ? formatDateTime(item.scheduledFor) : formatDateTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-700 whitespace-pre-wrap">{String(item.content || '').slice(0, 180)}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="hidden md:grid md:grid-cols-7 border-b border-slate-200 bg-slate-50/70">
                {CALENDAR_WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {label}
                  </div>
                ))}
              </div>

              <div className="hidden bg-white md:grid md:grid-cols-7">
                {calendarMonthGrid.weeks.flat().map((cell) => {
                  const isActiveDay = visibleCalendarDateKey && cell.dateKey === visibleCalendarDateKey;

                  return (
                    <button
                      key={cell.dateKey}
                      type="button"
                      onClick={() => cell.items.length > 0 && setSelectedCalendarDateKey(cell.dateKey)}
                      className={`min-h-[124px] border-b border-r border-slate-100 p-2 text-left align-top transition ${
                        cell.inMonth ? 'bg-white' : 'bg-slate-50/80 text-slate-400'
                      } ${isActiveDay ? 'ring-2 ring-inset ring-blue-500' : ''} ${cell.items.length > 0 ? 'hover:bg-blue-50/35' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                          cell.isToday
                            ? 'bg-slate-950 text-white'
                            : cell.inMonth
                              ? 'text-slate-900'
                              : 'text-slate-400'
                        }`}
                        >
                          {cell.label}
                        </span>
                        {cell.items.length > 0 && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                            {cell.items.length}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        {cell.items.slice(0, 2).map((item) => (
                          <div key={`${cell.dateKey}:${item.platform}:${item.id}`} className="rounded-lg bg-blue-50 px-2 py-1.5 text-[11px] text-blue-800">
                            <p className="font-medium uppercase tracking-wide">{item.platform}</p>
                            <p className="mt-0.5 truncate">{String(item.content || '').slice(0, 42)}</p>
                          </div>
                        ))}
                        {cell.items.length > 2 && (
                          <p className="text-[11px] text-slate-500">+{cell.items.length - 2} more</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="space-y-4 sm:space-y-5">
          <div className="rounded-[26px] border border-slate-200/80 bg-white/92 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Day agenda</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {visibleCalendarDateKey
                    ? new Date(`${visibleCalendarDateKey}T00:00:00`).toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                    : 'Scheduled activity'}
                </p>
                <p className="mt-1 text-sm text-slate-500">Select a date with posts to inspect the scheduled items for that day.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                {visibleCalendarItems.length} item{visibleCalendarItems.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {visibleCalendarItems.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No scheduled posts on the selected day yet.
                </p>
              ) : (
                visibleCalendarItems.map((item) => (
                  <div key={`${item.platform}:${item.id}`} className="rounded-[24px] border border-slate-200 bg-slate-50/70 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                          {item.platform}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                          {item.status || 'scheduled'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {item.scheduledFor ? formatDateTime(item.scheduledFor) : formatDateTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700 whitespace-pre-wrap">{String(item.content || '').slice(0, 280)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {(operationsSnapshot.sources || []).length > 0 && (
            <div id="agency-workspace-source-health" className="rounded-[26px] border border-slate-200/80 bg-white/92 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <RadioTower className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Source health</p>
                  <p className="mt-2 text-base font-semibold text-slate-950">Connected channel reliability</p>
                  <p className="mt-1 text-sm text-slate-500">Catch broken publishing sources before they slow down the client schedule.</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {(operationsSnapshot.sources || []).map((source) => (
                  <div key={`${source.channel}:${source.teamId || 'personal'}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm">
                    <p className="text-slate-700">
                      <span className="font-semibold uppercase text-slate-900">{source.channel}</span>
                      <span className="text-slate-500">{source.teamId ? ` / team ${source.teamId}` : ' / personal'}</span>
                    </p>
                    {source.status === 'ok' ? (
                      <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        ok / q:{source.queueCount} c:{source.calendarCount}
                      </span>
                    ) : (
                      <span className="rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                        failed / {source.error || source.code || 'unknown'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

export default AgencyWorkspaceCalendarPanel;
