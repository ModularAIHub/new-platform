import React from 'react';

const AgencyWorkspaceSetupTab = ({
  workspace,
  canApproveOrPublish,
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
  approvalLink,
  approvalLinks,
  approvalLinkLoading,
  approvalLinkCreating,
  approvalLinkRevokingId,
  approvalLinkLabel,
  setApprovalLinkLabel,
  createApprovalLink,
  refreshApprovalLink,
  copyApprovalLink,
  revokeApprovalLink,
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
            Add logo
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
              <p className="mt-2 text-sm font-semibold text-gray-900 break-all">{workspace.logo_url || 'Add a logo URL for client-facing polish'}</p>
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

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <h3 className="text-sm font-semibold text-emerald-950">Client approval portal copy</h3>
            <p className="mt-1 text-xs text-emerald-800">Control the headline and intro that clients see when they open the no-login review page.</p>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-900">Portal headline</label>
                <input
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                  value={profileContextForm.portal_title || ''}
                  placeholder="Review and approve this week's content"
                  onChange={(event) => setProfileContextForm((prev) => ({ ...prev, portal_title: event.target.value }))}
                  disabled={!canMutate || settingsSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Portal intro</label>
                <textarea
                  className="mt-2 min-h-[96px] w-full rounded-xl border border-gray-200 bg-white px-3 py-3"
                  value={profileContextForm.portal_message || ''}
                  placeholder="Add a short note that explains how the client should review and approve drafts."
                  onChange={(event) => setProfileContextForm((prev) => ({ ...prev, portal_message: event.target.value }))}
                  disabled={!canMutate || settingsSaving}
                />
              </div>
            </div>
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

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <h3 className="text-sm font-semibold text-emerald-950">Client approval portal copy</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-white bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">Headline</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{workspaceSettings.portal_title || 'Review pending social drafts'}</p>
              </div>
              <div className="rounded-xl border border-white bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">Intro</p>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {workspaceSettings.portal_message || 'Approve what is ready, reject anything that needs changes, and leave comments without creating an account.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold px-2 py-1 uppercase tracking-wide">Client Review Link</p>
          <h2 className="text-lg font-semibold text-gray-900 mt-2">No-login approval portal</h2>
          <p className="text-sm text-gray-600 mt-1">Share one secure link so clients can approve, reject, and comment on drafts without creating a SuiteGenie account.</p>
        </div>
        {canApproveOrPublish ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refreshApprovalLink}
              disabled={approvalLinkLoading || approvalLinkCreating}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={createApprovalLink}
              disabled={approvalLinkCreating}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {approvalLinkCreating ? 'Creating...' : approvalLink?.approvalUrl ? 'Create another link' : 'Create link'}
            </button>
          </div>
        ) : null}
      </div>

      {!canApproveOrPublish ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
          Only owners and admins can generate or refresh the client approval link.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <label className="block text-sm font-medium text-gray-900">Link label</label>
                <input
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                  value={approvalLinkLabel}
                  placeholder="Brand manager review link"
                  onChange={(event) => setApprovalLinkLabel(event.target.value)}
                  disabled={approvalLinkCreating}
                />
                <p className="mt-2 text-xs text-gray-500">Create separate labeled links for different reviewers instead of rotating the same URL every time.</p>
              </div>
              <button
                type="button"
                onClick={createApprovalLink}
                disabled={approvalLinkCreating}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {approvalLinkCreating ? 'Creating...' : 'Create labeled link'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                {workspace.logo_url ? (
                  <img
                    src={workspace.logo_url}
                    alt={`${workspace.brand_name || workspace.name} logo`}
                    className="h-14 w-14 rounded-2xl border border-gray-200 bg-white object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
                    {(workspace.brand_name || workspace.name || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Client-facing preview</p>
                  <p className="mt-1 text-base font-semibold text-gray-900">{workspace.brand_name || workspace.name}</p>
                  <p className="mt-1 text-sm text-gray-600">Clients see your workspace brand, logo, review counts, comments, and approval actions without needing a SuiteGenie login.</p>
                </div>
              </div>
              <div className="rounded-xl border border-white bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Portal accent</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {Array.isArray(workspaceSettings.brand_colors) && workspaceSettings.brand_colors.length > 0
                    ? workspaceSettings.brand_colors.join(', ')
                    : 'Default brand accent'}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-white bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Client portal copy</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{workspaceSettings.portal_title || 'Review pending social drafts'}</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {workspaceSettings.portal_message || 'Approve what is ready, reject anything that needs changes, and leave comments without creating an account.'}
              </p>
            </div>
          </div>

          {approvalLink?.approvalUrl ? (
            <>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <p className="text-sm font-semibold text-emerald-900">Newest approval link</p>
                <p className="mt-2 break-all rounded-xl border border-emerald-100 bg-white px-3 py-3 text-sm text-slate-700">
                  {approvalLink.approvalUrl}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyApprovalLink(approvalLink.approvalUrl)}
                    className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-800"
                  >
                    Copy link
                  </button>
                  <a
                    href={approvalLink.approvalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    Open portal
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Label</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{approvalLink.label || 'Client approval link'}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Created</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{approvalLink.created_at ? new Date(approvalLink.created_at).toLocaleString() : 'Just now'}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Last used</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{approvalLink.last_used_at ? new Date(approvalLink.last_used_at).toLocaleString() : 'Not used yet'}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-600">
              No client approval link exists yet. Create one to start collecting approvals and comments without requiring client logins.
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Approval link history</h3>
                <p className="mt-1 text-xs text-gray-600">Keep separate review links for stakeholders, then revoke any link when a review cycle is over.</p>
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {Array.isArray(approvalLinks) ? approvalLinks.filter((item) => item.is_active).length : 0} active
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {(approvalLinks || []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-4 text-sm text-gray-500">
                  No approval links yet.
                </p>
              ) : (
                (approvalLinks || []).map((link) => (
                  <div key={link.id} className="rounded-xl border border-white bg-white px-4 py-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{link.label || 'Client approval link'}</p>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${link.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                            {link.is_active ? 'Active' : 'Revoked'}
                          </span>
                        </div>
                        <p className="mt-2 break-all text-sm text-gray-600">{link.approvalUrl}</p>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                          <span>Created {link.created_at ? new Date(link.created_at).toLocaleString() : 'Just now'}</span>
                          <span>Last used {link.last_used_at ? new Date(link.last_used_at).toLocaleString() : 'Not used yet'}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyApprovalLink(link.approvalUrl)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                        >
                          Copy
                        </button>
                        <a
                          href={link.approvalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                        >
                          Open
                        </a>
                        {link.is_active ? (
                          <button
                            type="button"
                            onClick={() => revokeApprovalLink(link.id)}
                            disabled={approvalLinkRevokingId === String(link.id)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
                          >
                            {approvalLinkRevokingId === String(link.id) ? 'Revoking...' : 'Revoke'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
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
