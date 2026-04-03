export function createAgencyWorkspaceContentController(deps) {
  const {
    query,
    jwt,
    AGENCY_JWT_SECRET,
    AGENCY_APPROVAL_TOKEN_TTL_DAYS,
    getAgencyApprovalUrl,
    getAgencyContext,
    getRequestWorkspaceAccess,
    getWorkspace,
    getWorkspaceDrafts,
    getWorkspaceSettings,
    assertAgencyDraftWriteRole,
    assertAgencyDraftApproverRole,
    resolveDraftCreateStatus,
    cleanText,
    apiError,
    normalizeStringArray,
    normalizeMediaInputs,
    logAudit,
    buildWorkspaceAiContextBlock,
    normalizeWorkspacePostingPreferences,
    getWorkspaceTonePreset,
    normalizeWorkspaceGenerationMode,
    normalizeWorkspaceAccountIds,
    listAgencyEligibleWorkspaceAccounts,
    normalizeWorkspacePlatform,
    invokeInternalToolEndpoint,
    normalizeWorkspaceGenerationModes,
    invokeWorkspaceGenerationMode,
    uploadWorkspaceMediaToSocialStorage,
    normalizeDraftStatus,
    isEditableDraftStatus,
    isAgencyDraftApproverRole,
    normalizeTimestamp,
    normalizeThreadParts,
    splitTextByCharacterLimit,
    scheduleToWorkspaceAccount,
    publishToWorkspaceAccount,
    buildWorkspaceAnalyticsSummary,
    buildWorkspaceEffectiveSettings,
    toBoolean,
    buildWorkspaceInsightsSummary,
    buildWorkspaceAnalysisSummary,
    buildWorkspaceOperationsSnapshotData,
    deductAgencyWorkspaceCredits,
    refundAgencyWorkspaceCredits,
    safeQuery,
    handleError,
  } = deps;

  return {
  async listWorkspaceDrafts(req, res) {
    try {
      const { workspace } = await getRequestWorkspaceAccess(req);
      const drafts = await getWorkspaceDrafts(workspace.id, {
        statusView: req.query.statusView || req.query.status || null,
      });
      return res.json({
        drafts,
        currentMemberRole: req.agencyWorkspaceAccess?.workspaceRole || null,
      });
    } catch (error) {
      return handleError(res, error, 'Failed to list workspace drafts');
    }
  },

  async createWorkspaceDraft(req, res) {
    try {
      const { agency, workspace, workspaceRole } = await getRequestWorkspaceAccess(req);
      assertAgencyDraftWriteRole(workspaceRole, 'Only owner/admin/editor can create drafts');

      const settings = await getWorkspaceSettings(workspace.id);
      const nextStatus = resolveDraftCreateStatus({
        memberRole: workspaceRole,
        settings,
        submissionAction: req.body.submissionAction || req.body.intent || req.body.saveMode,
      });

      const content = cleanText(req.body.content);
      if (!content) throw apiError('content is required', 'DRAFT_CONTENT_REQUIRED', 400);

      const inserted = await query(
        `INSERT INTO agency_workspace_drafts
         (workspace_id, created_by, updated_by, title, prompt, content, platform_targets, media_urls, status, generation_source, generation_metadata, created_at, updated_at)
         VALUES
         ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11::jsonb, NOW(), NOW())
         RETURNING *`,
        [
          workspace.id,
          req.user.id,
          req.user.id,
          cleanText(req.body.title, null),
          cleanText(req.body.prompt, null),
          content,
          JSON.stringify(normalizeStringArray(req.body.targetWorkspaceAccountIds || req.body.platformTargets || [])),
          JSON.stringify(normalizeMediaInputs(req.body.mediaUrls || req.body.media || [])),
          nextStatus,
          cleanText(req.body.generationSource, 'manual'),
          JSON.stringify(req.body.generationMetadata || {}),
        ]
      );
      await logAudit(agency.id, req.user.id, 'workspace_draft_created', 'agency_workspace_draft', inserted.rows[0].id, {
        workspaceId: workspace.id,
      });
      return res.status(201).json({ draft: inserted.rows[0] });
    } catch (error) {
      return handleError(res, error, 'Failed to create workspace draft');
    }
  },

  async generateWorkspaceDraft(req, res) {
    let reservedCredits = 0;
    let creditAgency = null;
    let creditWorkspace = null;
    try {
      const { agency, workspace, workspaceRole } = await getRequestWorkspaceAccess(req);
      creditAgency = agency;
      creditWorkspace = workspace;
      assertAgencyDraftWriteRole(workspaceRole, 'Only owner/admin/editor can generate drafts');

      const prompt = cleanText(req.body.prompt);
      if (!prompt || prompt.length < 5) {
        throw apiError('prompt is required and must be at least 5 characters', 'DRAFT_PROMPT_REQUIRED', 400);
      }

      const settings = await getWorkspaceSettings(workspace.id);
      const nextStatus = resolveDraftCreateStatus({ memberRole: workspaceRole, settings });
      const style = cleanText(req.body.style, 'professional') || 'professional';
      const contextBlock = buildWorkspaceAiContextBlock({ workspace, settings, style });
      const effectivePrompt = [contextBlock, prompt].filter(Boolean).join('\n\n');
      const postingPreferences = normalizeWorkspacePostingPreferences(settings.posting_preferences);
      const tonePreset = getWorkspaceTonePreset(settings, style);
      const generationMode = normalizeWorkspaceGenerationMode(req.body.generationMode || req.body.platformMode, 'generic');
      const requestedTargetIds = normalizeWorkspaceAccountIds(req.body.targetWorkspaceAccountIds || req.body.platformTargets || []);
      const accounts = await listAgencyEligibleWorkspaceAccounts(workspace.id, {
        workspaceAccountIds: requestedTargetIds,
      });
      if (accounts.length === 0) {
        throw apiError('Attach at least one active workspace account before generating drafts', 'WORKSPACE_ACCOUNTS_REQUIRED', 400);
      }

      const groupedTargets = accounts.reduce((acc, account) => {
        const platform = normalizeWorkspacePlatform(account.platform);
        if (!platform) return acc;
        if (!acc[platform]) acc[platform] = [];
        acc[platform].push(account);
        return acc;
      }, {});

      const generators = [];
      if (generationMode === 'generic') {
        generators.push(
          invokeInternalToolEndpoint({
            tool: 'social',
            path: '/api/internal/ai/caption',
            userId: req.user.id,
            body: {
              prompt: effectivePrompt,
              style,
              workspaceName: workspace.name,
              brandName: workspace.brand_name,
              industry: postingPreferences.industry,
              targetAudience: postingPreferences.target_audience,
              brandColors: postingPreferences.brand_colors,
              tonePreset,
              platforms: [],
            },
          }).then((payload) => ({
            platform: 'generic',
            payload,
            targets: accounts,
          }))
        );
      }

      if ((generationMode === 'twitter' || generationMode === 'all') && groupedTargets.twitter?.length) {
        generators.push(
          invokeInternalToolEndpoint({
            tool: 'twitter',
            path: '/api/internal/twitter/generate',
            userId: req.user.id,
            body: {
              prompt: effectivePrompt,
              style,
              workspaceName: workspace.name,
              brandName: workspace.brand_name,
              industry: postingPreferences.industry,
              targetAudience: postingPreferences.target_audience,
              brandColors: postingPreferences.brand_colors,
              tonePreset,
            },
          }).then((payload) => ({ platform: 'twitter', payload, targets: groupedTargets.twitter }))
        );
      }
      if ((generationMode === 'linkedin' || generationMode === 'all') && groupedTargets.linkedin?.length) {
        generators.push(
          invokeInternalToolEndpoint({
            tool: 'linkedin',
            path: '/api/internal/generate',
            userId: req.user.id,
            body: {
              prompt: effectivePrompt,
              style,
              workspaceName: workspace.name,
              brandName: workspace.brand_name,
              industry: postingPreferences.industry,
              targetAudience: postingPreferences.target_audience,
              brandColors: postingPreferences.brand_colors,
              tonePreset,
            },
          }).then((payload) => ({ platform: 'linkedin', payload, targets: groupedTargets.linkedin }))
        );
      }
      if (
        (generationMode === 'threads' || generationMode === 'all') &&
        (groupedTargets.threads?.length || groupedTargets.instagram?.length || groupedTargets.youtube?.length || groupedTargets.social?.length)
      ) {
        generators.push(
          invokeInternalToolEndpoint({
            tool: 'social',
            path: '/api/internal/ai/caption',
            userId: req.user.id,
            body: {
              prompt: effectivePrompt,
              style,
              workspaceName: workspace.name,
              brandName: workspace.brand_name,
              industry: postingPreferences.industry,
              targetAudience: postingPreferences.target_audience,
              brandColors: postingPreferences.brand_colors,
              tonePreset,
              platforms: Object.keys(groupedTargets).filter((item) => item === 'threads' || item === 'instagram' || item === 'youtube' || item === 'social'),
            },
          }).then((payload) => ({
            platform: 'threads',
            payload,
            targets: [
              ...(groupedTargets.threads || []),
              ...(groupedTargets.instagram || []),
              ...(groupedTargets.youtube || []),
              ...(groupedTargets.social || []),
            ],
          }))
        );
      }

      if (generators.length === 0) {
        throw apiError('No supported workspace accounts found for draft generation', 'WORKSPACE_GENERATION_TARGETS_INVALID', 400);
      }

      const estimatedCreditCost = Math.max(1, generators.length);
      const creditReservation = await deductAgencyWorkspaceCredits({
        agency,
        workspace,
        userId: req.user.id,
        amount: estimatedCreditCost,
        operation: 'agency_workspace_generate',
        description: `Generated workspace drafts for ${workspace.name}`,
      });
      if (!creditReservation.success) {
        throw apiError(
          `Insufficient agency credits. Required: ${creditReservation.creditsRequired ?? estimatedCreditCost}, Available: ${creditReservation.creditsAvailable ?? 0}`,
          'INSUFFICIENT_AGENCY_CREDITS',
          400
        );
      }
      reservedCredits = estimatedCreditCost;

      const settled = await Promise.allSettled(generators);
      const createdDrafts = [];
      const errors = [];

      for (const result of settled) {
        if (result.status !== 'fulfilled') {
          errors.push(result.reason?.message || 'Draft generation failed');
          continue;
        }

        const { platform, payload, targets } = result.value;
        const content = cleanText(payload?.content || payload?.caption || payload?.text, null);
        if (!content) {
          errors.push(`${platform} generation returned empty content`);
          continue;
        }

        const inserted = await query(
          `INSERT INTO agency_workspace_drafts
           (workspace_id, created_by, updated_by, title, prompt, content, platform_targets, media_urls, status, generation_source, generation_metadata, created_at, updated_at)
           VALUES
           ($1, $2, $3, $4, $5, $6, $7::jsonb, '[]'::jsonb, $8, $9, $10::jsonb, NOW(), NOW())
           RETURNING *`,
          [
            workspace.id,
            req.user.id,
            req.user.id,
            `${workspace.name} ${platform} draft`,
            prompt,
            content,
            JSON.stringify(targets.map((target) => String(target.id))),
            nextStatus,
            platform,
            JSON.stringify({ platform, generationMode, provider: payload?.provider || null, raw: payload || {} }),
          ]
        );
        createdDrafts.push(inserted.rows[0]);
      }

      const consumedCredits = Math.max(1, createdDrafts.length);
      const refundAmount = Math.max(0, estimatedCreditCost - consumedCredits);
      if (refundAmount > 0) {
        await refundAgencyWorkspaceCredits({
          agency,
          workspace,
          userId: req.user.id,
          amount: refundAmount,
          reason: 'agency_workspace_generate_adjustment',
          description: `Refunded unused workspace generation credits for ${workspace.name}`,
        }).catch(() => {});
      }

      await logAudit(agency.id, req.user.id, 'workspace_draft_generated', 'agency_workspace', workspace.id, {
        createdCount: createdDrafts.length,
        errorCount: errors.length,
      });
      reservedCredits = 0;

      return res.json({
        drafts: createdDrafts,
        errors,
      });
    } catch (error) {
      if (reservedCredits > 0 && creditAgency && creditWorkspace) {
        await refundAgencyWorkspaceCredits({
          agency: creditAgency,
          workspace: creditWorkspace,
          userId: req.user.id,
          amount: reservedCredits,
          reason: 'agency_workspace_generate_failed',
          description: `Refunded failed workspace generation credits for ${creditWorkspace.name}`,
        }).catch(() => {});
      }
      return handleError(res, error, 'Failed to generate workspace draft');
    }
  },

  async refineWorkspaceContent(req, res) {
    let reservedCredits = 0;
    let creditAgency = null;
    let creditWorkspace = null;
    try {
      const { agency, workspace } = await getRequestWorkspaceAccess(req);
      creditAgency = agency;
      creditWorkspace = workspace;

      const content = cleanText(req.body.content, null);
      const instruction = cleanText(req.body.prompt || req.body.instruction, null);
      const style = cleanText(req.body.style, 'professional') || 'professional';
      const settings = await getWorkspaceSettings(workspace.id);
      const generationModes = normalizeWorkspaceGenerationModes(
        req.body.generationModes ||
        req.body.platformModes ||
        req.body.generationMode ||
        req.body.platformMode,
        ['twitter']
      );

      if ((!content || content.length < 10) && (!instruction || instruction.length < 5)) {
        throw apiError('Provide either content to refine or an instruction to generate from', 'DRAFT_CONTENT_REQUIRED', 400);
      }
      const clientLabel = cleanText(workspace.brand_name, null) || cleanText(workspace.name, 'this client');
      const variants = [];
      const errors = [];
      const estimatedCreditCost = Math.max(0.5, generationModes.length * 0.5);
      const creditReservation = await deductAgencyWorkspaceCredits({
        agency,
        workspace,
        userId: req.user.id,
        amount: estimatedCreditCost,
        operation: 'agency_workspace_refine',
        description: `Refined workspace content for ${workspace.name}`,
      });

      if (!creditReservation.success) {
        throw apiError(
          `Insufficient agency credits. Required: ${creditReservation.creditsRequired ?? estimatedCreditCost}, Available: ${creditReservation.creditsAvailable ?? 0}`,
          'INSUFFICIENT_AGENCY_CREDITS',
          400
        );
      }
      reservedCredits = estimatedCreditCost;

      for (const generationMode of generationModes) {
        const platformLabel = generationMode === 'generic' ? 'social media' : generationMode;
        const prompt = content
          ? [
              `You are refining ${platformLabel} copy for ${clientLabel}.`,
              `Tone: ${style}.`,
              'Goals: keep the original meaning, improve clarity and structure, sound human, remove empty hype, avoid invented claims, and keep the copy ready to post.',
              'Return only the revised final post text. Do not add notes, labels, or markdown.',
              instruction ? `Extra direction: ${instruction}` : null,
              `Current draft:\n${content}`,
            ].filter(Boolean).join('\n\n')
          : [
              `You are writing a ${platformLabel} post for ${clientLabel}.`,
              `Tone: ${style}.`,
              `Goal: ${instruction || 'Write a clear, native-feeling post with a strong hook and a natural call to action.'}`,
              'Requirements: sound specific and human, avoid generic launch fluff, avoid invented facts, keep it concise, and return only the final post text.',
            ].filter(Boolean).join('\n\n');

        try {
          const payload = await invokeWorkspaceGenerationMode({
            generationMode,
            prompt,
            style,
            workspace,
            settings,
            userId: req.user.id,
          });

          const refinedContent = cleanText(payload?.content || payload?.caption || payload?.text, null);
          if (!refinedContent) {
            errors.push(`${generationMode} returned empty content`);
            continue;
          }

          variants.push({
            mode: generationMode,
            content: refinedContent,
            provider: payload?.provider || null,
          });
        } catch (error) {
          errors.push(error?.message || `${generationMode} refinement failed`);
        }
      }

      if (variants.length === 0) {
        await refundAgencyWorkspaceCredits({
          agency,
          workspace,
          userId: req.user.id,
          amount: estimatedCreditCost,
          reason: 'agency_workspace_refine_failed',
          description: `Refunded failed refinement credits for ${workspace.name}`,
        }).catch(() => {});
        reservedCredits = 0;
        throw apiError(errors[0] || 'Refinement returned empty content', 'WORKSPACE_REFINE_EMPTY', 502);
      }

      const consumedCredits = Math.max(0.5, variants.length * 0.5);
      const refundAmount = Math.max(0, estimatedCreditCost - consumedCredits);
      if (refundAmount > 0) {
        await refundAgencyWorkspaceCredits({
          agency,
          workspace,
          userId: req.user.id,
          amount: refundAmount,
          reason: 'agency_workspace_refine_adjustment',
          description: `Refunded unused refinement credits for ${workspace.name}`,
        }).catch(() => {});
      }

      if (variants.length === 1) {
        reservedCredits = 0;
        return res.json({
          content: variants[0].content,
          mode: variants[0].mode,
          action: content ? 'refined' : 'generated',
          provider: variants[0].provider,
          variants,
          errors,
        });
      }

      reservedCredits = 0;
      return res.json({
        action: content ? 'refined' : 'generated',
        modes: variants.map((variant) => variant.mode),
        variants,
        errors,
      });
    } catch (error) {
      if (reservedCredits > 0 && creditAgency && creditWorkspace) {
        await refundAgencyWorkspaceCredits({
          agency: creditAgency,
          workspace: creditWorkspace,
          userId: req.user.id,
          amount: reservedCredits,
          reason: 'agency_workspace_refine_failed',
          description: `Refunded failed refinement credits for ${creditWorkspace.name}`,
        }).catch(() => {});
      }
      return handleError(res, error, 'Failed to refine workspace content');
    }
  },

  async uploadWorkspaceMedia(req, res) {
    try {
      const { workspaceRole } = await getRequestWorkspaceAccess(req);
      assertAgencyDraftWriteRole(workspaceRole, 'Only owner/admin/editor can upload workspace media');

      if (!req.file) {
        throw apiError('File is required', 'MEDIA_FILE_REQUIRED', 400);
      }

      const uploaded = await uploadWorkspaceMediaToSocialStorage(req.file);
      return res.json({
        success: true,
        media: {
          url: cleanText(uploaded?.url, null),
          originalName: cleanText(uploaded?.originalName, req.file.originalname),
          size: Number(uploaded?.size || req.file.size || 0),
          mimetype: cleanText(uploaded?.mimetype, req.file.mimetype),
        },
      });
    } catch (error) {
      return handleError(res, error, 'Failed to upload workspace media');
    }
  },

  async updateWorkspaceDraft(req, res) {
    try {
      const { agency, workspace, workspaceRole } = await getRequestWorkspaceAccess(req);
      assertAgencyDraftWriteRole(workspaceRole, 'Only owner/admin/editor can update drafts');

      const existing = await query(
        `SELECT *
         FROM agency_workspace_drafts
         WHERE id = $1 AND workspace_id = $2
         LIMIT 1`,
        [req.params.draftId, workspace.id]
      );
      if (existing.rows.length === 0) throw apiError('Workspace draft not found', 'WORKSPACE_DRAFT_NOT_FOUND', 404);

      const currentStatus = normalizeDraftStatus(existing.rows[0].status, 'draft');
      if (!isEditableDraftStatus(currentStatus) && !isAgencyDraftApproverRole(workspaceRole)) {
        throw apiError('This draft is locked while it waits for approval or publishing', 'WORKSPACE_DRAFT_LOCKED', 403);
      }

      let nextStatus = currentStatus;
      let nextRejectedReason = existing.rows[0].rejected_reason || null;
      if (req.body.status !== undefined) {
        const requestedStatus = normalizeDraftStatus(req.body.status, currentStatus);
        if (requestedStatus === 'approved' || requestedStatus === 'rejected') {
          throw apiError('Use the review actions for approve or reject', 'WORKSPACE_DRAFT_STATUS_INVALID', 400);
        }
        if (requestedStatus === 'scheduled' || requestedStatus === 'published' || requestedStatus === 'failed' || requestedStatus === 'archived') {
          throw apiError('Use the schedule or publish actions for these status changes', 'WORKSPACE_DRAFT_STATUS_INVALID', 400);
        }

        if (requestedStatus === 'pending_approval') {
          if (!isEditableDraftStatus(currentStatus) && currentStatus !== 'draft') {
            throw apiError('Only editable drafts can be sent for approval', 'WORKSPACE_DRAFT_RESUBMIT_INVALID', 400);
          }
          nextRejectedReason = null;
        }

        nextStatus = requestedStatus;
      }

      const updated = await query(
        `UPDATE agency_workspace_drafts
         SET title = $1,
             prompt = $2,
             content = $3,
             platform_targets = $4::jsonb,
             media_urls = $5::jsonb,
             status = $6,
             rejected_reason = $7,
             updated_by = $8,
             updated_at = NOW()
         WHERE id = $9 AND workspace_id = $10
         RETURNING *`,
        [
          cleanText(req.body.title, existing.rows[0].title),
          cleanText(req.body.prompt, existing.rows[0].prompt),
          cleanText(req.body.content, existing.rows[0].content),
          JSON.stringify(
            normalizeStringArray(
              req.body.targetWorkspaceAccountIds !== undefined
                ? req.body.targetWorkspaceAccountIds
                : existing.rows[0].platform_targets || []
            )
          ),
          JSON.stringify(
            req.body.mediaUrls !== undefined
              ? normalizeMediaInputs(req.body.mediaUrls)
              : Array.isArray(existing.rows[0].media_urls)
                ? existing.rows[0].media_urls
                : []
          ),
          nextStatus,
          nextRejectedReason,
          req.user.id,
          req.params.draftId,
          workspace.id,
        ]
      );
      return res.json({ draft: updated.rows[0] });
    } catch (error) {
      return handleError(res, error, 'Failed to update workspace draft');
    }
  },

  async deleteWorkspaceDraft(req, res) {
    try {
      const { agency, workspace, workspaceRole } = await getRequestWorkspaceAccess(req);
      assertAgencyDraftWriteRole(workspaceRole, 'Only owner/admin/editor can delete drafts');

      const deleted = await query(
        `DELETE FROM agency_workspace_drafts
         WHERE id = $1
           AND workspace_id = $2
         RETURNING *`,
        [req.params.draftId, workspace.id]
      );
      if (deleted.rows.length === 0) throw apiError('Workspace draft not found', 'WORKSPACE_DRAFT_NOT_FOUND', 404);

      await logAudit(agency.id, req.user.id, 'workspace_draft_deleted', 'agency_workspace_draft', req.params.draftId, {
        workspaceId: workspace.id,
        status: deleted.rows[0].status || null,
      });

      return res.json({
        success: true,
        draft: deleted.rows[0],
      });
    } catch (error) {
      return handleError(res, error, 'Failed to delete workspace draft');
    }
  },

  async addWorkspaceDraftComment(req, res) {
    try {
      const { agency, member, workspace } = await getRequestWorkspaceAccess(req);
      const content = cleanText(req.body.comment || req.body.content, null);
      if (!content) throw apiError('Comment cannot be empty', 'WORKSPACE_DRAFT_COMMENT_REQUIRED', 400);

      const draftRows = await query(
        `SELECT id
         FROM agency_workspace_drafts
         WHERE id = $1
           AND workspace_id = $2
         LIMIT 1`,
        [req.params.draftId, workspace.id]
      );
      if (draftRows.rows.length === 0) {
        throw apiError('Workspace draft not found', 'WORKSPACE_DRAFT_NOT_FOUND', 404);
      }

      const inserted = await query(
        `INSERT INTO agency_draft_comments
         (draft_id, workspace_id, author_type, author_name, author_user_id, content, created_at)
         VALUES ($1, $2, 'agency', $3, $4, $5, NOW())
         RETURNING id, draft_id, workspace_id, author_type, author_name, author_user_id, content, created_at`,
        [
          req.params.draftId,
          workspace.id,
          cleanText(member?.email, req.user?.email || 'Agency'),
          req.user.id,
          content,
        ]
      );

      await logAudit(agency.id, req.user.id, 'workspace_draft_comment_added', 'agency_workspace_draft', req.params.draftId, {
        workspaceId: workspace.id,
      });

      return res.status(201).json({ success: true, comment: inserted.rows[0] });
    } catch (error) {
      return handleError(res, error, 'Failed to add draft comment');
    }
  },

  async approveWorkspaceDraft(req, res) {
    try {
      const { agency, workspace, workspaceRole } = await getRequestWorkspaceAccess(req);
      assertAgencyDraftApproverRole(workspaceRole, 'Only owner/admin can approve drafts');

      const updated = await query(
        `UPDATE agency_workspace_drafts
         SET status = 'approved',
             last_error = NULL,
             rejected_reason = NULL,
             reviewed_by = $1,
             reviewed_at = NOW(),
             scheduled_for = NULL,
             updated_by = $1,
             updated_at = NOW()
         WHERE id = $2
           AND workspace_id = $3
           AND status = 'pending_approval'
         RETURNING *`,
        [req.user.id, req.params.draftId, workspace.id]
      );
      if (updated.rows.length === 0) {
        throw apiError('Only pending approval drafts can be approved', 'WORKSPACE_DRAFT_APPROVE_INVALID', 400);
      }

      await logAudit(agency.id, req.user.id, 'workspace_draft_approved', 'agency_workspace_draft', req.params.draftId, {
        workspaceId: workspace.id,
      });

      return res.json({ draft: updated.rows[0] });
    } catch (error) {
      return handleError(res, error, 'Failed to approve workspace draft');
    }
  },

  async rejectWorkspaceDraft(req, res) {
    try {
      const { agency, workspace, workspaceRole } = await getRequestWorkspaceAccess(req);
      assertAgencyDraftApproverRole(workspaceRole, 'Only owner/admin can reject drafts');

      const rejectedReason = cleanText(req.body.rejectedReason || req.body.rejected_reason, null);
      if (!rejectedReason || rejectedReason.length < 3) {
        throw apiError('A rejection reason is required', 'WORKSPACE_DRAFT_REJECT_REASON_REQUIRED', 400);
      }

      const updated = await query(
        `UPDATE agency_workspace_drafts
         SET status = 'rejected',
             rejected_reason = $1,
             reviewed_by = $2,
             reviewed_at = NOW(),
             scheduled_for = NULL,
             updated_by = $2,
             updated_at = NOW()
         WHERE id = $3
           AND workspace_id = $4
           AND status = 'pending_approval'
         RETURNING *`,
        [rejectedReason, req.user.id, req.params.draftId, workspace.id]
      );
      if (updated.rows.length === 0) {
        throw apiError('Only pending approval drafts can be rejected', 'WORKSPACE_DRAFT_REJECT_INVALID', 400);
      }

      await logAudit(agency.id, req.user.id, 'workspace_draft_rejected', 'agency_workspace_draft', req.params.draftId, {
        workspaceId: workspace.id,
        rejectedReason,
      });

      return res.json({ draft: updated.rows[0] });
    } catch (error) {
      return handleError(res, error, 'Failed to reject workspace draft');
    }
  },

  async scheduleWorkspaceDraft(req, res) {
    try {
      const { agency, workspace, workspaceRole } = await getRequestWorkspaceAccess(req);
      assertAgencyDraftApproverRole(workspaceRole, 'Only owner/admin can schedule drafts');

      const scheduledFor = normalizeTimestamp(req.body.scheduledFor || req.body.scheduled_for, null);
      if (!scheduledFor) throw apiError('scheduledFor is required', 'WORKSPACE_DRAFT_SCHEDULE_REQUIRED', 400);
      if (new Date(scheduledFor).getTime() <= Date.now()) {
        throw apiError('scheduledFor must be in the future', 'WORKSPACE_DRAFT_SCHEDULE_INVALID', 400);
      }

      const draftResult = await query(
        `SELECT *
         FROM agency_workspace_drafts
         WHERE id = $1 AND workspace_id = $2
         LIMIT 1`,
        [req.params.draftId, workspace.id]
      );
      if (draftResult.rows.length === 0) throw apiError('Workspace draft not found', 'WORKSPACE_DRAFT_NOT_FOUND', 404);
      const draft = draftResult.rows[0];
      const currentStatus = normalizeDraftStatus(draft.status, 'draft');
      if (!['approved', 'scheduled', 'failed'].includes(currentStatus)) {
        throw apiError('Only approved, scheduled, or failed drafts can be scheduled', 'WORKSPACE_DRAFT_SCHEDULE_STATUS_INVALID', 400);
      }
      const draftMetadata =
        draft?.generation_metadata && typeof draft.generation_metadata === 'object'
          ? draft.generation_metadata
          : {};

      const content = cleanText(req.body.content, draft.content);
      if (!content) throw apiError('Draft content is empty', 'WORKSPACE_DRAFT_CONTENT_REQUIRED', 400);
      const requestedThreadParts = normalizeThreadParts(req.body.threadParts);
      const storedThreadParts = normalizeThreadParts(draftMetadata.threadParts);
      const requestedPostMode = cleanText(req.body.postMode, null);
      const baseMode = String(requestedPostMode || draftMetadata.postMode || (storedThreadParts.length >= 2 ? 'thread' : 'single')).toLowerCase() === 'thread'
        ? 'thread'
        : 'single';
      const threadParts = requestedThreadParts.length >= 2
        ? requestedThreadParts
        : baseMode === 'thread'
          ? splitTextByCharacterLimit(content, 280, 25)
          : storedThreadParts;
      const normalizedMode = baseMode === 'thread' && threadParts.length >= 2
          ? 'thread'
          : 'single';

      const selectedAccountIds = normalizeWorkspaceAccountIds(
        req.body.targetWorkspaceAccountIds || draft.platform_targets || []
      );
      if (selectedAccountIds.length === 0) {
        throw apiError('Select at least one attached account to schedule this draft', 'WORKSPACE_DRAFT_TARGETS_REQUIRED', 400);
      }

      const selectedAccounts = await listAgencyEligibleWorkspaceAccounts(workspace.id, {
        workspaceAccountIds: selectedAccountIds,
      });
      if (selectedAccounts.length !== selectedAccountIds.length) {
        throw apiError('One or more draft targets are no longer attached to this workspace', 'WORKSPACE_DRAFT_TARGETS_INVALID', 400);
      }

      const byId = new Map(selectedAccounts.map((row) => [String(row.id), row]));
      const orderedAccounts = selectedAccountIds.map((id) => byId.get(id)).filter(Boolean);
      const media = Array.isArray(draft.media_urls) ? draft.media_urls : [];

      const settled = await Promise.allSettled(
        orderedAccounts.map((account) =>
          scheduleToWorkspaceAccount({
            userId: req.user.id,
            account,
            content,
            scheduledFor,
            postMode: normalizedMode,
            threadParts,
            media,
            timezone: workspace.timezone || 'UTC',
          })
        )
      );

      const results = settled.map((entry, index) => {
        const account = orderedAccounts[index];
        const base = {
          workspaceAccountId: String(account.id),
          platform: normalizeWorkspacePlatform(account.platform),
          accountDisplayName:
            cleanText(account.account_display_name, null) ||
            cleanText(account.account_username, null) ||
            cleanText(account.account_id, null) ||
            cleanText(account.source_id, 'account'),
        };

        if (entry.status === 'fulfilled') {
          return {
            ...base,
            status: 'scheduled',
            scheduledId: entry.value.scheduledId || null,
            scheduledTime: entry.value.scheduledTime || scheduledFor,
            target: entry.value.target || null,
          };
        }

        return {
          ...base,
          status: 'failed',
          error: entry.reason?.message || 'Failed to schedule',
          code: entry.reason?.code || 'SCHEDULE_FAILED',
        };
      });

      const failedCount = results.filter((item) => item.status === 'failed').length;
      const nextStatus = failedCount === results.length ? 'failed' : 'scheduled';
      const updated = await query(
        `UPDATE agency_workspace_drafts
         SET content = $1,
             platform_targets = $2::jsonb,
             scheduled_for = $3,
             status = $4,
             last_error = $5,
             rejected_reason = NULL,
             downstream_results = $6::jsonb,
             generation_metadata = COALESCE(generation_metadata, '{}'::jsonb) || $10::jsonb,
             updated_by = $7,
             updated_at = NOW()
         WHERE id = $8 AND workspace_id = $9
         RETURNING *`,
        [
          content,
          JSON.stringify(selectedAccountIds),
          scheduledFor,
          nextStatus,
          failedCount > 0 ? results.filter((item) => item.status === 'failed').map((item) => item.error).join('; ') : null,
          JSON.stringify({ results }),
          req.user.id,
          req.params.draftId,
          workspace.id,
          JSON.stringify({ postMode: normalizedMode, threadParts }),
        ]
      );
      await logAudit(agency.id, req.user.id, 'workspace_draft_scheduled', 'agency_workspace_draft', req.params.draftId, {
        workspaceId: workspace.id,
        scheduledFor,
        failedCount,
      });
      return res.json({ draft: updated.rows[0], results });
    } catch (error) {
      return handleError(res, error, 'Failed to schedule workspace draft');
    }
  },

  async publishWorkspaceDraft(req, res) {
    try {
      const { agency, workspace, workspaceRole } = await getRequestWorkspaceAccess(req);
      assertAgencyDraftApproverRole(workspaceRole, 'Only owner/admin can publish drafts');

      const draftResult = await query(
        `SELECT *
         FROM agency_workspace_drafts
         WHERE id = $1 AND workspace_id = $2
         LIMIT 1`,
        [req.params.draftId, workspace.id]
      );
      if (draftResult.rows.length === 0) throw apiError('Workspace draft not found', 'WORKSPACE_DRAFT_NOT_FOUND', 404);
      const draft = draftResult.rows[0];
      const currentStatus = normalizeDraftStatus(draft.status, 'draft');
      if (!['approved', 'scheduled', 'failed'].includes(currentStatus)) {
        throw apiError('Only approved, scheduled, or failed drafts can be published', 'WORKSPACE_DRAFT_PUBLISH_STATUS_INVALID', 400);
      }
      const draftMetadata =
        draft?.generation_metadata && typeof draft.generation_metadata === 'object'
          ? draft.generation_metadata
          : {};

      const content = cleanText(req.body.content, draft.content);
      if (!content) throw apiError('Draft content is empty', 'WORKSPACE_DRAFT_CONTENT_REQUIRED', 400);
      const requestedThreadParts = normalizeThreadParts(req.body.threadParts);
      const storedThreadParts = normalizeThreadParts(draftMetadata.threadParts);
      const requestedPostMode = cleanText(req.body.postMode, null);
      const baseMode = String(requestedPostMode || draftMetadata.postMode || (storedThreadParts.length >= 2 ? 'thread' : 'single')).toLowerCase() === 'thread'
        ? 'thread'
        : 'single';
      const threadParts = requestedThreadParts.length >= 2
        ? requestedThreadParts
        : baseMode === 'thread'
          ? splitTextByCharacterLimit(content, 280, 25)
          : storedThreadParts;
      const normalizedMode = baseMode === 'thread' && threadParts.length >= 2
          ? 'thread'
          : 'single';
      const selectedAccountIds = normalizeWorkspaceAccountIds(
        req.body.targetWorkspaceAccountIds || draft.platform_targets || []
      );
      if (selectedAccountIds.length === 0) {
        throw apiError('Select at least one attached account to publish this draft', 'WORKSPACE_DRAFT_TARGETS_REQUIRED', 400);
      }

      const selectedAccounts = await listAgencyEligibleWorkspaceAccounts(workspace.id, {
        workspaceAccountIds: selectedAccountIds,
      });
      if (selectedAccounts.length !== selectedAccountIds.length) {
        throw apiError('One or more draft targets are no longer attached to this workspace', 'WORKSPACE_DRAFT_TARGETS_INVALID', 400);
      }

      const byId = new Map(selectedAccounts.map((row) => [String(row.id), row]));
      const orderedAccounts = selectedAccountIds.map((id) => byId.get(id)).filter(Boolean);
      const media = Array.isArray(draft.media_urls) ? draft.media_urls : [];

      const settled = await Promise.allSettled(
        orderedAccounts.map((account) =>
          publishToWorkspaceAccount({
            userId: req.user.id,
            account,
            content,
            postMode: normalizedMode,
            threadParts,
            media,
          })
        )
      );

      const results = settled.map((entry, index) => {
        const account = orderedAccounts[index];
        const base = {
          workspaceAccountId: String(account.id),
          platform: normalizeWorkspacePlatform(account.platform),
          accountDisplayName:
            cleanText(account.account_display_name, null) ||
            cleanText(account.account_username, null) ||
            cleanText(account.account_id, null) ||
            cleanText(account.source_id, 'account'),
        };

        if (entry.status === 'fulfilled') {
          return {
            ...base,
            status: 'posted',
            postId: entry.value.postId || null,
            postUrl: entry.value.postUrl || null,
            details: entry.value.payload || {},
          };
        }

        return {
          ...base,
          status: 'failed',
          error: entry.reason?.message || 'Failed to publish',
          code: entry.reason?.code || 'PUBLISH_FAILED',
        };
      });

      const failedCount = results.filter((item) => item.status === 'failed').length;
      const nextStatus = failedCount === results.length ? 'failed' : 'published';
      const updatedDraft = await query(
        `UPDATE agency_workspace_drafts
         SET content = $1,
             platform_targets = $2::jsonb,
             status = $3,
             published_at = CASE WHEN $3 = 'published' THEN NOW() ELSE published_at END,
             last_error = $4,
             downstream_results = $5::jsonb,
             rejected_reason = NULL,
             generation_metadata = COALESCE(generation_metadata, '{}'::jsonb) || $9::jsonb,
             updated_by = $6,
             updated_at = NOW()
         WHERE id = $7 AND workspace_id = $8
         RETURNING *`,
        [
          content,
          JSON.stringify(selectedAccountIds),
          nextStatus,
          failedCount > 0 ? results.filter((item) => item.status === 'failed').map((item) => item.error).join('; ') : null,
          JSON.stringify({ results }),
          req.user.id,
          draft.id,
          workspace.id,
          JSON.stringify({ postMode: normalizedMode, threadParts }),
        ]
      );

      await logAudit(agency.id, req.user.id, 'workspace_draft_published', 'agency_workspace_draft', draft.id, {
        workspaceId: workspace.id,
        requestedTargets: selectedAccountIds.length,
        failedCount,
      });

      return res.json({
        draft: updatedDraft.rows[0],
        results,
      });
    } catch (error) {
      return handleError(res, error, 'Failed to publish workspace draft');
    }
  },

  async getWorkspaceAnalyticsSummary(req, res) {
    try {
      const { workspace } = await getRequestWorkspaceAccess(req);

      const summary = await buildWorkspaceAnalyticsSummary({ workspaceId: workspace.id });
      return res.json({
        workspaceId: workspace.id,
        summary: {
          ...summary,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      return handleError(res, error, 'Failed to load workspace analytics summary');
    }
  },

  async getWorkspaceSettings(req, res) {
    try {
      const { workspace, workspaceRole } = await getRequestWorkspaceAccess(req);

      const settings = await buildWorkspaceEffectiveSettings({
        workspace,
        userId: req.user.id,
      });
      return res.json({
        workspaceId: workspace.id,
        currentMemberRole: workspaceRole,
        settings,
      });
    } catch (error) {
      return handleError(res, error, 'Failed to load workspace settings');
    }
  },

  async upsertWorkspaceSettings(req, res) {
    try {
      const { agency, workspace, workspaceRole } = await getRequestWorkspaceAccess(req);
      assertAgencyDraftWriteRole(workspaceRole, 'Only owner/admin/editor can update workspace settings');

      const profileNotes = cleanText(req.body.profileNotes || req.body.profile_notes, null);
      const competitorTargets = normalizeStringArray(req.body.competitorTargets || req.body.competitor_targets || [], 25);
      const currentSettings = await getWorkspaceSettings(workspace.id);
      const currentPostingPreferences = normalizeWorkspacePostingPreferences(currentSettings.posting_preferences);
      const requestPostingPreferences = req.body.postingPreferences && typeof req.body.postingPreferences === 'object'
        ? req.body.postingPreferences
        : {};
      const postingPreferences = normalizeWorkspacePostingPreferences({
        ...currentPostingPreferences,
        ...requestPostingPreferences,
        industry: req.body.industry ?? req.body.industry_name ?? requestPostingPreferences.industry ?? currentPostingPreferences.industry,
        brand_colors: req.body.brandColors ?? req.body.brand_colors ?? requestPostingPreferences.brand_colors ?? requestPostingPreferences.brandColors ?? currentPostingPreferences.brand_colors,
        target_audience: req.body.targetAudience ?? req.body.target_audience ?? requestPostingPreferences.target_audience ?? requestPostingPreferences.targetAudience ?? currentPostingPreferences.target_audience,
        tone_presets: req.body.tonePresets ?? req.body.tone_presets ?? requestPostingPreferences.tone_presets ?? requestPostingPreferences.tonePresets ?? currentPostingPreferences.tone_presets,
        portal_title: req.body.portalTitle ?? req.body.portal_title ?? requestPostingPreferences.portal_title ?? requestPostingPreferences.portalTitle ?? currentPostingPreferences.portal_title,
        portal_message: req.body.portalMessage ?? req.body.portal_message ?? requestPostingPreferences.portal_message ?? requestPostingPreferences.portalMessage ?? currentPostingPreferences.portal_message,
      });

      const saved = await query(
        `INSERT INTO agency_workspace_settings
         (workspace_id, profile_notes, competitor_targets, automation_enabled, require_admin_approval, auto_generate_twitter, auto_generate_linkedin, auto_generate_social, engagement_auto_reply, posting_preferences, updated_by, created_at, updated_at)
         VALUES
         ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, NOW(), NOW())
         ON CONFLICT (workspace_id)
         DO UPDATE SET
           profile_notes = EXCLUDED.profile_notes,
           competitor_targets = EXCLUDED.competitor_targets,
           automation_enabled = EXCLUDED.automation_enabled,
           require_admin_approval = EXCLUDED.require_admin_approval,
           auto_generate_twitter = EXCLUDED.auto_generate_twitter,
           auto_generate_linkedin = EXCLUDED.auto_generate_linkedin,
           auto_generate_social = EXCLUDED.auto_generate_social,
           engagement_auto_reply = EXCLUDED.engagement_auto_reply,
           posting_preferences = EXCLUDED.posting_preferences,
           updated_by = EXCLUDED.updated_by,
           updated_at = NOW()
         RETURNING *`,
        [
          workspace.id,
          profileNotes,
          JSON.stringify(competitorTargets),
          toBoolean(req.body.automationEnabled ?? req.body.automation_enabled, false),
          toBoolean(req.body.requireAdminApproval ?? req.body.require_admin_approval, true),
          toBoolean(req.body.autoGenerateTwitter ?? req.body.auto_generate_twitter, true),
          toBoolean(req.body.autoGenerateLinkedin ?? req.body.auto_generate_linkedin, true),
          toBoolean(req.body.autoGenerateSocial ?? req.body.auto_generate_social, false),
          toBoolean(req.body.engagementAutoReply ?? req.body.engagement_auto_reply, false),
          JSON.stringify(postingPreferences),
          req.user.id,
        ]
      );

      await logAudit(agency.id, req.user.id, 'workspace_settings_updated', 'agency_workspace', workspace.id, {
        workspaceId: workspace.id,
      });

      return res.json({
        workspaceId: workspace.id,
        settings: {
          ...saved.rows[0],
          posting_preferences: normalizeWorkspacePostingPreferences(saved.rows[0].posting_preferences),
        },
      });
    } catch (error) {
      return handleError(res, error, 'Failed to save workspace settings');
    }
  },

  async getWorkspaceInsightsSummary(req, res) {
    try {
      const { workspace } = await getRequestWorkspaceAccess(req);

      const insights = await buildWorkspaceInsightsSummary({
        workspace,
        userId: req.user.id,
      });

      return res.json({
        workspaceId: workspace.id,
        insights,
      });
    } catch (error) {
      return handleError(res, error, 'Failed to load workspace insights summary');
    }
  },

  async getWorkspaceAnalysisSummary(req, res) {
    try {
      const { workspace } = await getRequestWorkspaceAccess(req);
      const analysis = await buildWorkspaceAnalysisSummary({
        workspace,
        userId: req.user.id,
      });

      return res.json({
        workspaceId: workspace.id,
        analysis,
      });
    } catch (error) {
      return handleError(res, error, 'Failed to load workspace analysis summary');
    }
  },

  async publishWorkspacePost(req, res) {
    try {
      const { agency, workspace, workspaceRole } = await getRequestWorkspaceAccess(req);
      if (!isAgencyDraftApproverRole(workspaceRole)) {
        throw apiError('Only owner/admin can publish directly. Save a draft for approval instead.', 'INSUFFICIENT_PERMISSIONS', 403);
      }
      if (workspace.status !== 'active') {
        throw apiError('Workspace must be active to publish', 'WORKSPACE_NOT_ACTIVE', 400);
      }

      const content = cleanText(req.body.content);
      const postMode = cleanText(req.body.postMode, 'single') || 'single';
      const threadParts = Array.isArray(req.body.threadParts)
        ? req.body.threadParts.map((value) => cleanText(value)).filter(Boolean)
        : [];
      const media = normalizeMediaInputs(Array.isArray(req.body.media) ? req.body.media : req.body.mediaUrls);
      const selectedAccountIds = normalizeWorkspaceAccountIds(
        req.body.targetWorkspaceAccountIds || req.body.workspaceAccountIds || req.body.targets
      );

      const normalizedMode = String(postMode || 'single').toLowerCase() === 'thread' ? 'thread' : 'single';

      if (!content && normalizedMode !== 'thread') {
        throw apiError('content is required', 'PUBLISH_CONTENT_REQUIRED', 400);
      }
      if (normalizedMode === 'thread' && threadParts.length < 2 && !content) {
        throw apiError('threadParts (2+) or content is required for thread mode', 'PUBLISH_THREAD_PARTS_REQUIRED', 400);
      }
      if (selectedAccountIds.length === 0) {
        throw apiError('Select at least one attached account to publish', 'PUBLISH_TARGETS_REQUIRED', 400);
      }

      const selectedAccounts = await listAgencyEligibleWorkspaceAccounts(workspace.id, {
        workspaceAccountIds: selectedAccountIds,
      });

      if (selectedAccounts.length !== selectedAccountIds.length) {
        throw apiError('One or more selected accounts are invalid for this workspace', 'WORKSPACE_ACCOUNT_SELECTION_INVALID', 400);
      }

      const byId = new Map(selectedAccounts.map((row) => [String(row.id), row]));
      const orderedAccounts = selectedAccountIds
        .map((id) => byId.get(id))
        .filter(Boolean);

      const settled = await Promise.allSettled(
        orderedAccounts.map((account) =>
          publishToWorkspaceAccount({
            userId: req.user.id,
            account,
            content: content || threadParts[0] || '',
            postMode: normalizedMode,
            threadParts,
            media,
          })
        )
      );

      const results = settled.map((entry, index) => {
        const account = orderedAccounts[index];
        const base = {
          workspaceAccountId: String(account.id),
          platform: normalizeWorkspacePlatform(account.platform),
          accountDisplayName:
            cleanText(account.account_display_name, null) ||
            cleanText(account.account_username, null) ||
            cleanText(account.account_id, null) ||
            cleanText(account.source_id, 'account'),
        };

        if (entry.status === 'fulfilled') {
          return {
            ...base,
            status: 'posted',
            teamId: entry.value.teamId || null,
            target: entry.value.target || null,
            postId: entry.value.postId || null,
            postUrl: entry.value.postUrl || null,
            details: entry.value.payload || {},
          };
        }

        const reason = entry.reason || {};
        return {
          ...base,
          status: 'failed',
          code: reason.code || 'PUBLISH_FAILED',
          error: reason.message || 'Failed to publish',
          teamId: reason?.downstream?.teamId || null,
          details: reason?.downstream || null,
        };
      });

      const successCount = results.filter((result) => result.status === 'posted').length;
      const failedCount = results.length - successCount;

      await logAudit(agency.id, req.user.id, 'workspace_publish_fanout', 'agency_workspace', workspace.id, {
        workspaceId: workspace.id,
        requestedTargets: selectedAccountIds.length,
        successCount,
        failedCount,
        postMode: normalizedMode,
      });

      return res.status(200).json({
        workspaceId: workspace.id,
        summary: {
          requestedTargets: selectedAccountIds.length,
          successCount,
          failedCount,
          postMode: normalizedMode,
        },
        results,
      });
    } catch (error) {
      return handleError(res, error, 'Failed to publish from workspace');
    }
  },

  async getWorkspaceOperationsSnapshot(req, res) {
    try {
      const { workspace } = await getRequestWorkspaceAccess(req);
      const limit = Math.max(1, Math.min(100, Number(req.query.limit || 50) || 50));
      const queueLimit = Math.max(1, Math.min(100, Number(req.query.queueLimit || limit) || limit));
      const snapshot = await buildWorkspaceOperationsSnapshotData({
        workspace,
        userId: req.user.id,
        limit,
        queueLimit,
      });

      return res.json(snapshot);
    } catch (error) {
      return handleError(res, error, 'Failed to fetch workspace operations snapshot');
    }
  },

  async createApprovalToken(req, res) {
    try {
      const { agency } = await getAgencyContext(req.user.id);
      const workspace = await getWorkspace(req.params.workspaceId, agency.id);
      if (workspace.status === 'archived') throw apiError('Cannot share approval links for archived workspaces', 'WORKSPACE_ARCHIVED', 400);

      const label = cleanText(req.body.label, 'Client approval link');
      const token = jwt.sign(
        {
          workspaceId: workspace.id,
          agencyId: agency.id,
          scope: 'client_approval_portal',
          iat: Math.floor(Date.now() / 1000),
        },
        AGENCY_JWT_SECRET,
        { expiresIn: `${AGENCY_APPROVAL_TOKEN_TTL_DAYS}d` }
      );

      const shouldReplaceExisting = String(req.body.replaceExisting || '').toLowerCase() === 'true'
        || req.body.replaceExisting === true;

      if (shouldReplaceExisting) {
        await safeQuery(
          `UPDATE agency_approval_tokens
           SET is_active = false,
               updated_at = NOW()
           WHERE workspace_id = $1
             AND agency_id = $2
             AND is_active = true`,
          [workspace.id, agency.id]
        );
      }

      const inserted = await query(
        `INSERT INTO agency_approval_tokens
         (workspace_id, agency_id, token, label, is_active, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, $5, NOW(), NOW())
         RETURNING id, token, label, is_active, created_at, last_used_at`,
        [workspace.id, agency.id, token, label, req.user.id]
      );

      await logAudit(agency.id, req.user.id, 'approval_token_created', 'agency_workspace', workspace.id, { label });

      const current = inserted.rows[0];
      return res.json({
        id: current.id,
        token: current.token,
        label: current.label,
        is_active: current.is_active,
        created_at: current.created_at,
        last_used_at: current.last_used_at,
        approvalUrl: getAgencyApprovalUrl(current.token),
        expiresIn: `${AGENCY_APPROVAL_TOKEN_TTL_DAYS} days`,
      });
    } catch (error) {
      return handleError(res, error, 'Failed to create approval token');
    }
  },

  async listApprovalTokens(req, res) {
    try {
      const { agency } = await getAgencyContext(req.user.id);
      const workspace = await getWorkspace(req.params.workspaceId, agency.id);

      const rows = await safeQuery(
        `SELECT id, token, label, is_active, created_at, last_used_at
         FROM agency_approval_tokens
         WHERE workspace_id = $1
           AND agency_id = $2
         ORDER BY created_at DESC
         LIMIT 12`,
        [workspace.id, agency.id]
      );

      return res.json({
        links: rows.map((row) => ({
          id: row.id,
          token: row.token,
          label: row.label,
          is_active: row.is_active,
          created_at: row.created_at,
          last_used_at: row.last_used_at,
          approvalUrl: getAgencyApprovalUrl(row.token),
        })),
      });
    } catch (error) {
      return handleError(res, error, 'Failed to list approval links');
    }
  },

  async getApprovalToken(req, res) {
    try {
      const { agency } = await getAgencyContext(req.user.id);
      const workspace = await getWorkspace(req.params.workspaceId, agency.id);

      const rows = await safeQuery(
        `SELECT token, label, is_active, created_at, last_used_at
         FROM agency_approval_tokens
         WHERE workspace_id = $1
           AND agency_id = $2
           AND is_active = true
         ORDER BY created_at DESC
         LIMIT 1`,
        [workspace.id, agency.id]
      );

      if (rows.length === 0) {
        return res.json({ token: null, approvalUrl: null, label: null, created_at: null, last_used_at: null });
      }

      const current = rows[0];
      return res.json({
        token: current.token,
        label: current.label,
        created_at: current.created_at,
        last_used_at: current.last_used_at,
        approvalUrl: getAgencyApprovalUrl(current.token),
      });
    } catch (error) {
      return handleError(res, error, 'Failed to get approval token');
    }
  },

  async revokeApprovalToken(req, res) {
    try {
      const { agency } = await getAgencyContext(req.user.id);
      const workspace = await getWorkspace(req.params.workspaceId, agency.id);

      const rows = await safeQuery(
        `UPDATE agency_approval_tokens
         SET is_active = false,
             updated_at = NOW()
         WHERE id = $1
           AND workspace_id = $2
           AND agency_id = $3
           AND is_active = true
         RETURNING id, label`,
        [req.params.tokenId, workspace.id, agency.id]
      );

      if (rows.length === 0) {
        throw apiError('Approval link not found or already revoked', 'APPROVAL_LINK_NOT_FOUND', 404);
      }

      await logAudit(agency.id, req.user.id, 'approval_token_revoked', 'agency_workspace', workspace.id, {
        tokenId: rows[0].id,
        label: rows[0].label,
      });

      return res.json({
        success: true,
        revoked: rows[0],
      });
    } catch (error) {
      return handleError(res, error, 'Failed to revoke approval link');
    }
  },

  };
}
