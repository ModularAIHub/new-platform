// rolePermissions.js - Service for checking team role permissions
import { query } from '../config/database.js';

export class RolePermissionsService {
    
    // Get all permissions for a specific role
    static async getRolePermissions(role) {
        try {
            const result = await query(
                'SELECT permission FROM team_role_permissions WHERE role = $1',
                [role]
            );
            return result.rows.map(row => row.permission);
        } catch (error) {
            console.error('Error getting role permissions:', error);
            return [];
        }
    }

    // Check if a role has a specific permission
    static async hasPermission(role, permission) {
        try {
            const result = await query(
                'SELECT 1 FROM team_role_permissions WHERE role = $1 AND permission = $2',
                [role, permission]
            );
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error checking permission:', error);
            return false;
        }
    }

    // Get role limits (profile connections, etc.)
    static async getRoleLimits(role) {
        try {
            const result = await query(
                'SELECT * FROM team_role_limits WHERE role = $1',
                [role]
            );
            return result.rows[0] || {
                max_profile_connections: 0,
                can_invite_members: false,
                can_manage_team: false
            };
        } catch (error) {
            console.error('Error getting role limits:', error);
            return {
                max_profile_connections: 0,
                can_invite_members: false,
                can_manage_team: false
            };
        }
    }

    // Check if user can perform action based on their team role
    static async canUserPerformAction(userId, action) {
        try {
            // Get user's team role
            const userResult = await query(`
                SELECT tm.role 
                FROM team_members tm 
                WHERE tm.user_id = $1 AND tm.status = 'active'
            `, [userId]);

            if (userResult.rows.length === 0) {
                return false; // User not in any team
            }

            const userRole = userResult.rows[0].role;
            return await this.hasPermission(userRole, action);
        } catch (error) {
            console.error('Error checking user action permission:', error);
            return false;
        }
    }

    // Get user's effective permissions in their team
    static async getUserPermissions(userId) {
        try {
            // First try to get user's current_team_id from users table
            const currentTeamResult = await query(`
                SELECT current_team_id FROM users WHERE id = $1
            `, [userId]);
            
            const currentTeamId = currentTeamResult.rows[0]?.current_team_id;
            
            let userResult;
            
            if (currentTeamId) {
                // Use the user's selected current team
                userResult = await query(`
                    SELECT tm.role, tm.team_id
                    FROM team_members tm 
                    WHERE tm.user_id = $1 AND tm.team_id = $2 AND tm.status = 'active'
                `, [userId, currentTeamId]);
            }
            
            // If no current team or not found, get any active membership
            if (!userResult || userResult.rows.length === 0) {
                userResult = await query(`
                    SELECT tm.role, tm.team_id
                    FROM team_members tm 
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
            }

            if (userResult.rows.length === 0) {
                return { role: null, permissions: [], limits: null, team_id: null };
            }

            const { role, team_id } = userResult.rows[0];
            const permissions = await this.getRolePermissions(role);
            const limits = await this.getRoleLimits(role);

            console.log('[PERMISSIONS] User', userId, 'has role', role, 'in team', team_id);

            return {
                role,
                team_id,
                permissions,
                limits
            };
        } catch (error) {
            console.error('Error getting user permissions:', error);
            return { role: null, permissions: [], limits: null, team_id: null };
        }
    }

    // Permission constants for easy reference
    static PERMISSIONS = {
        MANAGE_TEAM: 'manage_team',
        CONNECT_PROFILES: 'connect_profiles',
        CREATE_CONTENT: 'create_content',
        SCHEDULE_POSTS: 'schedule_posts',
        VIEW_ANALYTICS: 'view_analytics',
        MANAGE_BILLING: 'manage_billing',
        MANAGE_CONTENT: 'manage_content',
        VIEW_OWN_CONTENT: 'view_own_content',
        VIEW_SCHEDULED_POSTS: 'view_scheduled_posts',
        VIEW_CONTENT: 'view_content'
    };

    // Role hierarchy (higher number = more permissions)
    static ROLE_HIERARCHY = {
        viewer: 1,
        editor: 2,
        admin: 3,
        owner: 4
    };

    // Check if one role has higher privileges than another
    static isHigherRole(role1, role2) {
        const level1 = this.ROLE_HIERARCHY[role1] || 0;
        const level2 = this.ROLE_HIERARCHY[role2] || 0;
        return level1 > level2;
    }
}

export default RolePermissionsService;