import { query, pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class TeamController {
    // Invite a team member (Owner/Admin only)
    static async invite(req, res) {
        try {
            const { workspaceId } = req.params;
            const { email, role } = req.body;
            
            // Validate role
            const validRoles = ['admin', 'editor', 'viewer'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ 
                    error: 'Invalid role. Must be admin, editor, or viewer',
                    code: 'INVALID_ROLE' 
                });
            }
            
            // Check if user has permission to invite (Owner or Admin)
            const userRoleResult = await query(`
                SELECT tm.role, w.plan_type
                FROM team_members tm
                JOIN workspaces w ON tm.workspace_id = w.id
                WHERE tm.workspace_id = $1 AND tm.user_id = $2 AND tm.status = 'accepted'
            `, [workspaceId, req.user.id]);
            
            if (userRoleResult.rows.length === 0) {
                return res.status(403).json({ 
                    error: 'Access denied to this workspace',
                    code: 'WORKSPACE_ACCESS_DENIED' 
                });
            }
            
            const userRole = userRoleResult.rows[0].role;
            const workspacePlan = userRoleResult.rows[0].plan_type;
            
            if (!['owner', 'admin'].includes(userRole)) {
                return res.status(403).json({ 
                    error: 'Only owners and admins can invite team members',
                    code: 'INSUFFICIENT_PERMISSIONS' 
                });
            }
            
            // Check team size limits
            const teamCountResult = await query(
                'SELECT COUNT(*) as count FROM team_members WHERE workspace_id = $1',
                [workspaceId]
            );
            
            const currentTeamSize = parseInt(teamCountResult.rows[0].count);
            const maxTeamSize = workspacePlan === 'pro' ? 5 : workspacePlan === 'enterprise' ? 15 : 1;
            
            if (currentTeamSize >= maxTeamSize) {
                return res.status(400).json({ 
                    error: `Team size limit reached. ${workspacePlan} plan allows maximum ${maxTeamSize} members`,
                    code: 'TEAM_SIZE_LIMIT' 
                });
            }
            
            // Check if user is already invited or a member
            const existingResult = await query(`
                SELECT status FROM team_members 
                WHERE workspace_id = $1 AND (
                    (user_id = (SELECT id FROM users WHERE email = $2)) OR
                    invited_email = $2
                )
            `, [workspaceId, email]);
            
            if (existingResult.rows.length > 0) {
                const status = existingResult.rows[0].status;
                return res.status(400).json({ 
                    error: status === 'pending' ? 'User already invited' : 'User is already a team member',
                    code: 'ALREADY_INVITED' 
                });
            }
            
            // Check if user exists
            const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
            const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null;
            
            // Create invitation
            const inviteResult = await query(`
                INSERT INTO team_members (user_id, account_owner_id, workspace_id, role, status, invited_email, invited_at)
                VALUES ($1, $2, $3, $4, 'pending', $5, NOW())
                RETURNING *
            `, [userId, req.user.id, workspaceId, role, email]);
            
            res.status(201).json({
                message: 'Team member invited successfully',
                invitation: {
                    id: inviteResult.rows[0].id,
                    email,
                    role,
                    status: 'pending',
                    invited_at: inviteResult.rows[0].invited_at
                }
            });
            
        } catch (error) {
            console.error('Invite team member error:', error);
            res.status(500).json({ 
                error: 'Failed to invite team member', 
                code: 'TEAM_INVITE_ERROR' 
            });
        }
    }

    // Update team member role (Owner only)
    static async updateRole(req, res) {
        try {
            const { workspaceId, memberId } = req.params;
            const { role } = req.body;
            
            // Validate role
            const validRoles = ['admin', 'editor', 'viewer'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ 
                    error: 'Invalid role. Must be admin, editor, or viewer',
                    code: 'INVALID_ROLE' 
                });
            }
            
            // Check if user is owner
            const userRoleResult = await query(`
                SELECT role FROM team_members 
                WHERE workspace_id = $1 AND user_id = $2 AND status = 'accepted'
            `, [workspaceId, req.user.id]);
            
            if (userRoleResult.rows.length === 0 || userRoleResult.rows[0].role !== 'owner') {
                return res.status(403).json({ 
                    error: 'Only workspace owners can change team member roles',
                    code: 'INSUFFICIENT_PERMISSIONS' 
                });
            }
            
            // Check if trying to change owner role
            const targetMemberResult = await query(`
                SELECT role FROM team_members 
                WHERE id = $1 AND workspace_id = $2
            `, [memberId, workspaceId]);
            
            if (targetMemberResult.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'Team member not found',
                    code: 'MEMBER_NOT_FOUND' 
                });
            }
            
            if (targetMemberResult.rows[0].role === 'owner') {
                return res.status(400).json({ 
                    error: 'Cannot change owner role',
                    code: 'CANNOT_CHANGE_OWNER' 
                });
            }
            
            // Update role
            await query(
                'UPDATE team_members SET role = $1, updated_at = NOW() WHERE id = $2',
                [role, memberId]
            );
            
            res.json({
                message: 'Team member role updated successfully',
                newRole: role
            });
            
        } catch (error) {
            console.error('Update team member role error:', error);
            res.status(500).json({ 
                error: 'Failed to update team member role', 
                code: 'TEAM_ROLE_UPDATE_ERROR' 
            });
        }
    }

    // Remove team member (Owner/Admin only)
    static async remove(req, res) {
        try {
            const { workspaceId, memberId } = req.params;
            
            // Check if user has permission
            const userRoleResult = await query(`
                SELECT role FROM team_members 
                WHERE workspace_id = $1 AND user_id = $2 AND status = 'accepted'
            `, [workspaceId, req.user.id]);
            
            if (userRoleResult.rows.length === 0) {
                return res.status(403).json({ 
                    error: 'Access denied to this workspace',
                    code: 'WORKSPACE_ACCESS_DENIED' 
                });
            }
            
            const userRole = userRoleResult.rows[0].role;
            
            if (!['owner', 'admin'].includes(userRole)) {
                return res.status(403).json({ 
                    error: 'Only owners and admins can remove team members',
                    code: 'INSUFFICIENT_PERMISSIONS' 
                });
            }
            
            // Check if trying to remove owner
            const targetMemberResult = await query(`
                SELECT role, user_id FROM team_members 
                WHERE id = $1 AND workspace_id = $2
            `, [memberId, workspaceId]);
            
            if (targetMemberResult.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'Team member not found',
                    code: 'MEMBER_NOT_FOUND' 
                });
            }
            
            const targetRole = targetMemberResult.rows[0].role;
            const targetUserId = targetMemberResult.rows[0].user_id;
            
            if (targetRole === 'owner') {
                return res.status(400).json({ 
                    error: 'Cannot remove workspace owner',
                    code: 'CANNOT_REMOVE_OWNER' 
                });
            }
            
            // Admin cannot remove another admin (only owner can)
            if (userRole === 'admin' && targetRole === 'admin') {
                return res.status(403).json({ 
                    error: 'Admins cannot remove other admins',
                    code: 'INSUFFICIENT_PERMISSIONS' 
                });
            }
            
            // Remove team member
            await query('DELETE FROM team_members WHERE id = $1', [memberId]);
            
            // If user was using this as current workspace, reset it
            if (targetUserId) {
                await query(
                    'UPDATE users SET current_workspace_id = NULL WHERE id = $1 AND current_workspace_id = $2',
                    [targetUserId, workspaceId]
                );
            }
            
            res.json({
                message: 'Team member removed successfully'
            });
            
        } catch (error) {
            console.error('Remove team member error:', error);
            res.status(500).json({ 
                error: 'Failed to remove team member', 
                code: 'TEAM_REMOVE_ERROR' 
            });
        }
    }

    // Accept team invitation
    static async acceptInvite(req, res) {
        try {
            const { inviteId } = req.params;
            
            // Find invitation
            const inviteResult = await query(`
                SELECT tm.*, w.name as workspace_name, w.slug
                FROM team_members tm
                JOIN workspaces w ON tm.workspace_id = w.id
                WHERE tm.id = $1 AND tm.status = 'pending'
            `, [inviteId]);
            
            if (inviteResult.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'Invitation not found or already processed',
                    code: 'INVITE_NOT_FOUND' 
                });
            }
            
            const invite = inviteResult.rows[0];
            
            // Check if invitation is for current user
            if (invite.invited_email !== req.user.email) {
                return res.status(403).json({ 
                    error: 'This invitation is not for your email address',
                    code: 'INVITATION_MISMATCH' 
                });
            }
            
            // Accept invitation
            await query(`
                UPDATE team_members 
                SET user_id = $1, status = 'accepted', updated_at = NOW() 
                WHERE id = $2
            `, [req.user.id, inviteId]);
            
            res.json({
                message: 'Invitation accepted successfully',
                workspace: {
                    id: invite.workspace_id,
                    name: invite.workspace_name,
                    slug: invite.slug,
                    url: `autoverse.com/w/${invite.slug}`,
                    role: invite.role
                }
            });
            
        } catch (error) {
            console.error('Accept team invitation error:', error);
            res.status(500).json({ 
                error: 'Failed to accept invitation', 
                code: 'ACCEPT_INVITE_ERROR' 
            });
        }
    }

    // Get user's pending invitations
    static async pendingInvites(req, res) {
        try {
            const result = await query(`
                SELECT tm.id, tm.role, tm.invited_at, w.name as workspace_name, w.slug,
                       u.name as invited_by_name
                FROM team_members tm
                JOIN workspaces w ON tm.workspace_id = w.id
                JOIN users u ON tm.account_owner_id = u.id
                WHERE tm.invited_email = $1 AND tm.status = 'pending'
                ORDER BY tm.invited_at DESC
            `, [req.user.email]);
            
            const invitations = result.rows.map(row => ({
                id: row.id,
                workspace_name: row.workspace_name,
                workspace_url: `autoverse.com/w/${row.slug}`,
                role: row.role,
                invited_by: row.invited_by_name,
                invited_at: row.invited_at
            }));
            
            res.json({ invitations });
            
        } catch (error) {
            console.error('Get pending invitations error:', error);
            res.status(500).json({ 
                error: 'Failed to get pending invitations', 
                code: 'PENDING_INVITES_ERROR' 
            });
        }
    }
}

export default TeamController;