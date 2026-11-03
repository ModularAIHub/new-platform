import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  getConnectionGrantedScopes,
  getConnectionHandleLabel,
  getConnectionLastSyncedLabel,
  getConnectionTokenHealthMeta,
  getWorkspaceAccountLabel,
  getWorkspacePlatformIcon,
  getWorkspacePlatformLabel,
} from '../../pages/agencyWorkspaceHelpers.jsx';

const AgencyConnectionAccountCard = ({
  account,
  platformKey,
  variant,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionClassName = 'text-xs border border-slate-200 bg-white text-slate-700 rounded-xl px-3 py-1.5 disabled:opacity-50',
  canMutate,
  connectingPlatform,
}) => {
  const tokenHealth = getConnectionTokenHealthMeta(account);
  const grantedScopes = getConnectionGrantedScopes(account);
  const handleLabel = getConnectionHandleLabel(account);
  const label = getWorkspaceAccountLabel(account);
  const isAttached = variant === 'attached';

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96)_0%,_rgba(248,250,252,0.94)_100%)] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm">
              {getWorkspacePlatformIcon(platformKey, 'h-4 w-4')}
            </span>
            <p className="truncate text-sm font-semibold text-slate-950">{label}</p>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {getWorkspacePlatformLabel(platformKey)} / {handleLabel}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm ${tokenHealth.className}`}>
          {tokenHealth.label === 'Reconnect Needed' ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          {tokenHealth.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-xs text-slate-600 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white px-3 py-3">
          <p className="font-medium uppercase tracking-wide text-slate-500">Last synced</p>
          <p className="mt-1">{getConnectionLastSyncedLabel(account)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white px-3 py-3">
          <p className="font-medium uppercase tracking-wide text-slate-500">Token health</p>
          <p className="mt-1">{tokenHealth.detail}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Granted permissions</p>
        {grantedScopes.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {grantedScopes.map((scope) => (
              <span key={scope} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 shadow-sm">
                {scope}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
            Permission details are not stored for this legacy connection yet.
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {primaryActionLabel && onPrimaryAction && (
          <button
            type="button"
            onClick={onPrimaryAction}
            disabled={!canMutate}
            className={`text-xs rounded-xl px-3 py-2 disabled:opacity-50 ${
              isAttached
                ? 'border border-rose-200 bg-rose-50 text-rose-700'
                : 'bg-slate-950 text-white shadow-sm'
            }`}
          >
            {primaryActionLabel}
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            disabled={!canMutate || connectingPlatform === platformKey}
            className={secondaryActionClassName}
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default AgencyConnectionAccountCard;
