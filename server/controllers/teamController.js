import { query, pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class TeamController {
    // Invite a team member (Owner/Admin only)
    static async invite(req, res) {
        
        try {
            const { teamId } = req.params;
            const { email, role } = req.body;
            
            // Validate role - provide default if not specified
            const selectedRole = role || 'editor'; // Default to 'editor' instead of 'member'
            const validRoles = ['admin', 'editor', 'viewer']; // Use database-allowed roles
            if (!validRoles.includes(selectedRole)) {
                return res.status(400).json({ 
                    error: 'Invalid role. Must be admin, editor, or viewer',
                    code: 'INVALID_ROLE' 
                });
            }
            
            // Check if user has permission to invite (Owner or Admin)
            const userRoleResult = await query(`
                SELECT tm.role, t.plan_type, t.name as team_name, t.max_members,
                       u.name as inviter_name, u.email as inviter_email
                FROM team_members tm
                JOIN teams t ON tm.team_id = t.id
                JOIN users u ON tm.user_id = u.id
                WHERE tm.team_id = $1 AND tm.user_id = $2 AND tm.status = 'active'
            `, [teamId, req.user.id]);
            
            if (userRoleResult.rows.length === 0) {
                return res.status(403).json({ 
                    error: 'Access denied to this team',
                    code: 'TEAM_ACCESS_DENIED' 
                });
            }
            
            const { role: userRole, plan_type: teamPlan, team_name: teamName, max_members: maxTeamSize, inviter_name: inviterName, inviter_email: inviterEmail } = userRoleResult.rows[0];
            
            if (!['owner', 'admin'].includes(userRole)) {
                return res.status(403).json({ 
                    error: 'Only owners and admins can invite team members',
                    code: 'INSUFFICIENT_PERMISSIONS' 
                });
            }
            
            // Check team size limits
            const teamCountResult = await query(
                'SELECT COUNT(*) as count FROM team_members WHERE team_id = $1',
                [teamId]
            );
            
            const currentTeamSize = parseInt(teamCountResult.rows[0].count);
            
            if (currentTeamSize >= maxTeamSize) {
                return res.status(400).json({ 
                    error: `Team size limit reached. ${teamPlan} plan allows maximum ${maxTeamSize} members`,
                    code: 'TEAM_SIZE_LIMIT' 
                });
            }
            
            // Check if user exists (registered user)
            const userResult = await query('SELECT id, name FROM users WHERE email = $1', [email]);
            const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null;
            const userName = userResult.rows.length > 0 ? userResult.rows[0].name : null;

            // Check if user is already invited or a member in ANY team (match by email OR user_id)
            const existingResult = await query(`
                SELECT team_id, status FROM team_members 
                WHERE email = $1 OR (user_id IS NOT NULL AND user_id = $2)
            `, [email, userId]);

            if (existingResult.rows.length > 0) {
                // If any membership belongs to the same team, keep previous behaviour
                const sameTeam = existingResult.rows.find(r => String(r.team_id) === String(teamId));
                if (sameTeam) {
                    const status = sameTeam.status;
                    return res.status(400).json({ 
                        error: status === 'pending' ? 'User already invited' : 'User is already a team member',
                        code: 'ALREADY_INVITED' 
                    });
                }

                // Otherwise, the user is in another team
                return res.status(400).json({
                    error: 'The user is already a member of another team and cannot be invited.',
                    code: 'ALREADY_IN_ANOTHER_TEAM'
                });
            }
            
            // Generate invitation token and expiration
            const invitationToken = uuidv4();
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
            
            // Create invitation in team_invitations table
            const inviteResult = await query(`
                INSERT INTO team_invitations (team_id, email, invited_by, token, expires_at, status)
                VALUES ($1, $2, $3, $4, $5, 'pending')
                RETURNING *
            `, [teamId, email, req.user.id, invitationToken, expiresAt]);
            
            // Also create entry in team_members for tracking
            await query(`
                INSERT INTO team_members (team_id, user_id, email, role, status, invited_at, invited_by)
                VALUES ($1, $2, $3, $4, 'pending', NOW(), $5)
            `, [teamId, userId, email, selectedRole, req.user.id]);
            
            // (Email sending handled separately by mailer service; removed here to avoid dependency)

            res.status(201).json({
                message: 'Team member invited successfully',
                invitation: {
                    id: inviteResult.rows[0].id,
                    email,
                    role: selectedRole,
                    status: 'pending',
                    token: invitationToken,
                    expires_at: expiresAt,
                    invited_at: inviteResult.rows[0].created_at
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
            const { teamId, memberId } = req.params;
            const { role } = req.body;
            
            console.log('🔄 Update Role Request:', {
                teamId,
                memberId,
                newRole: role,
                userId: req.user?.id
            });
            
            // Validate role
            const validRoles = ['admin', 'editor', 'viewer'];
            if (!validRoles.includes(role)) {
                console.log('❌ Invalid role:', role);
                return res.status(400).json({ 
                    error: 'Invalid role. Must be admin, editor, or viewer',
                    code: 'INVALID_ROLE' 
                });
            }
            
            // Check if user is owner
            console.log('🔍 Checking user role for teamId:', teamId, 'userId:', req.user.id);
            const userRoleResult = await query(`
                SELECT role FROM team_members 
                WHERE team_id = $1 AND user_id = $2 AND status = 'accepted'
            `, [teamId, req.user.id]);
            
            console.log('👤 User role result:', userRoleResult.rows);
            
            if (userRoleResult.rows.length === 0 || userRoleResult.rows[0].role !== 'owner') {
                console.log('❌ Insufficient permissions. User role:', userRoleResult.rows[0]?.role);
                return res.status(403).json({ 
                    error: 'Only team owners can change team member roles',
                    code: 'INSUFFICIENT_PERMISSIONS' 
                });
            }
            
            // Check if trying to change owner role
            console.log('🔍 Checking target member:', memberId);
            const targetMemberResult = await query(`
                SELECT role FROM team_members 
                WHERE id = $1 AND team_id = $2
            `, [memberId, teamId]);
            
            console.log('🎯 Target member result:', targetMemberResult.rows);
            
            if (targetMemberResult.rows.length === 0) {
                console.log('❌ Member not found');
                return res.status(404).json({ 
                    error: 'Team member not found',
                    code: 'MEMBER_NOT_FOUND' 
                });
            }
            
            if (targetMemberResult.rows[0].role === 'owner') {
                console.log('❌ Cannot change owner role');
                return res.status(400).json({ 
                    error: 'Cannot change owner role',
                    code: 'CANNOT_CHANGE_OWNER' 
                });
            }
            
            // Update role
            console.log('✏️ Updating role to:', role, 'for member:', memberId);
            const updateResult = await query(
                'UPDATE team_members SET role = $1 WHERE id = $2 RETURNING *',
                [role, memberId]
            );
            
            console.log('✅ Update result:', updateResult.rows);
            
            res.json({
                message: 'Team member role updated successfully',
                newRole: role
            });
            
        } catch (error) {
            console.error('❌ Update team member role error:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({ 
                error: 'Failed to update team member role', 
                details: error.message,
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

    // Remove team member by team_members.id (pending or active)
    static async removeByMemberId(req, res) {
        try {
            const { memberId } = req.params;
            
            // Get user's team and role to check permissions
            const userRoleResult = await query(`
                SELECT tm.role, tm.team_id 
                FROM team_members tm
                WHERE tm.user_id = $1 AND tm.status = 'active'
            `, [req.user.id]);
            
            if (userRoleResult.rows.length === 0) {
                return res.status(403).json({ 
                    error: 'You are not part of any active team',
                    code: 'NO_TEAM_ACCESS' 
                });
            }
            
            const { role: userRole, team_id: userTeamId } = userRoleResult.rows[0];
            
            // Only owner or admin can remove members
            if (!['owner', 'admin'].includes(userRole)) {
                return res.status(403).json({ 
                    error: 'Only owners and admins can remove team members',
                    code: 'INSUFFICIENT_PERMISSIONS' 
                });
            }
            
            // Get the member to be removed
            const memberResult = await query(`
                SELECT tm.*, u.email as user_email
                FROM team_members tm
                LEFT JOIN users u ON tm.user_id = u.id
                WHERE tm.id = $1 AND tm.team_id = $2
            `, [memberId, userTeamId]);
            
            if (memberResult.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'Team member not found',
                    code: 'MEMBER_NOT_FOUND' 
                });
            }
            
            const member = memberResult.rows[0];
            
            // Cannot remove owner
            if (member.role === 'owner') {
                return res.status(400).json({ 
                    error: 'Cannot remove team owner',
                    code: 'CANNOT_REMOVE_OWNER' 
                });
            }
            
            // Admin cannot remove another admin (only owner can)
            if (userRole === 'admin' && member.role === 'admin') {
                return res.status(403).json({ 
                    error: 'Admins cannot remove other admins',
                    code: 'INSUFFICIENT_PERMISSIONS' 
                });
            }
            
            // Remove the member
            if (member.status === 'pending') {
                // Hard delete for pending invitations
                await query('DELETE FROM team_members WHERE id = $1', [memberId]);
                await query('DELETE FROM team_invitations WHERE email = $1 AND team_id = $2', [member.email, userTeamId]);
            } else {
                // Soft delete for active members
                await query('UPDATE team_members SET status = $1 WHERE id = $2', ['inactive', memberId]);
                
                // Clear user's current team if this was their active team
                if (member.user_id) {
                    await query(
                        'UPDATE users SET current_team_id = NULL WHERE id = $1 AND current_team_id = $2',
                        [member.user_id, userTeamId]
                    );
                }
            }
            
            res.json({
                success: true,
                message: 'Team member removed successfully'
            });
            
        } catch (error) {
            console.error('Remove by memberId error:', error);
            res.status(500).json({ 
                error: 'Failed to remove team member',
                code: 'MEMBER_REMOVE_ERROR' 
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

    // Get invitation details by token (public endpoint)
    static async getInvitationByToken(req, res) {
        try {
            const { token } = req.params;
            
            const result = await query(`
                SELECT 
                    ti.id, ti.team_name, ti.inviter_email, ti.inviter_name, 
                    ti.created_at, ti.expires_at,
                    u.name as inviter_full_name
                FROM team_invitations ti
                LEFT JOIN users u ON ti.inviter_email = u.email
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
                    inviter_name: invitation.inviter_full_name || invitation.inviter_name,
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
    }

    // Accept invitation by token (requires auth)
    static async acceptInvitationByToken(req, res) {
        try {
            const { token } = req.params;
            
            // Find the invitation
            const inviteResult = await query(`
                SELECT * FROM team_invitations 
                WHERE token = $1 AND status = 'pending' AND expires_at > NOW()
            `, [token]);
            
            if (inviteResult.rows.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Invitation not found or expired' 
                });
            }
            
            const invitation = inviteResult.rows[0];
            
            // Check if user is already a team member
            const existingMember = await query(`
                SELECT id FROM team_members 
                WHERE team_id = $1 AND user_id = $2
            `, [invitation.team_id, req.user.id]);
            
            if (existingMember.rows.length > 0) {
                return res.status(400).json({ 
                    success: false,
                    error: 'You are already a member of this team' 
                });
            }
            
            // Add user to team
            await query(`
                INSERT INTO team_members (team_id, user_id, role, joined_at)
                VALUES ($1, $2, 'member', NOW())
            `, [invitation.team_id, req.user.id]);
            
            // Mark invitation as accepted
            await query(`
                UPDATE team_invitations 
                SET status = 'accepted', accepted_at = NOW(), accepted_by = $1
                WHERE id = $2
            `, [req.user.id, invitation.id]);
            
            res.json({
                success: true,
                message: 'Successfully joined the team!'
            });
            
        } catch (error) {
            console.error('Accept invitation by token error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to accept invitation' 
            });
        }
    }

    // Decline invitation by token (public endpoint)
    static async declineInvitationByToken(req, res) {
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
    }
}

export default TeamController;