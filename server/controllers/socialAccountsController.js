// socialAccountsController.js - Manage team social media connections
import { query } from '../config/database.js';
import RolePermissionsService from '../services/rolePermissions.js';

export const SocialAccountsController = {
    // Get team's social accounts with role-based filtering
    async getTeamSocialAccounts(req, res) {
        try {
            const userId = req.user.id;
            
            // Get user's team and permissions
            const userPermissions = await RolePermissionsService.getUserPermissions(userId);
            const teamId = userPermissions.team_id || null;
            
            let accounts;
            
            if (teamId) {
                // Get all team social accounts
                accounts = await query(`
                    SELECT 
                        sa.*,
                        u.email as connected_by_email,
                        u.name as connected_by_name
                    FROM user_social_accounts sa
                    JOIN users u ON sa.user_id = u.id
                    WHERE sa.team_id = $1 AND sa.is_active = true
                    ORDER BY sa.platform, sa.created_at DESC
                `, [teamId]);
            } else {
                // Get personal accounts for users not in teams
                accounts = await query(`
                    SELECT 
                        sa.*,
                        u.email as connected_by_email,
                        u.name as connected_by_name
                    FROM user_social_accounts sa
                    JOIN users u ON sa.user_id = u.id
                    WHERE sa.user_id = $1 AND sa.team_id IS NULL AND sa.is_active = true
                    ORDER BY sa.platform, sa.created_at DESC
                `, [userId]);
            }

            res.json({
                success: true,
                accounts: accounts.rows,
                userRole: userPermissions.role,
                limits: userPermissions.limits,
                isPersonalAccount: !teamId
            });
        } catch (error) {
            console.error('Get team social accounts error:', error);
            res.status(500).json({ error: 'Failed to get social accounts' });
        }
    },

    // Connect a new social account (LinkedIn/Twitter)
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
            const teamId = userPermissions.team_id || null; // Allow personal accounts if no team
            
            console.log('[CONNECT] User', userId, 'connecting', platform, 'account. Team ID:', teamId);

            // If user is in a team, check if they have a personal account and migrate it
            if (teamId) {
                const personalAccount = await query(`
                    SELECT id FROM user_social_accounts 
                    WHERE user_id = $1 AND platform = $2 AND account_id = $3 AND team_id IS NULL AND is_active = true
                `, [userId, platform, accountData.account_id]);

                if (personalAccount.rows.length > 0) {
                    // Migrate personal account to team account
                    await query(`
                        UPDATE user_social_accounts 
                        SET team_id = $1, updated_at = NOW()
                        WHERE id = $2
                    `, [teamId, personalAccount.rows[0].id]);

                    console.log('[CONNECT] Migrated personal account to team account:', personalAccount.rows[0].id);

                    return res.json({
                        success: true,
                        message: `${platform} account migrated to team successfully`,
                        accountId: personalAccount.rows[0].id,
                        isTeamAccount: true,
                        migrated: true
                    });
                }
            }

            // Check if user has reached their connection limit (only for team members)
            if (teamId) {
                const userAccountsCount = await query(`
                    SELECT COUNT(*) as count 
                    FROM user_social_accounts 
                    WHERE user_id = $1 AND team_id = $2 AND is_active = true
                `, [userId, teamId]);

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
                `, [teamId, platform, accountData.account_id]);

                if (existingAccount.rows.length > 0) {
                    return res.status(400).json({ 
                        error: 'This account is already connected to your team' 
                    });
                }
            } else {
                // For personal accounts, check if they already connected this account
                const existingAccount = await query(`
                    SELECT id FROM user_social_accounts 
                    WHERE user_id = $1 AND platform = $2 AND account_id = $3 AND is_active = true AND team_id IS NULL
                `, [userId, platform, accountData.account_id]);

                if (existingAccount.rows.length > 0) {
                    return res.status(400).json({ 
                        error: 'This account is already connected to your profile' 
                    });
                }
            }

            // Create social account connection
            const result = await query(`
                INSERT INTO user_social_accounts (
                    user_id, team_id, platform, account_username, account_display_name,
                    account_id, access_token, refresh_token, token_expires_at, profile_image_url,
                    oauth1_access_token, oauth1_access_token_secret
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id
            `, [
                userId,
                teamId, // Will be NULL for personal accounts, team_id for team members
                platform,
                accountData.username,
                accountData.displayName,
                accountData.account_id,
                accountData.accessToken,
                accountData.refreshToken || null,
                accountData.expiresAt || null,
                accountData.profileImage || null,
                accountData.oauth1AccessToken || null,
                accountData.oauth1AccessTokenSecret || null
            ]);

            console.log('[CONNECT] Successfully connected', platform, 'account', accountData.username, 'for user', userId, 'with team_id:', teamId);

            res.json({
                success: true,
                message: `${platform} account connected successfully`,
                accountId: result.rows[0].id,
                isTeamAccount: !!teamId
            });
        } catch (error) {
            console.error('Connect account error:', error);
            res.status(500).json({ error: 'Failed to connect social account' });
        }
    },

    // Disconnect a social account
    async disconnectAccount(req, res) {
        try {
            const userId = req.user.id;
            const { accountId } = req.params;

            // Check permissions
            const canConnect = await RolePermissionsService.canUserPerformAction(userId, 'connect_profiles');
            if (!canConnect) {
                return res.status(403).json({ 
                    error: 'You do not have permission to manage social accounts' 
                });
            }

            // Get user's team
            const userPermissions = await RolePermissionsService.getUserPermissions(userId);
            if (!userPermissions.team_id) {
                return res.status(404).json({ error: 'You are not part of any team' });
            }

            // Verify account belongs to user's team
            const account = await query(`
                SELECT user_id FROM user_social_accounts 
                WHERE id = $1 AND team_id = $2 AND is_active = true
            `, [accountId, userPermissions.team_id]);

            if (account.rows.length === 0) {
                return res.status(404).json({ error: 'Social account not found' });
            }

            // Only allow users to disconnect their own accounts, or owners/admins to disconnect any
            const accountOwnerId = account.rows[0].user_id;
            const isOwner = userPermissions.role === 'owner';
            const isAccountOwner = accountOwnerId === userId;

            if (!isOwner && !isAccountOwner) {
                return res.status(403).json({ 
                    error: 'You can only disconnect your own accounts' 
                });
            }

            // Deactivate the account (soft delete)
            await query(`
                UPDATE user_social_accounts 
                SET is_active = false, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [accountId]);

            res.json({
                success: true,
                message: 'Social account disconnected successfully'
            });
        } catch (error) {
            console.error('Disconnect account error:', error);
            res.status(500).json({ error: 'Failed to disconnect social account' });
        }
    },

    // Get available platforms and connection status
    async getAvailablePlatforms(req, res) {
        try {
            const userId = req.user.id;
            
            // Get user permissions
            const userPermissions = await RolePermissionsService.getUserPermissions(userId);
            const canConnect = await RolePermissionsService.canUserPerformAction(userId, 'connect_profiles');

            // Get current connections count
            const userAccountsCount = await query(`
                SELECT COUNT(*) as count 
                FROM user_social_accounts 
                WHERE user_id = $1 AND team_id = $2 AND is_active = true
            `, [userId, userPermissions.team_id || null]);

            const currentCount = parseInt(userAccountsCount.rows[0].count);
            const maxConnections = userPermissions.limits?.max_profile_connections || 0;

            const platforms = [
                {
                    name: 'LinkedIn',
                    key: 'linkedin',
                    description: 'Professional networking and business content',
                    authUrl: '/api/linkedin/auth',
                    available: true
                },
                {
                    name: 'Twitter',
                    key: 'twitter', 
                    description: 'Real-time updates and social engagement',
                    authUrl: '/api/twitter/auth',
                    available: true
                }
            ];

            res.json({
                success: true,
                platforms,
                canConnect,
                currentCount,
                maxConnections,
                role: userPermissions.role
            });
        } catch (error) {
            console.error('Get available platforms error:', error);
            res.status(500).json({ error: 'Failed to get available platforms' });
        }
    }
};

export default SocialAccountsController;