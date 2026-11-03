import {
  countCharacters,
  getWorkspaceAccountLabel,
  getWorkspacePlatformLabel,
  splitTextByCharacterLimit,
  WORKSPACE_PLATFORM_LIMITS,
} from '../../pages/agencyWorkspaceHelpers';

const AgencyWorkspaceComposeTab = (props) => {
  const {
    workspace,
    canWrite,
    currentWorkspaceRole,
    attachedAccounts,
    selectedTargetAccounts,
    setActiveWorkspaceTab,
    generationStyle,
    generationModeOptions,
    toggleGenerationMode,
    composeWriteLocked,
    draftActionKey,
    refiningContent,
    selectedGenerationModes,
    selectedGenerationServiceLabel,
    activeGenerationModes,
    primaryGenerationMode,
    publisherContent,
    setPublisherContent,
    publishing,
    selectedPlatformCounters,
    showTwitterThreadPreview,
    twitterThreadParts,
    composerActionHint,
    setPublisherTargets,
    canApproveOrPublish,
    composerScheduleFor,
    setComposerScheduleFor,
    sendComposerForApproval,
    scheduleComposerContent,
    publishFromWorkspace,
    uploadedMedia,
    removeUploadedMedia,
    publisherTargets,
    showPromptInput,
    setShowPromptInput,
    hasComposerContent,
    generationPrompt,
    setGenerationPrompt,
    generationToneOptions,
    selectedToneOption,
    setGenerationStyle,
    refineWorkspaceContent,
    mediaInputRef,
    handleMediaUpload,
    mediaUploading,
    generatedVariants,
    setGeneratedVariants,
    saveGeneratedVariantDraft,
    setSelectedGenerationModes,
  } = props;

  return (
    <div id="agency-workspace-compose" className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-1 uppercase tracking-wide">Compose Studio</p>
          <h2 className="text-lg font-semibold text-gray-900 mt-2">Create Content For This Client</h2>
          <p className="text-sm text-gray-600 mt-1">One clean composer for writing, AI generation, refinement, media upload, and sending strong drafts into approval or publishing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            Selected accounts: <span className="font-semibold text-gray-900">{selectedTargetAccounts.length}</span>
          </div>
        </div>
      </div>

      {workspace.status !== 'active' && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This workspace is currently <span className="font-semibold">{workspace.status}</span>. Activate it to generate, save, or publish content.
        </div>
      )}
      {!canWrite && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          You have <span className="font-semibold">{currentWorkspaceRole || 'view-only'}</span> access in this workspace. You can review drafts and publish history, but only owners, admins, and editors can create or edit content.
        </div>
      )}

      {attachedAccounts.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center">
          <h3 className="text-base font-semibold text-gray-900">No accounts attached yet</h3>
          <p className="text-sm text-gray-600 mt-2">Compose becomes available after you attach at least one workspace account.</p>
          <button
            type="button"
            onClick={() => setActiveWorkspaceTab('connections')}
            className="mt-4 rounded-lg bg-blue-600 text-white px-4 py-2"
          >
            Open Connections
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="border rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-white">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Main Composer</h3>
                <p className="text-sm text-gray-600 mt-1">Pick a real platform first, then either paste copy to refine or leave content empty and let AI draft the first version.</p>
              </div>
              <div className="text-xs text-gray-600 border rounded-lg px-3 py-2 bg-white">
                Tone: <span className="font-semibold text-gray-900 capitalize">{generationStyle}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {generationModeOptions.map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => toggleGenerationMode(mode.key)}
                  disabled={composeWriteLocked || draftActionKey === 'generate' || refiningContent}
                  className={`rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-50 ${
                    selectedGenerationModes.includes(mode.key)
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Powered by <span className="font-semibold text-gray-700">{selectedGenerationServiceLabel}</span>.
              {activeGenerationModes.length > 1 ? ' One variant will be generated for each selected platform.' : ''}
            </p>

            <label className="block text-sm font-medium text-gray-900 mt-4">Content</label>
            <textarea
              className="mt-2 min-h-[220px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-inner outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder={`Write or paste your ${activeGenerationModes.length > 1 ? 'multi-platform' : primaryGenerationMode.label} post here. Leave this empty if you want AI to create the first draft from your prompt.`}
              value={publisherContent}
              onChange={(event) => setPublisherContent(event.target.value)}
              disabled={publishing || composeWriteLocked || refiningContent}
            />

            {selectedPlatformCounters.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedPlatformCounters.map((counter) => (
                  <div
                    key={counter.key}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                      counter.overLimit
                        ? 'border-amber-300 bg-amber-50 text-amber-800'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    {counter.label}: {counter.count}{counter.limit ? ` / ${counter.limit}` : ''}
                  </div>
                ))}
              </div>
            )}

            {showTwitterThreadPreview && (
              <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h4 className="text-sm font-semibold text-sky-900">Twitter / X thread preview</h4>
                    <p className="mt-1 text-xs text-sky-800">
                      This content is over 280 characters, so X will publish or schedule it as a {twitterThreadParts.length}-post thread.
                    </p>
                  </div>
                  <span className="rounded-full border border-sky-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                    Auto thread split
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {twitterThreadParts.map((part, index) => (
                    <div key={`${index + 1}:${part.slice(0, 12)}`} className="rounded-xl border border-white bg-white p-3 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Post {index + 1}</p>
                        <span className="text-[11px] text-gray-500">{countCharacters(part)} / {WORKSPACE_PLATFORM_LIMITS.twitter}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{part}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border rounded-xl p-4 bg-gray-50 mt-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Save / Publish Details</h4>
                  <p className="text-xs text-gray-600 mt-1">{composerActionHint}</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setPublisherTargets(attachedAccounts.map((account) => account.id))}
                    disabled={publishing || composeWriteLocked || refiningContent}
                    className="text-xs border rounded-lg px-3 py-2 bg-white disabled:opacity-50"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublisherTargets([])}
                    disabled={publishing || composeWriteLocked || refiningContent}
                    className="text-xs border rounded-lg px-3 py-2 bg-white disabled:opacity-50"
                  >
                    Clear
                  </button>
                  {canApproveOrPublish && (
                    <input
                      type="datetime-local"
                      value={composerScheduleFor}
                      onChange={(event) => setComposerScheduleFor(event.target.value)}
                      disabled={publishing || composeWriteLocked || refiningContent || draftActionKey === 'schedule-composer'}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
                    />
                  )}
                  <button
                    type="button"
                    onClick={sendComposerForApproval}
                    disabled={composeWriteLocked || attachedAccounts.length === 0 || draftActionKey === 'create-manual-approval' || refiningContent}
                    className="rounded-lg border border-gray-300 text-gray-900 px-4 py-2 disabled:opacity-50"
                  >
                    {draftActionKey === 'create-manual-approval' ? 'Sending...' : 'Send For Approval'}
                  </button>
                  {canApproveOrPublish && (
                    <button
                      type="button"
                      onClick={scheduleComposerContent}
                      disabled={composeWriteLocked || attachedAccounts.length === 0 || draftActionKey === 'schedule-composer' || refiningContent}
                      className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-4 py-2 disabled:opacity-50"
                    >
                      {draftActionKey === 'schedule-composer' ? 'Scheduling...' : 'Schedule'}
                    </button>
                  )}
                  {canApproveOrPublish && (
                    <button
                      type="button"
                      onClick={publishFromWorkspace}
                      disabled={publishing || composeWriteLocked || attachedAccounts.length === 0 || refiningContent}
                      className="rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
                    >
                      {publishing ? 'Publishing...' : 'Publish Now'}
                    </button>
                  )}
                </div>
              </div>

              {uploadedMedia.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
                  {uploadedMedia.map((item) => (
                    <div key={item.url} className="rounded-xl border border-gray-200 bg-white p-3">
                      {String(item.mimetype || '').startsWith('image/') ? (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="h-32 w-full rounded-lg object-cover bg-gray-100"
                        />
                      ) : String(item.mimetype || '').startsWith('video/') ? (
                        <video
                          src={item.url}
                          className="h-32 w-full rounded-lg object-cover bg-gray-100"
                          controls
                        />
                      ) : (
                        <div className="h-32 w-full rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                          Uploaded media
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-3 mt-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{String(item.mimetype || 'file').split('/')[0]}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUploadedMedia(item.url)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {attachedAccounts.map((account) => {
                  const checked = publisherTargets.includes(account.id);
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => {
                        setPublisherTargets((previous) => (
                          checked
                            ? previous.filter((id) => id !== account.id)
                            : [...new Set([...previous, account.id])]
                        ));
                      }}
                      disabled={publishing || composeWriteLocked || refiningContent}
                      className={`rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-50 ${
                        checked
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-200 bg-white text-gray-700'
                      }`}
                    >
                      {getWorkspaceAccountLabel(account)} - {getWorkspacePlatformLabel(account.platform)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <label className="block text-sm font-medium text-gray-900">AI Guidance</label>
              {hasComposerContent ? (
                <button
                  type="button"
                  onClick={() => setShowPromptInput((previous) => !previous)}
                  className="text-xs font-medium text-blue-700 hover:text-blue-800"
                >
                  {showPromptInput ? 'Hide guidance' : 'Add guidance'}
                </button>
              ) : (
                <p className="text-xs text-gray-500">Required when content is empty so AI knows what to generate.</p>
              )}
            </div>
            {(!hasComposerContent || showPromptInput) ? (
              <textarea
                className="mt-2 min-h-[96px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-inner outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder={`Example: Launch our new collection for ${activeGenerationModes.length > 1 ? activeGenerationModes.map((mode) => mode.label).join(' + ') : primaryGenerationMode.label}. Or: make this tighter, clearer, and less salesy.`}
                value={generationPrompt}
                onChange={(event) => setGenerationPrompt(event.target.value)}
                disabled={composeWriteLocked || draftActionKey === 'generate' || refiningContent}
              />
            ) : (
              <div className="mt-2 rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                Add guidance only if you want AI to steer the refinement in a specific direction.
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_auto] gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-900">Tone</label>
                <select
                  className="mt-2 w-full border rounded-lg px-3 py-2 bg-white"
                  value={generationStyle}
                  onChange={(event) => setGenerationStyle(event.target.value)}
                  disabled={composeWriteLocked || draftActionKey === 'generate' || refiningContent}
                >
                  {generationToneOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {selectedToneOption?.guidance ? (
                  <p className="mt-2 text-xs text-gray-500">{selectedToneOption.guidance}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={refineWorkspaceContent}
                disabled={composeWriteLocked || refiningContent || publishing}
                className="rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-50 w-full lg:w-auto hover:bg-blue-700"
              >
                {refiningContent
                  ? hasComposerContent
                    ? 'Refining...'
                    : 'Generating...'
                  : hasComposerContent
                    ? activeGenerationModes.length > 1
                      ? 'Refine Variants'
                      : 'Refine Content'
                    : activeGenerationModes.length > 1
                      ? 'Generate Variants'
                      : 'Generate Content'}
              </button>
              <input
                ref={mediaInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={handleMediaUpload}
              />
              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                disabled={composeWriteLocked || mediaUploading || refiningContent || publishing}
                className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-blue-700 disabled:opacity-50 w-full lg:w-auto hover:bg-blue-100"
              >
                {mediaUploading ? 'Uploading...' : 'Upload Image / Video'}
              </button>
            </div>

            {generatedVariants.length > 0 && (
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Generated Platform Variants</h4>
                  <p className="mt-1 text-xs text-gray-600">Review each platform draft, pull it into the composer, or send that variant straight into the approval queue.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-4 xl:grid-cols-2">
                  {generatedVariants.map((variant) => (
                    <div key={variant.mode} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{getWorkspacePlatformLabel(variant.mode)}</p>
                          <p className="mt-1 text-xs text-gray-500">{variant.provider || 'AI draft'}</p>
                        </div>
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                          Variant
                        </span>
                      </div>

                      <textarea
                        className="mt-3 min-h-[180px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-inner outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        value={variant.content}
                        onChange={(event) => {
                          setGeneratedVariants((previous) => previous.map((item) => (
                            item.mode === variant.mode
                              ? { ...item, content: event.target.value }
                              : item
                          )));
                        }}
                        disabled={composeWriteLocked || refiningContent}
                      />

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${
                          (WORKSPACE_PLATFORM_LIMITS[variant.mode] && countCharacters(variant.content) > WORKSPACE_PLATFORM_LIMITS[variant.mode])
                            ? 'border-amber-300 bg-amber-50 text-amber-800'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                        }`}>
                          {countCharacters(variant.content)}
                          {WORKSPACE_PLATFORM_LIMITS[variant.mode] ? ` / ${WORKSPACE_PLATFORM_LIMITS[variant.mode]}` : ''} chars
                        </span>
                        {variant.mode === 'twitter' && splitTextByCharacterLimit(variant.content, WORKSPACE_PLATFORM_LIMITS.twitter, 25).length > 1 && (
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700">
                            Auto-splits into {splitTextByCharacterLimit(variant.content, WORKSPACE_PLATFORM_LIMITS.twitter, 25).length} X posts
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPublisherContent(variant.content);
                            setSelectedGenerationModes([variant.mode]);
                            setGeneratedVariants([]);
                          }}
                          disabled={composeWriteLocked}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                        >
                          Use In Composer
                        </button>
                        <button
                          type="button"
                          onClick={() => saveGeneratedVariantDraft(variant)}
                          disabled={composeWriteLocked || draftActionKey === `create-variant:${variant.mode}`}
                          className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                        >
                          {draftActionKey === `create-variant:${variant.mode}` ? 'Sending...' : 'Send For Approval'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-3">Empty content plus prompt generates a new draft. Existing content plus prompt refines what you already wrote.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyWorkspaceComposeTab;
