export function createAgencyClientOnboardingController(deps = {}) {
  const {
    crypto,
    jwt,
    pool,
    query,
    EmailService,
    apiError,
    cleanText,
    cleanEmail,
    handleError,
    logAudit,
    getAgencyContext,
    getWorkspace,
    listAgencyEligibleWorkspaceAccounts,
    ensureApiBaseUrl,
    normalizeWorkspacePlatform,
    safeQuery,
    TOOL_API_BASE_URLS,
    AGENCY_INVITE_URL_BASE,
    AGENCY_LIMITS,
    EDIT_ROLES,
  } = deps;

  const AGENCY_CLIENT_ONBOARDING_EXPIRY_HOURS = Math.max(1, Number.parseInt(process.env.AGENCY_CLIENT_ONBOARDING_EXPIRY_HOURS || '72', 10));
  const AGENCY_CLIENT_ONBOARDING_DEFAULT_PLATFORMS = Object.freeze(['twitter', 'linkedin']);
  const AGENCY_CLIENT_ONBOARDING_ALLOWED_PLATFORMS = new Set(['twitter', 'linkedin', 'instagram', 'threads', 'youtube']);

  const getAgencyClientOnboardingUrl = (token) => {
    const base = String(AGENCY_INVITE_URL_BASE || 'https://suitegenie.in').replace(/\/+$/, '');
    return `${base}/agency/client-onboarding/${encodeURIComponent(String(token || '').trim())}`;
  };

  const normalizeOnboardingPlatforms = (value) => {
    const rawValues = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(',')
        : [];

    const normalized = [...new Set(
      rawValues
        .map((item) => cleanText(item, '')?.toLowerCase() || '')
        .filter((platform) => AGENCY_CLIENT_ONBOARDING_ALLOWED_PLATFORMS.has(platform))
    )];

    return normalized.length > 0
      ? normalized
      : [...AGENCY_CLIENT_ONBOARDING_DEFAULT_PLATFORMS];
  };

  const normalizeOnboardingMaxAccounts = (value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return AGENCY_LIMITS.workspaceAccountLimit;
    return Math.max(1, Math.min(50, parsed));
  };

  const resolveAgencyApiBaseUrl = (req) => {
    const envBase = cleanText(process.env.PLATFORM_API_URL || process.env.API_URL, null);
    if (envBase) return envBase.replace(/\/+$/, '');

    const protocol = req?.headers?.['x-forwarded-proto'] || req?.protocol || 'https';
    const host = req?.headers?.['x-forwarded-host'] || req?.get?.('host') || req?.headers?.host || null;
    if (!host) return null;
    return `${protocol}://${host}`.replace(/\/+$/, '');
  };

  const resolveClientOnboardingOAuthConfig = (platform) => {
    const normalizedPlatform = cleanText(platform, '')?.toLowerCase() || '';
    if (normalizedPlatform === 'twitter') return { tool: 'twitter', path: '/api/twitter/client-connect' };
    if (normalizedPlatform === 'linkedin') return { tool: 'linkedin', path: '/api/oauth/linkedin/client-connect' };
    if (normalizedPlatform === 'instagram') return { tool: 'social', path: '/api/oauth/instagram/client-connect' };
    if (normalizedPlatform === 'threads') return { tool: 'social', path: '/api/oauth/threads/client-connect' };
    if (normalizedPlatform === 'youtube') return { tool: 'social', path: '/api/oauth/youtube/client-connect' };
    return null;
  };

  const getClientOnboardingExpiryDate = () => new Date(Date.now() + (AGENCY_CLIENT_ONBOARDING_EXPIRY_HOURS * 60 * 60 * 1000));

  const buildClientOnboardingToken = (payload = {}) => jwt.sign(
    {
      ...payload,
      scope: 'agency_client_onboarding',
      nonce: crypto.randomBytes(8).toString('hex'),
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_SECRET || 'development-secret',
    { expiresIn: `${AGENCY_CLIENT_ONBOARDING_EXPIRY_HOURS}h` }
  );

  const getClientOnboardingByToken = async (token, { forUpdate = false } = {}) => {
    const normalizedToken = cleanText(token, null);
    if (!normalizedToken) {
      throw apiError('Onboarding token is required', 'ONBOARDING_TOKEN_REQUIRED', 400);
    }

    const queryText = `
      SELECT
        aco.*,
        aw.name AS workspace_name,
        aw.brand_name AS workspace_brand_name,
        aw.status AS workspace_status,
        aa.name AS agency_name
      FROM agency_client_onboarding aco
      JOIN agency_workspaces aw ON aw.id = aco.workspace_id
      JOIN agency_accounts aa ON aa.id = aco.agency_id
      WHERE aco.token = $1
      LIMIT 1
      ${forUpdate ? 'FOR UPDATE' : ''}
    `;

    const result = await query(queryText, [normalizedToken]);
    if (result.rows.length === 0) {
      throw apiError('Onboarding link not found', 'ONBOARDING_LINK_NOT_FOUND', 404);
    }

    const onboarding = result.rows[0];
    const expiresAt = onboarding.expires_at ? new Date(onboarding.expires_at) : null;
    const isExpired = !expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now();

    if (isExpired && onboarding.status === 'pending') {
      await query(
        `UPDATE agency_client_onboarding
         SET status = 'expired', updated_at = NOW()
         WHERE id = $1 AND status = 'pending'`,
        [onboarding.id]
      );
      onboarding.status = 'expired';
    }

    if (onboarding.status !== 'pending') {
      throw apiError('Onboarding link is not active', 'ONBOARDING_LINK_NOT_ACTIVE', 400);
    }

    if (isExpired) {
      throw apiError('Onboarding link has expired', 'ONBOARDING_LINK_EXPIRED', 400);
    }

    return onboarding;
  };

  const listWorkspaceConnectedAccounts = async (workspaceId) => {
    const rows = await listAgencyEligibleWorkspaceAccounts(workspaceId);
    return rows.map((row) => ({
      workspaceAccountId: row.id,
      platform: normalizeWorkspacePlatform(row.platform),
      accountUsername: cleanText(row.account_username, null),
      accountDisplayName: cleanText(row.account_display_name, null),
      accountId: cleanText(row.account_id, null),
      sourceType: cleanText(row.source_type, null),
      sourceId: cleanText(row.source_id, null),
      profileImageUrl: cleanText(row.profile_image_url, null),
    }));
  };

  const sendClientOnboardingEmail = async ({
    recipientEmail,
    recipientName,
    agencyName,
    workspaceName,
    brandName,
    platforms,
    onboardingUrl,
    expiresAt,
    createdByName,
  } = {}) => {
    if (!recipientEmail) return { sent: false, provider: 'resend', error: 'Missing recipient email' };
    try {
      const emailService = new EmailService();
      await emailService.sendClientOnboardingInvitation({
        recipientEmail,
        recipientName: recipientName || recipientEmail,
        agencyName,
        workspaceName,
        brandName,
        platforms,
        onboardingUrl,
        expiresAt,
        createdByName,
      });
      return { sent: true, provider: 'resend' };
    } catch (error) {
      console.warn('[AgencyController] Failed to send client onboarding email (continuing with link flow):', error?.message || error);
      return { sent: false, provider: 'resend', error: error?.message || String(error) };
    }
  };

  const isInternalApiKeyValid = (req) => {
    const expected = cleanText(process.env.INTERNAL_API_KEY, null);
    const provided = cleanText(req.headers?.['x-internal-api-key'], null);
    return Boolean(expected && provided && expected === provided);
  };

  return {
    async getClientOnboardingStatus(req, res) {
      try {
        const token = cleanText(req.params.token, null);
        const onboarding = await getClientOnboardingByToken(token);
        const connectedAccounts = await listWorkspaceConnectedAccounts(onboarding.workspace_id);

        return res.json({
          token,
          onboarding: {
            id: onboarding.id,
            status: onboarding.status,
            expiresAt: onboarding.expires_at,
            allowedPlatforms: normalizeOnboardingPlatforms(onboarding.allowed_platforms),
            maxAccounts: Number(onboarding.max_accounts || AGENCY_LIMITS.workspaceAccountLimit),
            accountsConnected: Number(onboarding.accounts_connected || 0),
            clientEmail: cleanText(onboarding.client_email, null),
            clientName: cleanText(onboarding.client_name, null),
            agency: {
              id: onboarding.agency_id,
              name: onboarding.agency_name,
            },
            workspace: {
              id: onboarding.workspace_id,
              name: onboarding.workspace_name,
              brandName: onboarding.workspace_brand_name,
              status: onboarding.workspace_status,
            },
            connectedAccounts: connectedAccounts.map((account) => ({
              platform: account.platform,
              accountUsername: account.accountUsername,
              accountDisplayName: account.accountDisplayName,
            })),
          },
        });
      } catch (error) {
        return handleError(res, error, 'Failed to load client onboarding status');
      }
    },

    async initiateClientOAuth(req, res) {
      try {
        const token = cleanText(req.params.token, null);
        const onboarding = await getClientOnboardingByToken(token);
        const platform = cleanText(req.body?.platform || req.query?.platform, '')?.toLowerCase() || '';
        if (!platform) throw apiError('platform is required', 'ONBOARDING_PLATFORM_REQUIRED', 400);

        const allowedPlatforms = normalizeOnboardingPlatforms(onboarding.allowed_platforms);
        if (!allowedPlatforms.includes(platform)) {
          throw apiError('Requested platform is not allowed for this onboarding link', 'ONBOARDING_PLATFORM_NOT_ALLOWED', 400);
        }

        const accountCountResult = await safeQuery(
          `SELECT COUNT(*)::int AS count
           FROM agency_workspace_accounts
           WHERE workspace_id = $1
             AND is_active = true`,
          [onboarding.workspace_id]
        );
        const activeCount = Number(accountCountResult[0]?.count || 0);
        const maxAccounts = Number(onboarding.max_accounts || AGENCY_LIMITS.workspaceAccountLimit);
        if (activeCount >= maxAccounts || Number(onboarding.accounts_connected || 0) >= maxAccounts) {
          throw apiError('Workspace account limit reached for this onboarding link', 'ONBOARDING_ACCOUNT_LIMIT_REACHED', 400);
        }

        const oauthConfig = resolveClientOnboardingOAuthConfig(platform);
        if (!oauthConfig) {
          throw apiError(`Unsupported onboarding platform "${platform}"`, 'ONBOARDING_PLATFORM_UNSUPPORTED', 400);
        }

        const oauthBase = ensureApiBaseUrl(TOOL_API_BASE_URLS[oauthConfig.tool], null);
        if (!oauthBase) {
          throw apiError('OAuth service URL is not configured', 'ONBOARDING_OAUTH_URL_MISSING', 500);
        }

        const apiBase = resolveAgencyApiBaseUrl(req);
        if (!apiBase) {
          throw apiError('Could not resolve platform API base URL', 'ONBOARDING_CALLBACK_URL_MISSING', 500);
        }

        const defaultReturnUrl = getAgencyClientOnboardingUrl(token);
        const requestedReturnUrl = cleanText(req.body?.returnUrl || req.query?.returnUrl, null);
        const returnUrl = requestedReturnUrl || defaultReturnUrl;
        const platformCallback = `${apiBase}/api/agency/client-oauth-callback`;

        const params = new URLSearchParams({
          workspace_id: String(onboarding.workspace_id),
          onboarding_token: token,
          return_url: returnUrl,
          platform_callback: platformCallback,
          platform,
        });

        return res.json({
          success: true,
          platform,
          oauthUrl: `${oauthBase}${oauthConfig.path}?${params.toString()}`,
        });
      } catch (error) {
        return handleError(res, error, 'Failed to initiate client OAuth');
      }
    },

    async handleClientOAuthCallback(req, res) {
      const client = await pool.connect();
      try {
        if (!isInternalApiKeyValid(req)) {
          return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED_INTERNAL_CALL' });
        }

        const onboardingToken = cleanText(req.body?.onboarding_token || req.body?.onboardingToken, null);
        const workspaceIdInput = cleanText(req.body?.workspace_id || req.body?.workspaceId, null);
        const platform = normalizeWorkspacePlatform(req.body?.platform);
        const sourceType = cleanText(req.body?.source_type || req.body?.sourceType, null);
        const sourceId = cleanText(req.body?.source_id || req.body?.sourceId, null);
        const accountId = cleanText(req.body?.account_id || req.body?.accountId, null);
        const accountUsername = cleanText(req.body?.account_username || req.body?.accountUsername, null);
        const accountDisplayName = cleanText(req.body?.account_display_name || req.body?.accountDisplayName, null);
        const profileImageUrl = cleanText(req.body?.profile_image_url || req.body?.profileImageUrl, null);
        const metadata = (req.body?.metadata && typeof req.body.metadata === 'object') ? req.body.metadata : {};

        if (!onboardingToken) throw apiError('onboarding_token is required', 'ONBOARDING_TOKEN_REQUIRED', 400);
        if (!platform) throw apiError('platform is required', 'ONBOARDING_PLATFORM_REQUIRED', 400);
        if (!sourceType || !sourceId) throw apiError('source_type and source_id are required', 'ONBOARDING_SOURCE_REQUIRED', 400);

        await client.query('BEGIN');

        const onboardingResult = await client.query(
          `SELECT
             aco.*,
             aw.name AS workspace_name,
             aa.name AS agency_name
           FROM agency_client_onboarding aco
           JOIN agency_workspaces aw ON aw.id = aco.workspace_id
           JOIN agency_accounts aa ON aa.id = aco.agency_id
           WHERE aco.token = $1
           FOR UPDATE`,
          [onboardingToken]
        );
        if (onboardingResult.rows.length === 0) {
          throw apiError('Onboarding link not found', 'ONBOARDING_LINK_NOT_FOUND', 404);
        }
        const onboarding = onboardingResult.rows[0];

        const expiresAt = onboarding.expires_at ? new Date(onboarding.expires_at) : null;
        const isExpired = !expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now();
        if (isExpired && onboarding.status === 'pending') {
          await client.query(
            `UPDATE agency_client_onboarding
             SET status = 'expired', updated_at = NOW()
             WHERE id = $1`,
            [onboarding.id]
          );
        }
        if (onboarding.status !== 'pending') {
          throw apiError('Onboarding link is not active', 'ONBOARDING_LINK_NOT_ACTIVE', 400);
        }
        if (isExpired) {
          throw apiError('Onboarding link has expired', 'ONBOARDING_LINK_EXPIRED', 400);
        }

        if (workspaceIdInput && String(workspaceIdInput) !== String(onboarding.workspace_id)) {
          throw apiError('Workspace mismatch for onboarding callback', 'ONBOARDING_WORKSPACE_MISMATCH', 400);
        }

        const allowedPlatforms = normalizeOnboardingPlatforms(onboarding.allowed_platforms);
        if (!allowedPlatforms.includes(platform)) {
          throw apiError('Platform is not allowed for this onboarding link', 'ONBOARDING_PLATFORM_NOT_ALLOWED', 400);
        }

        const existing = await client.query(
          `SELECT id
           FROM agency_workspace_accounts
           WHERE workspace_id = $1
             AND source_type = $2
             AND source_id = $3
             AND is_active = true
           LIMIT 1`,
          [onboarding.workspace_id, sourceType, sourceId]
        );
        if (existing.rows.length > 0) {
          await client.query('COMMIT');
          return res.json({
            success: true,
            duplicate: true,
            workspaceId: onboarding.workspace_id,
            agencyId: onboarding.agency_id,
          });
        }

        const countResult = await client.query(
          `SELECT COUNT(*)::int AS count
           FROM agency_workspace_accounts
           WHERE workspace_id = $1
             AND is_active = true`,
          [onboarding.workspace_id]
        );
        const activeCount = Number(countResult.rows[0]?.count || 0);
        const maxAccounts = Number(onboarding.max_accounts || AGENCY_LIMITS.workspaceAccountLimit);
        if (activeCount >= maxAccounts || Number(onboarding.accounts_connected || 0) >= maxAccounts) {
          throw apiError('Workspace account limit reached for this onboarding link', 'ONBOARDING_ACCOUNT_LIMIT_REACHED', 400);
        }

        const inserted = await client.query(
          `INSERT INTO agency_workspace_accounts
           (workspace_id, platform, source_type, source_id, account_id, account_username, account_display_name, profile_image_url, metadata, attached_by, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, true, NOW(), NOW())
           RETURNING *`,
          [
            onboarding.workspace_id,
            platform,
            sourceType,
            sourceId,
            accountId,
            accountUsername,
            accountDisplayName,
            profileImageUrl,
            JSON.stringify({
              ...metadata,
              onboarding_id: onboarding.id,
              onboarding_token: onboardingToken,
              scope: 'agency_client_onboarding',
            }),
            onboarding.created_by || null,
          ]
        );

        await client.query(
          `UPDATE agency_client_onboarding
           SET accounts_connected = LEAST(max_accounts, accounts_connected + 1),
               metadata = metadata || $2::jsonb,
               updated_at = NOW()
           WHERE id = $1`,
          [
            onboarding.id,
            JSON.stringify({
              lastConnectedAccount: {
                platform,
                sourceType,
                sourceId,
                accountId,
                accountUsername,
              },
            }),
          ]
        );

        await client.query('COMMIT');
        await logAudit(
          onboarding.agency_id,
          onboarding.created_by || null,
          'client_onboarding_account_connected',
          'agency_workspace_account',
          inserted.rows[0].id,
          {
            workspaceId: onboarding.workspace_id,
            onboardingId: onboarding.id,
            platform,
            sourceType,
            sourceId,
          }
        );

        return res.json({
          success: true,
          workspaceId: onboarding.workspace_id,
          agencyId: onboarding.agency_id,
          account: inserted.rows[0],
        });
      } catch (error) {
        await client.query('ROLLBACK');
        return handleError(res, error, 'Failed to process client OAuth callback');
      } finally {
        client.release();
      }
    },

    async createClientOnboardingLink(req, res) {
      try {
        const { agency, member } = await getAgencyContext(req.user.id);
        if (!EDIT_ROLES.has(member.role)) {
          throw apiError('Only owner/admin can create client onboarding links', 'INSUFFICIENT_PERMISSIONS', 403);
        }

        const workspace = await getWorkspace(req.params.workspaceId, agency.id);
        const clientEmail = cleanEmail(req.body.clientEmail || req.body.client_email);
        const clientName = cleanText(req.body.clientName || req.body.client_name, null);
        const allowedPlatforms = normalizeOnboardingPlatforms(req.body.allowedPlatforms || req.body.allowed_platforms);
        const maxAccounts = normalizeOnboardingMaxAccounts(req.body.maxAccounts || req.body.max_accounts);
        const metadata = (req.body.metadata && typeof req.body.metadata === 'object') ? req.body.metadata : {};
        const token = buildClientOnboardingToken({
          agencyId: agency.id,
          workspaceId: workspace.id,
          clientEmail: clientEmail || null,
        });
        const expiresAt = getClientOnboardingExpiryDate();

        await query(
          `UPDATE agency_client_onboarding
           SET status = 'revoked', updated_at = NOW()
           WHERE workspace_id = $1
             AND agency_id = $2
             AND status = 'pending'`,
          [workspace.id, agency.id]
        );

        const created = await query(
          `INSERT INTO agency_client_onboarding
           (workspace_id, agency_id, client_email, client_name, token, expires_at, status, allowed_platforms, max_accounts, accounts_connected, created_by, metadata, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7::text[], $8, 0, $9, $10::jsonb, NOW(), NOW())
           RETURNING *`,
          [
            workspace.id,
            agency.id,
            clientEmail || null,
            clientName,
            token,
            expiresAt.toISOString(),
            allowedPlatforms,
            maxAccounts,
            req.user.id,
            JSON.stringify(metadata || {}),
          ]
        );
        const linkRow = created.rows[0];
        const onboardingUrl = getAgencyClientOnboardingUrl(token);

        let createdByName = cleanText(req.user?.name, null);
        if (!createdByName) {
          const userResult = await query('SELECT name, email FROM users WHERE id = $1 LIMIT 1', [req.user.id]);
          createdByName = cleanText(userResult.rows[0]?.name, userResult.rows[0]?.email);
        }

        const emailDelivery = clientEmail
          ? await sendClientOnboardingEmail({
              recipientEmail: clientEmail,
              recipientName: clientName || clientEmail,
              agencyName: agency.name,
              workspaceName: workspace.name,
              brandName: workspace.brand_name,
              platforms: allowedPlatforms,
              onboardingUrl,
              expiresAt: linkRow.expires_at,
              createdByName,
            })
          : { sent: false, provider: 'resend', error: null };

        await logAudit(agency.id, req.user.id, 'client_onboarding_link_created', 'agency_workspace', workspace.id, {
          workspaceId: workspace.id,
          onboardingId: linkRow.id,
          allowedPlatforms,
          maxAccounts,
          hasClientEmail: Boolean(clientEmail),
        });

        return res.status(201).json({
          success: true,
          onboarding: {
            ...linkRow,
            onboarding_url: onboardingUrl,
          },
          emailDelivery,
        });
      } catch (error) {
        return handleError(res, error, 'Failed to create client onboarding link');
      }
    },

    async listClientOnboardingLinks(req, res) {
      try {
        const { agency, member } = await getAgencyContext(req.user.id);
        if (!EDIT_ROLES.has(member.role)) {
          throw apiError('Only owner/admin can list client onboarding links', 'INSUFFICIENT_PERMISSIONS', 403);
        }
        const workspace = await getWorkspace(req.params.workspaceId, agency.id);

        const result = await query(
          `SELECT *
           FROM agency_client_onboarding
           WHERE workspace_id = $1
             AND agency_id = $2
           ORDER BY created_at DESC`,
          [workspace.id, agency.id]
        );

        const links = result.rows.map((row) => ({
          ...row,
          onboarding_url: getAgencyClientOnboardingUrl(row.token),
        }));

        return res.json({
          workspaceId: workspace.id,
          links,
        });
      } catch (error) {
        return handleError(res, error, 'Failed to list client onboarding links');
      }
    },

    async revokeClientOnboardingLink(req, res) {
      try {
        const { agency, member } = await getAgencyContext(req.user.id);
        if (!EDIT_ROLES.has(member.role)) {
          throw apiError('Only owner/admin can revoke client onboarding links', 'INSUFFICIENT_PERMISSIONS', 403);
        }
        const workspace = await getWorkspace(req.params.workspaceId, agency.id);
        const linkId = cleanText(req.params.linkId, null);
        if (!linkId) throw apiError('Link id is required', 'ONBOARDING_LINK_ID_REQUIRED', 400);

        const updated = await query(
          `UPDATE agency_client_onboarding
           SET status = 'revoked', updated_at = NOW()
           WHERE id = $1
             AND workspace_id = $2
             AND agency_id = $3
             AND status = 'pending'
           RETURNING *`,
          [linkId, workspace.id, agency.id]
        );
        if (updated.rows.length === 0) {
          throw apiError('Active onboarding link not found', 'ONBOARDING_LINK_NOT_FOUND', 404);
        }

        await logAudit(agency.id, req.user.id, 'client_onboarding_link_revoked', 'agency_workspace', workspace.id, {
          workspaceId: workspace.id,
          onboardingId: linkId,
        });

        return res.json({
          success: true,
          onboarding: updated.rows[0],
        });
      } catch (error) {
        return handleError(res, error, 'Failed to revoke client onboarding link');
      }
    },

    async markClientOnboardingComplete(req, res) {
      try {
        const { agency, member } = await getAgencyContext(req.user.id);
        if (!EDIT_ROLES.has(member.role)) {
          throw apiError('Only owner/admin can complete client onboarding links', 'INSUFFICIENT_PERMISSIONS', 403);
        }
        const workspace = await getWorkspace(req.params.workspaceId, agency.id);
        const linkId = cleanText(req.params.linkId, null);
        if (!linkId) throw apiError('Link id is required', 'ONBOARDING_LINK_ID_REQUIRED', 400);

        const updated = await query(
          `UPDATE agency_client_onboarding
           SET status = 'completed',
               completed_at = NOW(),
               updated_at = NOW()
           WHERE id = $1
             AND workspace_id = $2
             AND agency_id = $3
             AND status = 'pending'
           RETURNING *`,
          [linkId, workspace.id, agency.id]
        );
        if (updated.rows.length === 0) {
          throw apiError('Active onboarding link not found', 'ONBOARDING_LINK_NOT_FOUND', 404);
        }

        await logAudit(agency.id, req.user.id, 'client_onboarding_link_completed', 'agency_workspace', workspace.id, {
          workspaceId: workspace.id,
          onboardingId: linkId,
        });

        return res.json({
          success: true,
          onboarding: updated.rows[0],
        });
      } catch (error) {
        return handleError(res, error, 'Failed to complete client onboarding link');
      }
    },
  };
}

