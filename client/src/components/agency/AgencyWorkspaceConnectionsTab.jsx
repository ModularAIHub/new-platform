import React from 'react';
import { RefreshCw } from 'lucide-react';
import AgencyConnectionAccountCard from './AgencyConnectionAccountCard.jsx';
import { WORKSPACE_CONNECTION_PLATFORMS } from '../../pages/agencyWorkspaceHelpers.jsx';

const AgencyWorkspaceConnectionsTab = ({
  canMutate,
  teamPermissions,
  loadData,
  availableAccountsByPlatform,
  attachedAccountsByPlatform,
  connectingPlatform,
  connectWorkspacePlatform,
  detachAccount,
  attachAccount,
  formatMetric,
}) => (
  <div id="agency-workspace-connections" className="rounded-[28px] border border-white/75 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
          Channel registry
        </span>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">Connect, audit, and assign client channels</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Treat channels like managed assets: verify health, confirm permissions, and then attach only the accounts this workspace should use.
        </p>
      </div>
      <button
        type="button"
        onClick={() => loadData()}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh connections
      </button>
    </div>

    <div className="mt-6 grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
      <div className="space-y-4">
        {!teamPermissions?.team_id && (
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-900">Preparing shared connections</p>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              SuiteGenie is still warming the shared connection layer used behind Agency. If this banner remains after a refresh, restart the platform server once.
            </p>
          </div>
        )}

        <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(248,250,252,0.92)_0%,_rgba(255,255,255,0.98)_100%)] p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Guidance</p>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">How channel setup works now</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">1. Create the shared OAuth connection</p>
              <p className="mt-1 text-sm text-slate-600">Start from the platform card so the channel is captured at the agency layer, not under someone's personal profile.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">2. Audit the connection before using it</p>
              <p className="mt-1 text-sm text-slate-600">Review token health, permission scopes, and last sync directly in the account card.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">3. Attach only what this client should touch</p>
              <p className="mt-1 text-sm text-slate-600">Workspace-level attachment keeps composing, scheduling, analytics, and review safely scoped to the client.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {WORKSPACE_CONNECTION_PLATFORMS.map((platform) => {
          const attachedForPlatform = attachedAccountsByPlatform[platform.key] || [];
          const availableForPlatform = availableAccountsByPlatform[platform.key] || [];
          const isConnecting = connectingPlatform === platform.key;
          const providerLabel = ['threads', 'instagram'].includes(platform.key)
            ? 'Meta OAuth shared connection'
            : platform.key === 'youtube'
              ? 'Google OAuth shared connection'
              : 'Shared team OAuth connection';
          const connectLabel = platform.key === 'threads'
            ? 'Connect Threads'
            : platform.key === 'instagram'
              ? 'Connect Instagram'
              : platform.key === 'youtube'
                ? 'Connect YouTube'
                : `Connect ${platform.label}`;

          return (
            <div key={platform.key} className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,_rgba(248,250,252,0.92)_0%,_rgba(239,246,255,0.9)_100%)] px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-sm font-semibold shadow-sm ${platform.theme}`}>
                      {platform.badge}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">{platform.label}</h3>
                      <p className="mt-1 text-sm text-slate-600">{platform.description}</p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">{providerLabel}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => connectWorkspacePlatform(platform.key)}
                    disabled={!canMutate || isConnecting}
                    className="rounded-2xl bg-slate-950 px-3.5 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {isConnecting ? 'Connecting...' : connectLabel}
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">In workspace</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{formatMetric(attachedForPlatform.length)}</p>
                  </div>
                  <div className="rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Ready to add</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{formatMetric(availableForPlatform.length)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-5 py-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Connected in this workspace</p>
                  <div className="mt-3 space-y-3">
                    {attachedForPlatform.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        <p>No {platform.label} account is attached yet.</p>
                        <p className="mt-1 text-xs text-slate-500">Attach one here to unlock compose, queue, calendar, and analytics for this channel.</p>
                      </div>
                    ) : (
                      attachedForPlatform.map((account) => (
                        <AgencyConnectionAccountCard
                          key={account.id}
                          account={account}
                          platformKey={platform.key}
                          variant="attached"
                          primaryActionLabel="Remove"
                          onPrimaryAction={() => detachAccount(account.id)}
                          secondaryActionLabel="Reconnect"
                          onSecondaryAction={() => connectWorkspacePlatform(platform.key)}
                          canMutate={canMutate}
                          connectingPlatform={connectingPlatform}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Existing shared connections</p>
                  <div className="mt-3 space-y-3">
                    {availableForPlatform.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        <p>No shared {platform.label} connections are waiting to be added.</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {platform.key === 'threads' || platform.key === 'instagram'
                            ? `Use ${connectLabel} to start the Meta OAuth flow for this agency team.`
                            : `Use ${connectLabel} to create the next shared team connection.`}
                        </p>
                      </div>
                    ) : (
                      availableForPlatform.map((account) => (
                        <AgencyConnectionAccountCard
                          key={`${account.sourceType || account.source_type}:${account.sourceId || account.source_id}`}
                          account={account}
                          platformKey={platform.key}
                          variant="available"
                          primaryActionLabel="Add to workspace"
                          onPrimaryAction={() => attachAccount(account)}
                          secondaryActionLabel="Reconnect"
                          onSecondaryAction={() => connectWorkspacePlatform(platform.key)}
                          canMutate={canMutate}
                          connectingPlatform={connectingPlatform}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export default AgencyWorkspaceConnectionsTab;
