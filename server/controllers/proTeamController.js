// Subdomain mapping for supported platforms
const subdomains = {
    twitter: process.env.TWITTER_SUBDOMAIN || 'https://tweet.suitegenie.in',
    linkedin:
        process.env.LINKEDIN_API_URL ||
        process.env.LINKEDIN_SUBDOMAIN ||
        'https://apilinkedin.suitegenie.in',
    social:
        process.env.SOCIAL_GENIE_URL ||
        process.env.SOCIAL_SUBDOMAIN ||
        'https://meta.suitegenie.in',
    threads:
        process.env.SOCIAL_GENIE_URL ||
        process.env.SOCIAL_SUBDOMAIN ||
        'https://meta.suitegenie.in',
    instagram:
        process.env.SOCIAL_GENIE_URL ||
        process.env.SOCIAL_SUBDOMAIN ||
        'https://meta.suitegenie.in'
};
// proTeamController.js 
// Controller for Pro plan team collaboration features
import jwt from 'jsonwebtoken';
import { TeamService } from '../services/teamService.js';
import { RolePermissionsService } from '../services/rolePermissions.js';
import { query } from '../config/database.js';

const normalizeUrlBase = (value) => String(value || '').replace(/\/+$/, '');
const ensureUrl = (host) => host.startsWith('http') ? host : `https://${host}`;

const resolveLocalTeamOAuthHost = (platformKey) => {
    switch (platformKey) {
        case 'twitter':
            return process.env.TWEET_GENIE_URL || 'http://localhost:3002';
        case 'linkedin':
            return process.env.LINKEDIN_API_URL || 'http://localhost:3004';
        case 'social':
            return process.env.SOCIAL_GENIE_LOCAL_URL || process.env.SOCIAL_GENIE_URL || 'http://localhost:3003';
        default:
            return null;
    }
};

const normalizeAccountIdentifier = (value, maxLen = 255) => {
    if (value === undefined || value === null) return null;
    const normalized = String(value).trim();
    if (!normalized) return null;
    return Number.isFinite(maxLen) && maxLen > 0 ? normalized.slice(0, maxLen) : normalized;
};

const mapRegistrySocialAccountRow = (row = {}) => {
    const sourceId = normalizeAccountIdentifier(row.source_id);
    const registryId = normalizeAccountIdentifier(row.registry_id || row.id);

    return {
        id: registryId,
        registry_id: registryId,
        source_id: sourceId,
        source_table: normalizeAccountIdentifier(row.source_table, 128),
        platform: normalizeAccountIdentifier(row.platform, 50),
        account_username: normalizeAccountIdentifier(row.account_username, 255),
        account_display_name: normalizeAccountIdentifier(row.account_display_name, 255),
        account_id: normalizeAccountIdentifier(row.account_id, 255),
        profile_image_url: normalizeAccountIdentifier(row.profile_image_url, 2048),
        connected_by_name: normalizeAccountIdentifier(row.connected_by_name, 255),
        connected_by_email: normalizeAccountIdentifier(row.connected_by_email, 255),
        created_at: row.created_at || null,
        updated_at: row.updated_at || null,
        metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {},
        is_active: row.is_active !== false,
        active: row.is_active !== false,
    };
};

const mapLegacyLinkedInTeamAccountRow = (row = {}) => {
    const accountType = normalizeAccountIdentifier(row.account_type, 50) || 'personal';
    const organizationId = normalizeAccountIdentifier(row.organization_id, 255);
    const normalizedOrganizationName = normalizeAccountIdentifier(row.organization_name, 255);
    const normalizedUsername = normalizeAccountIdentifier(row.account_username, 255);
    const normalizedDisplayName = normalizeAccountIdentifier(row.account_display_name, 255);
    const normalizedAccountId = accountType === 'organization' && organizationId
        ? `org:${organizationId}`
        : normalizeAccountIdentifier(row.account_id, 255);

    return {
        ...row,
        id: normalizeAccountIdentifier(row.id, 128),
        source_id: normalizeAccountIdentifier(row.id, 128),
        source_table: 'linkedin_team_accounts',
        platform: 'linkedin',
        account_type: accountType,
        organization_id: organizationId,
        account_username: accountType === 'organization'
            ? (organizationId ? `org-${organizationId}` : normalizedUsername)
            : normalizedUsername,
        account_display_name: accountType === 'organization'
            ? (normalizedOrganizationName || normalizedDisplayName || normalizedUsername)
            : (normalizedDisplayName || normalizedUsername),
        account_id: normalizedAccountId,
        profile_image_url: normalizeAccountIdentifier(row.profile_image_url, 2048),
        connected_by_name: normalizeAccountIdentifier(row.connected_by_name, 255),
        connected_by_email: normalizeAccountIdentifier(row.connected_by_email, 255),
        is_active: row.is_active !== false,
        active: row.is_active !== false,
        metadata: {
            source_table: 'linkedin_team_accounts',
            account_type: accountType,
            organization_id: organizationId,
        },
    };
};

const fetchRegistryTeamSocialAccounts = async (teamId) => {
    const registryResult = await query(
        `SELECT
             sca.id::text AS registry_id,
             COALESCE(NULLIF(sca.metadata->>'source_id', ''), sca.id::text) AS source_id,
             sca.metadata->>'source_table' AS source_table,
             sca.platform,
             sca.account_username,
             sca.account_display_name,
             sca.account_id,
             sca.profile_image_url,
             sca.created_at,
             sca.updated_at,
             sca.is_active,
             sca.metadata,
             u.name AS connected_by_name,
             u.email AS connected_by_email
         FROM social_connected_accounts sca
         LEFT JOIN users u
           ON u.id::text = COALESCE(NULLIF(sca.connected_by::text, ''), sca.user_id::text)
         WHERE sca.team_id::text = $1::text
           AND sca.is_active = true
         ORDER BY sca.updated_at DESC NULLS LAST, sca.created_at DESC NULLS LAST, sca.id DESC`,
        [teamId]
    );

    return registryResult.rows.map(mapRegistrySocialAccountRow).filter((row) => row.id);
};

const deactivateTeamRegistryRows = async ({
    teamId,
    registryId = null,
    sourceTable = null,
    sourceId = null,
}) => {
    const normalizedTeamId = normalizeAccountIdentifier(teamId, 128);
    const normalizedRegistryId = normalizeAccountIdentifier(registryId, 128);
    const normalizedSourceTable = normalizeAccountIdentifier(sourceTable, 128);
    const normalizedSourceId = normalizeAccountIdentifier(sourceId, 255);

    if (!normalizedTeamId) return;
    if (!normalizedRegistryId && !(normalizedSourceTable && normalizedSourceId)) return;

    const predicates = [];
    const params = [normalizedTeamId];

    if (normalizedRegistryId) {
        params.push(normalizedRegistryId);
        predicates.push(`id::text = $${params.length}::text`);
    }

    if (normalizedSourceTable && normalizedSourceId) {
        params.push(normalizedSourceTable);
        const sourceTableIndex = params.length;
        params.push(normalizedSourceId);
        predicates.push(
            `(metadata->>'source_table' = $${sourceTableIndex} AND metadata->>'source_id' = $${params.length})`
        );
    }

    await query(
        `UPDATE social_connected_accounts
         SET is_active = false,
             updated_at = CURRENT_TIMESTAMP
         WHERE team_id::text = $1::text
           AND (${predicates.join(' OR ')})`,
        params
    );
};

export const ProTeamController = {
    // Get team's social accounts (team-wide across sources)
    async getTeamSocialAccounts(req, res) {
        try {
            const userId = req.user?.id;
            let teamId = req.user?.teamId || req.user?.team_id;
            if (!teamId) {
                const teamResult = await query(
                    `SELECT team_id FROM team_members WHERE user_id = $1 AND status = 'active' LIMIT 1`,
                    [userId]
                );
                teamId = teamResult.rows[0]?.team_id;
            }
            if (!teamId) {
                return res.status(403).json({ success: false, error: 'User is not in a team', accounts: [] });
            }

            let registryAccounts = [];
            try {
                registryAccounts = await fetchRegistryTeamSocialAccounts(teamId);
            } catch (registryError) {
                console.error('[pro-team/social-accounts] Registry-first lookup failed, falling back to legacy tables:', registryError.message);
            }

            // Legacy fallback until all environments are fully backfilled.
            const userAccountsResult = await query(
                `SELECT usa.id, usa.platform, usa.account_username, usa.account_display_name, usa.account_id, usa.profile_image_url, usa.created_at,
                        usa.oauth1_access_token, usa.oauth1_access_token_secret,
                        u.name as connected_by_name, u.email as connected_by_email,
                        true as is_active
                 FROM user_social_accounts usa
                 LEFT JOIN users u ON usa.user_id = u.id
                 WHERE usa.team_id = $1 AND usa.is_active = true
                 ORDER BY usa.created_at ASC`,
                [teamId]
            );

            const teamAccountsResult = await query(
                `SELECT ta.id, 'twitter' as platform, ta.twitter_username as account_username, ta.twitter_display_name as account_display_name,
                        ta.twitter_user_id as account_id, ta.twitter_profile_image_url as profile_image_url,
                        ta.access_token, ta.refresh_token, ta.token_expires_at,
                        u.name as connected_by_name, u.email as connected_by_email,
                        ta.active as is_active
                 FROM team_accounts ta
                 LEFT JOIN users u ON ta.user_id = u.id
                 WHERE ta.team_id = $1 AND ta.active = true
                 ORDER BY ta.updated_at DESC`,
                [teamId]
            );

            let linkedinAccounts = [];
            try {
                const linkedinResult = await query(
                    `SELECT lta.id, 'linkedin' as platform, lta.linkedin_username as account_username,
                            lta.linkedin_display_name as account_display_name, lta.linkedin_user_id as account_id,
                            lta.linkedin_profile_image_url as profile_image_url, lta.headline, lta.connections_count,
                            lta.account_type, lta.organization_id, lta.organization_name,
                            u.name as connected_by_name, u.email as connected_by_email, lta.active as is_active
                     FROM linkedin_team_accounts lta
                     LEFT JOIN users u ON lta.user_id = u.id
                     WHERE lta.team_id = $1 AND lta.active = true
                     ORDER BY lta.created_at DESC`,
                    [teamId]
                );

                linkedinAccounts = linkedinResult.rows.map(mapLegacyLinkedInTeamAccountRow);
                console.log('[LINKEDIN FETCH] Fetched LinkedIn team accounts from database:', linkedinAccounts.length);
            } catch (error) {
                console.error('[LINKEDIN FETCH] Database query failed:', error.message);
            }

            const fallbackAccounts = [...userAccountsResult.rows, ...teamAccountsResult.rows, ...linkedinAccounts];
            const seenRegistryKeys = new Set(
                registryAccounts.map((account) => `${String(account.platform || '').toLowerCase()}:${String(account.account_id || account.account_username || account.id || '').toLowerCase()}`)
            );
            const merged = registryAccounts.length > 0
                ? [
                    ...registryAccounts,
                    ...fallbackAccounts.filter((account) => {
                        const key = `${String(account.platform || '').toLowerCase()}:${String(account.account_id || account.account_username || account.id || '').toLowerCase()}`;
                        return !seenRegistryKeys.has(key);
                    }),
                ]
                : fallbackAccounts;

            res.json({
                success: true,
                accounts: merged,
                totalAccounts: merged.length,
                teamId,
                source: registryAccounts.length > 0 ? 'social_connected_accounts+fallback' : 'legacy',
            });
        } catch (error) {
            console.error('[pro-team/social-accounts] Error:', error);
            console.error('[pro-team/social-accounts] Stack:', error.stack);
            res.status(500).json({ success: false, error: 'Failed to get team social accounts', accounts: [] });
        }
    },
    // Get current user's team
    async getTeam(req, res) {
        try {
            // Validate user is authenticated
            if (!req.user || !req.user.id) {
                console.error('[getTeam] Missing user authentication', { user: req.user });
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const userId = req.user.id;
            const team = await TeamService.getUserTeam(userId);
            
            if (!team) {
                return res.json({ team: null });
            }

            res.json({ 
                success: true,
                team: {
                    ...team,
                    canInvite: team.member_count < team.max_members && ['owner', 'admin'].includes(team.user_role)
                }
            });
        } catch (error) {
            console.error('[getTeam] Error:', error);
            res.status(500).json({ error: 'Failed to get team information', details: error.message });
        }
    },

    // Create a team (for Pro users)
    async createTeam(req, res) {
        try {
            // Validate user is authenticated
            if (!req.user || !req.user.id) {
                console.error('[createTeam] Missing user authentication', { user: req.user });
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const userId = req.user.id;
            const { teamName } = req.body;

            // Check if user has Pro plan
            const user = await query('SELECT plan_type FROM users WHERE id = $1', [userId]);
            if (!user.rows[0] || !['pro', 'enterprise'].includes(user.rows[0].plan_type)) {
                return res.status(403).json({ 
                    error: 'Team collaboration requires Pro plan',
                    code: 'UPGRADE_REQUIRED' 
                });
            }

            // Check if user already has a team
            const existingTeam = await TeamService.getUserTeam(userId);
            if (existingTeam) {
                return res.status(400).json({ 
                    error: 'You already have a team',
                    team: existingTeam 
                });
            }

            const team = await TeamService.createTeam(userId, teamName || `${req.user.email}'s Team`);
            res.json({ 
                success: true, 
                team: {
                    ...team,
                    canInvite: team.member_count < team.max_members && ['owner', 'admin'].includes(team.user_role)
                }
            });
        } catch (error) {
            console.error('[createTeam] Error:', error);
            
            // Handle specific constraint violation (duplicate team ownership)
            if (error.message === 'You already own a team') {
                return res.status(400).json({ 
                    error: 'You already own a team. Please delete your existing team before creating a new one.',
                    code: 'DUPLICATE_TEAM'
                });
            }
            
            // Handle database unique constraint violation
            if (error.code === '23505' && error.constraint === 'teams_owner_id_unique') {
                return res.status(400).json({ 
                    error: 'You already own a team. Please delete your existing team before creating a new one.',
                    code: 'DUPLICATE_TEAM'
                });
            }
            
            res.status(500).json({ error: error.message || 'Failed to create team' });
        }
    },

    // Invite user to team
    async inviteUser(req, res) {
        try {
            // Validate user is authenticated
            if (!req.user || !req.user.id) {
                console.error('[inviteUser] Missing user authentication', { user: req.user });
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const userId = req.user.id;
            const { email, role } = req.body;

            if (!email || !/\S+@\S+\.\S+/.test(email)) {
                return res.status(400).json({ error: 'Valid email is required' });
            }

            // Validate role if provided
            const validRoles = ['owner', 'admin', 'editor', 'viewer'];
            if (role && !validRoles.includes(role)) {
                return res.status(400).json({ error: 'Invalid role specified' });
            }

            // Get user's team
            const userTeam = await TeamService.getUserTeam(userId);
            if (!userTeam) {
                return res.status(404).json({ error: 'You are not part of any team' });
            }

            const invitation = await TeamService.inviteToTeam(userTeam.id, userId, email, role || 'editor');
            const message = invitation.isResend 
                ? `Invitation resent to ${email} as ${role || 'editor'}` 
                : `Invitation sent to ${email} as ${role || 'editor'}`;

            res.json({ 
                success: true, 
                message,
                isResend: invitation.isResend,
                invitation: {
                    id: invitation.id,
                    email: invitation.email,
                    role: role || 'editor',
                    expires_at: invitation.expires_at
                }
            });
        } catch (error) {
            console.error('[inviteUser] Error:', error);
            // Map specific service errors to API error codes for frontend handling
            const msg = error.message || 'Failed to invite user';
            const resp = { success: false, error: msg };
            if (msg.includes('already a member of another team')) {
                resp.code = 'ALREADY_IN_ANOTHER_TEAM';
            } else if (msg.includes('already invited')) {
                resp.code = 'ALREADY_INVITED';
            }
            res.status(400).json(resp);
        }
    },

    // Accept team invitation
    async acceptInvitation(req, res) {
        try {
            const { token } = req.params;
            const userId = req.user.id;

            const result = await TeamService.acceptInvitation(token, userId);
            res.json({ 
                success: true, 
                message: `Welcome to ${result.teamName}!`,
                teamId: result.teamId 
            });
        } catch (error) {
            console.error('Accept invitation error:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Remove team member
    async removeMember(req, res) {
        try {
            const userId = req.user.id;
            const { memberId } = req.params;

            // Get user's team
            const userTeam = await TeamService.getUserTeam(userId);
            if (!userTeam) {
                return res.status(404).json({ error: 'You are not part of any team' });
            }

            await TeamService.removeMember(userTeam.id, memberId, userId);
            res.json({ success: true, message: 'Member removed successfully' });
        } catch (error) {
            console.error('Remove member error:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Update team member role
    async updateMemberRole(req, res) {
        try {
            const userId = req.user.id;
            const { memberId } = req.params;
            const { role } = req.body;

            console.log('🔄 [PRO TEAM] Update Role Request:', {
                userId,
                memberId,
                newRole: role,
                body: req.body,
                params: req.params
            });

            // Validate role
            if (!['admin', 'editor', 'viewer'].includes(role)) {
                console.log('❌ [PRO TEAM] Invalid role:', role);
                return res.status(400).json({ error: 'Invalid role. Must be admin, editor, or viewer' });
            }

            // Get user's team and verify permissions
            console.log('🔍 [PRO TEAM] Getting user team for userId:', userId);
            const userTeam = await TeamService.getUserTeam(userId);
            console.log('👥 [PRO TEAM] User team:', userTeam);
            
            if (!userTeam) {
                console.log('❌ [PRO TEAM] User not part of any team');
                return res.status(404).json({ error: 'You are not part of any team' });
            }

            if (userTeam.user_role !== 'owner') {
                console.log('❌ [PRO TEAM] Insufficient permissions. User role:', userTeam.user_role);
                return res.status(403).json({ error: 'Only team owners can modify member roles' });
            }

            console.log('✏️ [PRO TEAM] Updating member role. TeamId:', userTeam.id, 'MemberId:', memberId, 'NewRole:', role);
            await TeamService.updateMemberRole(userTeam.id, memberId, role, userId);
            console.log('✅ [PRO TEAM] Member role updated successfully');
            
            res.json({ success: true, message: 'Member role updated successfully' });
        } catch (error) {
            console.error('❌ [PRO TEAM] Update member role error:', error);
            console.error('Error stack:', error.stack);
            res.status(400).json({ error: error.message });
        }
    },

    // Connect a new social account
    async connectAccount(req, res) {
                    // Detect if running locally
                    const isLocal = process.env.NODE_ENV === 'development' || (req.headers.origin && req.headers.origin.includes('localhost'));
        try {
            const userId = req.user.id;
            let { platform, accountData } = req.body;

            // Validate required fields
            if (!platform) {
                return res.status(400).json({ error: 'Missing platform in request body.' });
            }
            if (!accountData || typeof accountData !== 'object') {
                return res.status(400).json({ error: 'Missing accountData in request body.' });
            }
            // Check required accountData fields for Twitter
            if (platform === 'twitter' && !accountData.account_id) {
                return res.status(400).json({ error: 'Missing account_id in accountData for Twitter.' });
            }

            // Support twitter-oauth1 as a valid platform for media upload
            if (platform === 'twitter-oauth1') {
                platform = 'twitter';
                accountData = { ...accountData, oauthType: 'oauth1' };
            }

            // Check permissions
            const canConnect = await RolePermissionsService.canUserPerformAction(userId, 'connect_profiles');
            if (!canConnect) {
                console.error('[connectAccount] Permission denied for user:', userId);
                return res.status(403).json({ 
                    error: 'You do not have permission to connect social accounts' 
                });
            }

            // Get user's team and role limits
            const userPermissions = await RolePermissionsService.getUserPermissions(userId);
            if (!userPermissions.team_id) {
                console.error('[connectAccount] No team_id for user:', userId, 'Permissions:', userPermissions);
                return res.status(404).json({ error: 'You are not part of any team' });
            }

            // Check if user has reached their connection limit
            const userAccountsCount = await query(`
                SELECT COUNT(*) as count 
                FROM user_social_accounts 
                WHERE user_id = $1 AND team_id = $2 AND is_active = true
            `, [userId, userPermissions.team_id]);

            const currentCount = parseInt(userAccountsCount.rows[0].count);
            const maxConnections = userPermissions.limits.max_profile_connections;

            if (currentCount >= maxConnections) {
                console.error('[connectAccount] Connection limit reached:', currentCount, 'Max:', maxConnections, 'User:', userId);
                return res.status(400).json({ 
                    error: `You have reached your connection limit (${maxConnections} accounts)` 
                });
            }

            // Special handling for Twitter OAuth1.0a flow
            if (platform === 'twitter' && accountData?.oauthType === 'oauth1') {
                // Redirect to Twitter OAuth1.0a flow
                return res.json({
                    success: true,
                    redirectUrl: `${process.env.TWITTER_OAUTH1_URL || 'http://localhost:3002'}/api/twitter/team-connect-oauth1?team_id=${userPermissions.team_id}`
                });
            }

            // Check if account is already connected to the team
            const existingAccount = await query(`
                SELECT id FROM user_social_accounts 
                WHERE team_id = $1 AND platform = $2 AND account_id = $3 AND is_active = true
            `, [userPermissions.team_id, platform, accountData.account_id]);

            if (existingAccount.rows.length > 0) {
                console.error('[connectAccount] Account already connected:', accountData.account_id, 'User:', userId, 'Team:', userPermissions.team_id);
                return res.status(400).json({ 
                    error: 'This account is already connected to your team' 
                });
            }

            // Create social account connection
            const result = await query(`
                INSERT INTO user_social_accounts (
                    user_id, team_id, platform, account_username, account_display_name,
                    account_id, access_token, refresh_token, token_expires_at, profile_image_url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id
            `, [
                userId,
                userPermissions.team_id,
                platform,
                accountData.username,
                accountData.displayName,
                accountData.account_id,
                accountData.accessToken,
                accountData.refreshToken || null,
                accountData.expiresAt || null,
                accountData.profileImage || null
            ]);

            res.json({
                success: true,
                message: `${platform} account connected successfully`,
                accountId: result.rows[0].id
            });
        } catch (error) {
            console.error('Connect account error:', error);
            res.status(500).json({ error: 'Failed to connect social account' });
        }
    },

    // Leave team
    async leaveTeam(req, res) {
        try {
            // Validate user is authenticated
            if (!req.user || !req.user.id) {
                console.error('[leaveTeam] Missing user authentication', { user: req.user });
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const userId = req.user.id;

            // Get user's team
            const userTeam = await TeamService.getUserTeam(userId);
            if (!userTeam) {
                return res.status(404).json({ error: 'You are not part of any team' });
            }

            if (userTeam.user_role === 'owner') {
                return res.status(400).json({ 
                    error: 'Team owners cannot leave. Transfer ownership or delete the team first.' 
                });
            }

            await TeamService.removeMember(userTeam.id, userId, userId);
            res.json({ success: true, message: 'You have left the team' });
        } catch (error) {
            console.error('[leaveTeam] Error:', error);
            res.status(500).json({ error: error.message || 'Failed to leave team' });
        }
    },

    // Delete team (owner only)
    async deleteTeam(req, res) {
        try {
            // Validate user is authenticated
            if (!req.user || !req.user.id) {
                console.error('[deleteTeam] Missing user authentication', { user: req.user });
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const userId = req.user.id;
            const result = await TeamService.deleteTeam(userId);
            res.json({ 
                success: true, 
                message: `Team "${result.teamName}" has been completely deleted. All members have been removed and social accounts have been disconnected.` 
            });
        } catch (error) {
            console.error('[deleteTeam] Error:', error);
            res.status(500).json({ error: error.message || 'Failed to delete team' });
        }
    },

    // Get invitation details by token (public endpoint)
    async getInvitationByToken(req, res) {
        try {
            const { token } = req.params;
            
            const result = await query(`
                SELECT 
                    ti.id, ti.email, ti.expires_at, ti.created_at,
                    t.name as team_name,
                    u.email as inviter_email, u.name as inviter_name
                FROM team_invitations ti
                JOIN teams t ON ti.team_id = t.id
                JOIN users u ON ti.invited_by = u.id
                WHERE ti.token = $1 AND ti.status = 'pending' AND ti.expires_at > NOW()
            `, [token]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Invitation not found or expired' 
                });
            }
            
            const invitation = result.rows[0];
            
            res.json({
                success: true,
                invitation: {
                    id: invitation.id,
                    team_name: invitation.team_name,
                    inviter_email: invitation.inviter_email,
                    inviter_name: invitation.inviter_name,
                    created_at: invitation.created_at,
                    expires_at: invitation.expires_at
                }
            });
            
        } catch (error) {
            console.error('Get invitation by token error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to fetch invitation details' 
            });
        }
    },

    // Accept invitation by token (requires auth)
    async acceptInvitationByToken(req, res) {
        try {
            const { token } = req.params;
            const userId = req.user.id;

            const result = await TeamService.acceptInvitation(token, userId);
            res.json({ 
                success: true, 
                message: `Welcome to ${result.teamName}!`,
                teamId: result.teamId 
            });
        } catch (error) {
            console.error('Accept invitation by token error:', error);
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }
    },

    // Decline invitation by token (public endpoint)
    async declineInvitationByToken(req, res) {
        try {
            const { token } = req.params;
            
            const result = await query(`
                UPDATE team_invitations 
                SET status = 'declined', declined_at = NOW()
                WHERE token = $1 AND status = 'pending'
                RETURNING id
            `, [token]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Invitation not found or already processed' 
                });
            }
            
            res.json({
                success: true,
                message: 'Invitation declined'
            });
            
        } catch (error) {
            console.error('Decline invitation by token error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to decline invitation' 
            });
        }
    },

    // Get user's role permissions and limits
    async getUserPermissions(req, res) {
        try {
            const userId = req.user.id;
            const permissions = await RolePermissionsService.getUserPermissions(userId);
            
            res.json({
                success: true,
                ...permissions
            });
        } catch (error) {
            console.error('Get user permissions error:', error);
            res.status(500).json({ 
                error: 'Failed to get user permissions' 
            });
        }
    },

    // Get user's role permissions and limits
    async getUserPermissions(req, res) {
        try {
            const userId = req.user.id;
            const permissions = await RolePermissionsService.getUserPermissions(userId);
            
            res.json({
                success: true,
                ...permissions
            });
        } catch (error) {
            console.error('Get user permissions error:', error);
            res.status(500).json({ 
                error: 'Failed to get user permissions' 
            });
        }
    },

    // Check if user can perform specific action
    async checkPermission(req, res) {
        try {
            const userId = req.user.id;
            const { action } = req.params;
            
            const canPerform = await RolePermissionsService.canUserPerformAction(userId, action);
            
            res.json({
                success: true,
                action,
                canPerform
            });
        } catch (error) {
            console.error('Check permission error:', error);
            res.status(500).json({ 
                error: 'Failed to check permission' 
            });
        }
    },

    // Get user permissions and role limits
    async getUserPermissions(req, res) {
        try {
            const userId = req.user.id;
            
            const permissions = await RolePermissionsService.getUserPermissions(userId);
            
            // For social accounts, return team-wide limit instead of individual limit
            const teamWideLimits = {
                ...permissions.limits,
                max_profile_connections: 8 // Team-wide limit of 8 accounts total
            };
            
            res.json({
                success: true,
                role: permissions.role,
                permissions: permissions.permissions,
                limits: teamWideLimits,
                team_id: permissions.team_id || null,
                teamId: permissions.team_id || null,
                user_id: userId,
                userId: userId,
            });
        } catch (error) {
            console.error('Get user permissions error:', error);
            res.status(500).json({ 
                error: 'Failed to get user permissions' 
            });
        }
    },

    // Connect social account (redirect to subdomain)
    async connectAccount(req, res) {
        try {
            const userId = req.user.id;
            const { platform } = req.body;
            
            if (!platform) {
                return res.status(400).json({ error: 'Platform is required' });
            }
            
            // Get user's team and role
            const teamResult = await query(`
                SELECT tm.team_id, tm.role
                FROM team_members tm 
                WHERE tm.user_id = $1 AND tm.status = 'active'
            `, [userId]);
            
            if (teamResult.rows.length === 0) {
                return res.status(400).json({ error: 'User is not part of any team' });
            }
            
            const { team_id: teamId, role } = teamResult.rows[0];
            
            // Check if user can connect accounts (owner/admin only)
            if (!['owner', 'admin'].includes(role)) {
                return res.status(403).json({ 
                    error: 'Only team owners and admins can connect social accounts' 
                });
            }
            
            // Check team-wide account limit (8 total for the entire team)
            const userAccountsResult = await query(
                `SELECT usa.id, usa.platform, usa.account_username, usa.account_display_name, usa.account_id, usa.profile_image_url, usa.created_at,
                        usa.oauth1_access_token, usa.oauth1_access_token_secret,
                        u.name as connected_by_name, u.email as connected_by_email,
                        true as is_active
                 FROM user_social_accounts usa
                 LEFT JOIN users u ON usa.user_id = u.id
                 WHERE usa.team_id = $1 AND usa.is_active = true
                 ORDER BY usa.created_at ASC`,
                [teamId]
            );
            console.log('[FETCH] user_social_accounts rows:', userAccountsResult.rows);
            userAccountsResult.rows.forEach(acc => {
                if (acc.oauth1_access_token && acc.oauth1_access_token_secret) {
                    console.log(`[FETCH] OAuth1.0 fetched for Account ${acc.id} platform=${acc.platform} username=${acc.account_username}`);
                } else {
                    console.log(`[FETCH] OAuth1.0 NOT fetched for Account ${acc.id} platform=${acc.platform} username=${acc.account_username}`);
                }
            });
                    // error: `Team has reached maximum limit of ${teamLimit} social accounts` 
                    // Removed reference to undefined variable 'teamLimit'. If you want to enforce a team-wide limit, use a defined value or variable.
            const teamAccountsResult = await query(
                `SELECT ta.id, 'twitter' as platform, ta.twitter_username as account_username, ta.twitter_display_name as account_display_name,
                        ta.twitter_user_id as account_id, ta.twitter_profile_image_url as profile_image_url,
                        ta.access_token, ta.refresh_token, ta.token_expires_at,
                        u.name as connected_by_name, u.email as connected_by_email,
                        ta.active as is_active
                 FROM team_accounts ta
                 LEFT JOIN users u ON ta.user_id = u.id
                 WHERE ta.team_id = $1 AND ta.active = true
                 ORDER BY ta.updated_at DESC`,
                [teamId]
            );
            console.log('[FETCH] team_accounts rows:', teamAccountsResult.rows);
            teamAccountsResult.rows.forEach(acc => {
                if (acc.access_token && acc.refresh_token) {
                    console.log(`[FETCH] OAuth2.0 fetched for Team Account ${acc.id} username=${acc.account_username}`);
                } else {
                    console.log(`[FETCH] OAuth2.0 NOT fetched for Team Account ${acc.id} username=${acc.account_username}`);
                }
            });
                // Removed stray closing brace causing syntax error
            console.log('[MERGE] Merging userAccountsResult, teamAccountsResult, linkedinAccounts');

            // Detect if running locally (move definition here for correct scope)
            const isLocal = process.env.NODE_ENV === 'development' || (req.headers.origin && req.headers.origin.includes('localhost'));
            const platformKey = platform.toLowerCase();
            let subdomain = subdomains[platformKey];

            // Guard against old config pointing to LinkedIn frontend instead of API host.
            const normalizedHost =
                typeof subdomain === 'string'
                    ? subdomain.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase()
                    : '';
            if (platformKey === 'linkedin' && normalizedHost === 'linkedin.suitegenie.in') {
                subdomain = process.env.LINKEDIN_API_URL || 'https://apilinkedin.suitegenie.in';
            }

            if (!subdomain) {
                return res.status(400).json({ error: 'Unsupported platform' });
            }
            
            // Platform-specific OAuth paths and host selection
            const oauthTargets = {
                twitter: { path: '/api/twitter/team-connect', hostKey: 'twitter' },
                linkedin: { path: '/api/oauth/linkedin/team-connect', hostKey: 'linkedin' },
                threads: { path: '/api/oauth/threads/connect', hostKey: 'social' },
                instagram: { path: '/api/oauth/instagram/connect', hostKey: 'social' }
            };

            const oauthTarget = oauthTargets[platformKey];
            if (!oauthTarget) {
                return res.status(400).json({ error: `Platform ${platform} OAuth not yet implemented` });
            }

            if (isLocal) {
                if (oauthTarget.hostKey === 'twitter') {
                    subdomain = resolveLocalTeamOAuthHost('twitter');
                } else if (oauthTarget.hostKey === 'linkedin') {
                    subdomain = resolveLocalTeamOAuthHost('linkedin');
                } else if (oauthTarget.hostKey === 'social') {
                    subdomain = resolveLocalTeamOAuthHost('social');
                }
            } else if (oauthTarget.hostKey && subdomains[oauthTarget.hostKey]) {
                subdomain = subdomains[oauthTarget.hostKey];
            }

            const clientBaseUrl = isLocal
                ? normalizeUrlBase(req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173')
                : normalizeUrlBase(ensureUrl(process.env.CLIENT_URL || 'https://suitegenie.in'));
            const returnUrl = `${clientBaseUrl}/team`;
            const redirectUrl = `${ensureUrl(subdomain)}${oauthTarget.path}?teamId=${teamId}&userId=${userId}&returnUrl=${encodeURIComponent(returnUrl)}`;
            
            res.json({
                success: true,
                redirectUrl
            });
        } catch (error) {
            console.error('Connect account error:', error);
            res.status(500).json({ 
                error: 'Failed to initiate account connection' 
            });
        }
    },

    // Disconnect social account
    async disconnectAccount(req, res) {
        try {
            const userId = req.user.id;
            const { accountId } = req.params;

            console.log('[disconnectAccount] Attempting to disconnect account:', { userId, accountId });

            let table_name = null;
            let accountTeamId = null;
            let registryAccountId = null;
            let sourceId = null;
            let registryRow = null;

            try {
                const registryResult = await query(
                    `SELECT id::text as id, team_id::text as team_id, platform, metadata
                     FROM social_connected_accounts
                     WHERE id::text = $1::text
                       AND is_active = true
                     LIMIT 1`,
                    [accountId]
                );
                if (registryResult.rows.length > 0) {
                    registryRow = registryResult.rows[0];
                    registryAccountId = registryRow.id;
                    accountTeamId = registryRow.team_id;
                    table_name = normalizeAccountIdentifier(registryRow.metadata?.source_table, 128) || 'social_connected_accounts';
                    sourceId = normalizeAccountIdentifier(registryRow.metadata?.source_id, 255) || registryRow.id;
                }
            } catch (e) {
                console.log('[disconnectAccount] Error checking social_connected_accounts:', e.message);
            }

            if (!table_name) {
                try {
                    const usaResult = await query(
                        `SELECT id::text as id, team_id::text as team_id
                         FROM user_social_accounts
                         WHERE id::text = $1::text AND is_active = true`,
                        [accountId]
                    );
                    if (usaResult.rows.length > 0) {
                        table_name = 'user_social_accounts';
                        accountTeamId = usaResult.rows[0].team_id;
                        sourceId = usaResult.rows[0].id;
                    }
                } catch (e) {
                    console.log('[disconnectAccount] Error checking user_social_accounts:', e.message);
                }
            }

            if (!table_name) {
                try {
                    const taResult = await query(
                        `SELECT id::text as id, team_id::text as team_id
                         FROM team_accounts
                         WHERE id::text = $1::text AND active = true`,
                        [accountId]
                    );
                    if (taResult.rows.length > 0) {
                        table_name = 'team_accounts';
                        accountTeamId = taResult.rows[0].team_id;
                        sourceId = taResult.rows[0].id;
                    }
                } catch (e) {
                    console.log('[disconnectAccount] Error checking team_accounts:', e.message);
                }
            }

            if (!table_name) {
                try {
                    const ltaResult = await query(
                        `SELECT id::text as id, team_id::text as team_id
                         FROM linkedin_team_accounts
                         WHERE id::text = $1::text AND active = true`,
                        [accountId]
                    );
                    if (ltaResult.rows.length > 0) {
                        table_name = 'linkedin_team_accounts';
                        accountTeamId = ltaResult.rows[0].team_id;
                        sourceId = ltaResult.rows[0].id;
                    }
                } catch (e) {
                    console.log('[disconnectAccount] Error checking linkedin_team_accounts:', e.message);
                }
            }

            console.log('[disconnectAccount] Account query result:', { table_name, accountTeamId, registryAccountId, sourceId });

            if (!table_name) {
                return res.status(404).json({ error: 'Social account not found' });
            }

            console.log('[disconnectAccount] Found account in table:', table_name, 'team_id:', accountTeamId);

            // Verify user is owner/admin of that team - cast team_id for comparison
            const membership = await query(
                `SELECT role FROM team_members WHERE user_id = $1 AND team_id::text = $2 AND status = 'active'`,
                [userId, accountTeamId]
            );

            if (membership.rows.length === 0) {
                return res.status(403).json({ error: 'You are not part of this team' });
            }

            const role = membership.rows[0].role;
            if (!['owner', 'admin'].includes(role)) {
                return res.status(403).json({ error: 'Only team owners and admins can disconnect social accounts' });
            }

            // Update the appropriate table
            if (table_name === 'social_connected_accounts') {
                await query(
                    `UPDATE social_connected_accounts
                     SET is_active = false, updated_at = CURRENT_TIMESTAMP
                     WHERE id::text = $1::text`,
                    [registryAccountId || accountId]
                );
            } else if (table_name === 'user_social_accounts') {
                await query(
                    `UPDATE user_social_accounts SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                    [sourceId || accountId]
                );
            } else if (table_name === 'team_accounts') {
                // Actually DELETE Twitter team accounts to prevent orphans
                await query(
                    `DELETE FROM team_accounts WHERE id::text = $1::text`,
                    [sourceId || accountId]
                );
            } else if (table_name === 'linkedin_team_accounts') {
                // Actually DELETE LinkedIn team accounts to prevent orphans
                await query(
                    `DELETE FROM linkedin_team_accounts WHERE id::text = $1::text`,
                    [sourceId || accountId]
                );
            }

            if (accountTeamId) {
                await deactivateTeamRegistryRows({
                    teamId: accountTeamId,
                    registryId: registryAccountId || accountId,
                    sourceTable: table_name === 'social_connected_accounts' ? null : table_name,
                    sourceId: sourceId || accountId,
                });
            }

            res.json({ success: true, message: 'Social account disconnected successfully' });
        } catch (error) {
            console.error('Disconnect account error:', error);
            res.status(500).json({ error: 'Failed to disconnect social account' });
        }
    },

    // Generate SSO token for subdomain access
    async generateSSOToken(req, res) {
        try {
            const userId = req.user.id;
            const { subdomain } = req.body;
            
            if (!subdomain) {
                return res.status(400).json({ error: 'Subdomain is required' });
            }
            
            // Get user's team and role - prioritize owner role, then by most recent
            const teamResult = await query(`
                SELECT tm.team_id, tm.role, t.name as team_name, u.email, u.name
                FROM team_members tm 
                JOIN teams t ON tm.team_id = t.id
                JOIN users u ON tm.user_id = u.id
                WHERE tm.user_id = $1 AND tm.status = 'active'
                ORDER BY 
                    CASE tm.role 
                        WHEN 'owner' THEN 1 
                        WHEN 'admin' THEN 2 
                        WHEN 'editor' THEN 3 
                        WHEN 'viewer' THEN 4 
                        ELSE 5 
                    END,
                    tm.joined_at DESC
                LIMIT 1
            `, [userId]);
            
            if (teamResult.rows.length === 0) {
                return res.status(400).json({ error: 'User is not part of any active team' });
            }
            
            const { team_id: teamId, role, team_name: teamName, email, name } = teamResult.rows[0];
            
            // Create JWT payload
            const payload = {
                // Core user identification
                userId,
                teamId,
                role,
                
                // User details
                email,
                name,
                
                // Team context
                teamName,
                
                // Token metadata
                iss: 'main-platform',
                aud: [subdomain],
                exp: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
                iat: Math.floor(Date.now() / 1000)
            };
            
            // Sign the token
            const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key');
            
            // Generate subdomain URL with token
            const subdomainUrls = {
                'tweetgenie': process.env.TWEETGENIE_URL || 'http://localhost:3002',
                'linkedingenie': process.env.LINKEDINGENIE_URL || 'http://localhost:3001',
                'suitegenie': process.env.SUITEGENIE_URL || 'http://localhost:3003'
            };
            
            const baseUrl = subdomainUrls[subdomain.toLowerCase()];
            if (!baseUrl) {
                return res.status(400).json({ error: 'Invalid subdomain' });
            }
            
            const ssoUrl = `${baseUrl}/sso?token=${token}`;
            
            res.json({
                success: true,
                token,
                ssoUrl,
                expiresIn: 30 * 60 // 30 minutes in seconds
            });
        } catch (error) {
            console.error('Generate SSO token error:', error);
            res.status(500).json({ 
                error: 'Failed to generate SSO token' 
            });
        }
    }
};
