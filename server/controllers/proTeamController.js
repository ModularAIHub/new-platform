// proTeamController.js 
// Controller for Pro plan team collaboration features
import jwt from 'jsonwebtoken';
import { TeamService } from '../services/teamService.js';
import { RolePermissionsService } from '../services/rolePermissions.js';
import { query } from '../config/database.js';

export const ProTeamController = {
    // Get team's social accounts (robust, debug, CSRF compatible)
    async getTeamSocialAccounts(req, res) {
        try {
            const userId = req.user?.id;
            const teamId = req.user?.teamId || req.user?.team_id;
            console.log('[DEBUG /pro-team/social-accounts] userId:', userId, 'teamId:', teamId);

            if (!teamId) {
                return res.status(403).json({ success: false, error: 'User is not in a team', accounts: [] });
            }

            const result = await query(
                `SELECT id, platform, account_username, account_display_name, account_id, profile_image_url, created_at, last_used_at
                 FROM user_social_accounts
                 WHERE team_id = $1 AND platform = 'twitter' AND is_active = true
                 ORDER BY connection_order ASC, created_at ASC`,
                [teamId]
            );

            const accounts = result.rows;
            console.log('[DEBUG /pro-team/social-accounts] Query result:', accounts);

            res.json({
                success: true,
                accounts,
                totalAccounts: accounts.length,
                teamId,
            });
        } catch (error) {
            console.error('[DEBUG /pro-team/social-accounts] Error:', error);
            res.status(500).json({ success: false, error: error.message, accounts: [] });
        }
    },
    // Get current user's team
    async getTeam(req, res) {
        try {
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
            console.error('Get team error:', error);
            res.status(500).json({ error: 'Failed to get team information' });
        }
    },

    // Create a team (for Pro users)
    async createTeam(req, res) {
        try {
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
            res.json({ success: true, team });
        } catch (error) {
            console.error('Create team error:', error);
            res.status(500).json({ error: 'Failed to create team' });
        }
    },

    // Invite user to team
    async inviteUser(req, res) {
        try {
            const userId = req.user.id;
            const { email } = req.body;

            if (!email || !/\S+@\S+\.\S+/.test(email)) {
                return res.status(400).json({ error: 'Valid email is required' });
            }

            // Get user's team
            const userTeam = await TeamService.getUserTeam(userId);
            if (!userTeam) {
                return res.status(404).json({ error: 'You are not part of any team' });
            }

            const invitation = await TeamService.inviteToTeam(userTeam.id, userId, email);
            const message = invitation.isResend 
                ? `Invitation resent to ${email}` 
                : `Invitation sent to ${email}`;
            
            res.json({ 
                success: true, 
                message,
                isResend: invitation.isResend,
                invitation: {
                    id: invitation.id,
                    email: invitation.email,
                    expires_at: invitation.expires_at
                }
            });
        } catch (error) {
            console.error('Invite user error:', error);
            res.status(400).json({ error: error.message });
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

    // Get team's social accounts
    async getTeamSocialAccounts(req, res) {
        try {
            const userId = req.user.id;
            
            // Get user's team and permissions
            const userPermissions = await RolePermissionsService.getUserPermissions(userId);
            if (!userPermissions.role) {
                return res.status(404).json({ error: 'You are not part of any team' });
            }

            // Get all team social accounts
            const accounts = await query(`
                SELECT 
                    sa.*,
                    u.email as connected_by_email,
                    u.name as connected_by_name
                FROM user_social_accounts sa
                JOIN users u ON sa.user_id = u.id
                WHERE sa.team_id = $1 AND sa.is_active = true
                ORDER BY sa.platform, sa.created_at DESC
            `, [userPermissions.team_id]);

            res.json({
                success: true,
                accounts: accounts.rows,
                userRole: userPermissions.role,
                limits: userPermissions.limits
            });
        } catch (error) {
            console.error('Get team social accounts error:', error);
            res.status(500).json({ error: 'Failed to get social accounts' });
        }
    },

    // Connect a new social account
    async connectAccount(req, res) {
        try {
            const userId = req.user.id;
            const { platform, accountData } = req.body;

            // Check permissions
            const canConnect = await RolePermissionsService.canUserPerformAction(userId, 'connect_profiles');
            if (!canConnect) {
                return res.status(403).json({ 
                    error: 'You do not have permission to connect social accounts' 
                });
            }

            // Get user's team and role limits
            const userPermissions = await RolePermissionsService.getUserPermissions(userId);
            if (!userPermissions.team_id) {
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
                return res.status(400).json({ 
                    error: `You have reached your connection limit (${maxConnections} accounts)` 
                });
            }

            // Check if account is already connected to the team
            const existingAccount = await query(`
                SELECT id FROM user_social_accounts 
                WHERE team_id = $1 AND platform = $2 AND account_id = $3 AND is_active = true
            `, [userPermissions.team_id, platform, accountData.account_id]);

            if (existingAccount.rows.length > 0) {
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
            console.error('Leave team error:', error);
            res.status(400).json({ error: error.message });
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
                limits: teamWideLimits
            });
        } catch (error) {
            console.error('Get user permissions error:', error);
            res.status(500).json({ 
                error: 'Failed to get user permissions' 
            });
        }
    },

    // Get team's social accounts
    async getTeamSocialAccounts(req, res) {
        try {
            const userId = req.user.id;
            // Get user's team
            const teamResult = await query(`
                SELECT team_id FROM team_members 
                WHERE user_id = $1 AND status = 'active'
            `, [userId]);
            if (teamResult.rows.length === 0) {
                return res.json({ success: true, accounts: [] });
            }
            const teamId = teamResult.rows[0].team_id;

            // Get all social accounts for the team (user_social_accounts)
            const userAccountsResult = await query(`
                SELECT usa.id, usa.platform, usa.account_username, usa.account_display_name, 
                       usa.account_id, usa.profile_image_url, usa.created_at,
                       u.name as connected_by_name, u.email as connected_by_email,
                       true as is_active
                FROM user_social_accounts usa
                LEFT JOIN users u ON usa.user_id = u.id
                WHERE usa.team_id = $1 AND usa.is_active = true
                ORDER BY usa.created_at ASC
            `, [teamId]);

            // Get all team_accounts for the team
            const teamAccountsResult = await query(`
                SELECT ta.id, 'twitter' as platform, ta.twitter_username as account_username, ta.twitter_display_name as account_display_name,
                       ta.twitter_user_id as account_id, NULL as profile_image_url,
                       u.name as connected_by_name, u.email as connected_by_email,
                       ta.active
                FROM team_accounts ta
                LEFT JOIN users u ON ta.user_id = u.id
                WHERE ta.team_id = $1 AND ta.active = true
            `, [teamId]);

            // Merge both account arrays
            const mergedAccounts = [...userAccountsResult.rows, ...teamAccountsResult.rows];

            res.json({
                success: true,
                accounts: mergedAccounts
            });
        } catch (error) {
            console.error('Get team social accounts error:', error);
            res.status(500).json({ 
                error: 'Failed to get team social accounts' 
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
            const countResult = await query(`
                SELECT COUNT(*) as count 
                FROM user_social_accounts 
                WHERE team_id = $1 AND is_active = true
            `, [teamId]);
            
            const currentCount = parseInt(countResult.rows[0].count);
            const teamLimit = 8; // Team-wide limit of 8 accounts
            
            if (currentCount >= teamLimit) {
                return res.status(400).json({ 
                    error: `Team has reached maximum limit of ${teamLimit} social accounts` 
                });
            }
            
            // Generate redirect URL to subdomain
            const subdomains = {
                twitter: process.env.TWITTER_SUBDOMAIN || 'tweetapi.suitegenie.in',
                linkedin: process.env.LINKEDIN_SUBDOMAIN || 'linkedin.suitegenie.in',
                wordpress: process.env.WORDPRESS_SUBDOMAIN || 'wordpress.suitegenie.in',
                facebook: process.env.FACEBOOK_SUBDOMAIN || 'facebook.suitegenie.in',
                instagram: process.env.INSTAGRAM_SUBDOMAIN || 'instagram.suitegenie.in'
            };

            const subdomain = subdomains[platform.toLowerCase()];
            if (!subdomain) {
                return res.status(400).json({ error: 'Unsupported platform' });
            }
            
            const ensureUrl = (host) => host.startsWith('http') ? host : `https://${host}`;
            const returnUrl = `${ensureUrl(process.env.CLIENT_URL || 'https://suitegenie.in')}/team`; // Frontend URL, not backend
            const redirectUrl = `${ensureUrl(subdomain)}/api/twitter/team-connect?teamId=${teamId}&userId=${userId}&returnUrl=${encodeURIComponent(returnUrl)}`;
            
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

            // Find account and its team
            const accountResult = await query(
                `SELECT id, team_id FROM user_social_accounts WHERE id = $1 AND is_active = true`,
                [accountId]
            );

            if (accountResult.rows.length === 0) {
                return res.status(404).json({ error: 'Social account not found' });
            }

            const { team_id: accountTeamId } = accountResult.rows[0];

            // Verify user is owner/admin of that team
            const membership = await query(
                `SELECT role FROM team_members WHERE user_id = $1 AND team_id = $2 AND status = 'active'`,
                [userId, accountTeamId]
            );

            if (membership.rows.length === 0) {
                return res.status(403).json({ error: 'You are not part of this team' });
            }

            const role = membership.rows[0].role;
            if (!['owner', 'admin'].includes(role)) {
                return res.status(403).json({ error: 'Only team owners and admins can disconnect social accounts' });
            }

            await query(
                `UPDATE user_social_accounts SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [accountId]
            );

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