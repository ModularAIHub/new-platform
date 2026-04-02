import React from 'react';

const AgencyWorkspaceSetupTab = ({
  workspace,
  profileEditing,
  profileForm,
  setProfileForm,
  profileSaving,
  canMutate,
  saveOverview,
  cancelProfileEditing,
  workspaceSettings,
  profileContextEditing,
  setProfileContextEditing,
  profileContextForm,
  setProfileContextForm,
  settingsSaving,
  addTonePresetRow,
  updateTonePresetRow,
  removeTonePresetRow,
  saveProfileContext,
  cancelProfileContextEditing,
  formatMetric,
  updateStatus,
  confirmArchiveWorkspace,
}) => (
  <>
    <div id="agency-workspace-setup" className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-1 uppercase tracking-wide">Client Profile</p>
          <h2 className="text-lg font-semibold text-gray-900 mt-2">Workspace Identity</h2>
          <p className="text-sm text-gray-600 mt-1">Use this page for the basics that actually define this client workspace.</p>
        </div>
        {(profileEditing ? profileForm.logo_url : workspace.logo_url) ? (
          <img
            src={profileEditing ? profileForm.logo_url : workspace.logo_url}
            alt={`${workspace.name} logo`}
            className="h-16 w-16 rounded-xl object-cover border border-gray-200 bg-white"
          />
        ) : (
          <div className="h-16 w-16 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-xs text-gray-500 text-center px-2">
            No logo
          </div>
        )}
      </div>

      <div className="border rounded-xl p-4 bg-gray-50 mt-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Client identity</h3>
            <p className="text-xs text-gray-600 mt-1">These details define the shared workspace everyone operates from.</p>
          </div>
          {canMutate && !profileEditing && (
            <button
              type="button"
              onClick={() => setProfileEditing(true)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
            >
              Edit identity
            </button>
          )}
        </div>

        {profileEditing ? (
          <form onSubmit={saveOverview} className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <input
              className="border rounded-lg px-3 py-2 bg-white"
              value={profileForm.name}
              placeholder="Workspace name"
              onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={!canMutate || profileSaving}
            />
            <input
              className="border rounded-lg px-3 py-2 bg-white"
              value={profileForm.brand_name}
              placeholder="Brand name"
              onChange={(e) => setProfileForm((prev) => ({ ...prev, brand_name: e.target.value }))}
              disabled={!canMutate || profileSaving}
            />
            <input
              className="border rounded-lg px-3 py-2 bg-white"
              value={profileForm.timezone}
              placeholder="Timezone"
              onChange={(e) => setProfileForm((prev) => ({ ...prev, timezone: e.target.value }))}
              disabled={!canMutate || profileSaving}
            />
            <input
              className="border rounded-lg px-3 py-2 bg-white"
              value={profileForm.logo_url}
              placeholder="Logo URL (optional)"
              onChange={(e) => setProfileForm((prev) => ({ ...prev, logo_url: e.target.value }))}
              disabled={!canMutate || profileSaving}
            />
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <button
                disabled={!canMutate || profileSaving}
                className="rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
              >
                {profileSaving ? 'Saving...' : 'Save Workspace Identity'}
              </button>
              <button
                type="button"
                onClick={cancelProfileEditing}
                disabled={profileSaving}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 gap-3 mt-4 md:grid-cols-2">
            <div className="rounded-xl border border-white bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Workspace name</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{workspace.name || 'Not set'}</p>
            </div>
            <div className="rounded-xl border border-white bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Brand name</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{workspace.brand_name || 'Not set'}</p>
            </div>
            <div className="rounded-xl border border-white bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Timezone</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{workspace.timezone || 'Not set'}</p>
            </div>
            <div className="rounded-xl border border-white bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Logo URL</p>
              <p className="mt-2 text-sm font-semibold text-gray-900 break-all">{workspace.logo_url || 'No logo URL set'}</p>
            </div>
          </div>
        )}
      </div>
    </div>

    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold px-2 py-1 uppercase tracking-wide">AI Brand Context</p>
          <h2 className="text-lg font-semibold text-gray-900 mt-2">Client Voice + Audience</h2>
          <p className="text-sm text-gray-600 mt-1">We now auto-detect brand context from connected accounts and recent workspace activity, then you can refine it if needed.</p>
        </div>
        {canMutate && !profileContextEditing && (
          <button
            type="button"
            onClick={() => setProfileContextEditing(true)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
          >
            Edit AI context
          </button>
        )}
      </div>

      {profileContextEditing ? (
        <div className="mt-5 space-y-4">
          {workspaceSettings.detected_context?.status === 'applied' && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              These fields were auto-filled from the connected account profile data and current workspace signals. Edit anything that needs a tighter client-specific spin.
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-900">Industry</label>
              <input
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                value={profileContextForm.industry}
                placeholder="Anime merch, SaaS, DTC skincare..."
                onChange={(event) => setProfileContextForm((prev) => ({ ...prev, industry: event.target.value }))}
                disabled={!canMutate || settingsSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900">Brand colors</label>
              <input
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                value={profileContextForm.brand_colors}
                placeholder="Blue, black, warm cream"
                onChange={(event) => setProfileContextForm((prev) => ({ ...prev, brand_colors: event.target.value }))}
                disabled={!canMutate || settingsSaving}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900">Target audience</label>
            <textarea
              className="mt-2 min-h-[104px] w-full rounded-xl border border-gray-200 bg-white px-3 py-3"
              value={profileContextForm.target_audience}
              placeholder="Our audience is..."
              onChange={(event) => setProfileContextForm((prev) => ({ ...prev, target_audience: event.target.value }))}
              disabled={!canMutate || settingsSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900">Brand notes for AI</label>
            <textarea
              className="mt-2 min-h-[120px] w-full rounded-xl border border-gray-200 bg-white px-3 py-3"
              value={profileContextForm.profile_notes}
              placeholder="What should AI remember about this brand, product angle, positioning, or no-go language?"
              onChange={(event) => setProfileContextForm((prev) => ({ ...prev, profile_notes: event.target.value }))}
              disabled={!canMutate || settingsSaving}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Saved tone presets</h3>
                <p className="mt-1 text-xs text-gray-600">Create up to 5 named tones that appear in the Compose dropdown.</p>
              </div>
              <button
                type="button"
                onClick={addTonePresetRow}
                disabled={!canMutate || settingsSaving || profileContextForm.tone_presets.length >= 5}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 disabled:opacity-50"
              >
                Add preset
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {profileContextForm.tone_presets.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-4 text-sm text-gray-500">
                  No custom tone presets yet. Add a named voice like "Casual Fridays" or "Product Launch".
                </p>
              ) : (
                profileContextForm.tone_presets.map((preset, index) => (
                  <div key={`tone-preset-${index}`} className="rounded-xl border border-white bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-start">
                      <input
                        className="rounded-lg border border-gray-200 px-3 py-2"
                        value={preset.name || ''}
                        placeholder="Preset name"
                        onChange={(event) => updateTonePresetRow(index, 'name', event.target.value)}
                        disabled={!canMutate || settingsSaving}
                      />
                      <textarea
                        className="min-h-[88px] rounded-xl border border-gray-200 px-3 py-3"
                        value={preset.guidance || ''}
                        placeholder="Describe the voice, pacing, and style this preset should follow."
                        onChange={(event) => updateTonePresetRow(index, 'guidance', event.target.value)}
                        disabled={!canMutate || settingsSaving}
                      />
                      <button
                        type="button"
                        onClick={() => removeTonePresetRow(index)}
                        disabled={!canMutate || settingsSaving}
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-red-700 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveProfileContext}
              disabled={!canMutate || settingsSaving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {settingsSaving ? 'Saving...' : 'Save AI Context'}
            </button>
            <button
              type="button"
              onClick={cancelProfileContextEditing}
              disabled={settingsSaving}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {workspaceSettings.detected_context?.status === 'applied' && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              This client context was auto-detected from connected account signals and recent workspace activity. You can edit it any time.
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Industry</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{workspaceSettings.industry || 'Not set'}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Brand colors</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {Array.isArray(workspaceSettings.brand_colors) && workspaceSettings.brand_colors.length > 0
                  ? workspaceSettings.brand_colors.join(', ')
                  : 'Not set'}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Target audience</p>
              <p className="mt-2 text-sm font-semibold text-gray-900 line-clamp-3">{workspaceSettings.target_audience || 'Not set'}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Tone presets</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{formatMetric((workspaceSettings.tone_presets || []).length)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Brand notes for AI</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {workspaceSettings.profile_notes || 'No extra brand notes saved yet.'}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Saved tone presets</h3>
            {(workspaceSettings.tone_presets || []).length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No custom tone presets saved yet. Compose will use the default tones until you add some.</p>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                {(workspaceSettings.tone_presets || []).map((preset) => (
                  <div key={preset.name} className="rounded-xl border border-white bg-white px-4 py-3 shadow-sm">
                    <p className="text-sm font-semibold text-gray-900">{preset.name}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{preset.guidance || 'No extra guidance saved.'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Workspace Status</h2>
      <p className="text-sm text-gray-600 mb-4">Pause or archive the client when you want to stop active work without deleting its history.</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => updateStatus('active')} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Activate</button>
        <button onClick={() => updateStatus('paused')} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">Pause</button>
      </div>

      <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">Archive workspace</p>
        <p className="mt-1 text-sm text-red-700">This is a destructive state change. Active work stops, but history stays available.</p>
        <button
          type="button"
          onClick={confirmArchiveWorkspace}
          className="mt-4 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Archive Workspace
        </button>
      </div>
    </div>
  </>
);

export default AgencyWorkspaceSetupTab;
