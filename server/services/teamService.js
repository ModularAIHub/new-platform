// teamService.js
// Service for team collaboration features - Pro plan
import { query } from '../config/database.js';
import crypto from 'crypto';
import EmailService from './emailService.js';

export const TeamService = {
    // Create a team for a Pro user
    async createTeam(ownerId, teamName) {
        const maxMembers = 5; // Pro plan limit
        
        // Use BEGIN/COMMIT to prevent race conditions
        await query('BEGIN');
        
        try {
            // Check if user already owns a team (within transaction)
            const existingOwner = await query(
                `SELECT id FROM teams WHERE owner_id = $1 FOR UPDATE`,
                [ownerId]
            );
            
            if (existingOwner.rows.length > 0) {
                await query('ROLLBACK');
                throw new Error('You already own a team');
            }
            
            const result = await query(
                `INSERT INTO teams (name, owner_id, plan_type, max_members) 
                 VALUES ($1, $2, 'pro', $3) 
                 RETURNING *`,
                [teamName, ownerId, maxMembers]
            );
            
            const teamId = result.rows[0].id;
            
            // Add owner as team member
            await query(
                `INSERT INTO team_members (team_id, user_id, email, role, status, joined_at)
                 SELECT $1, $2, u.email, 'owner', 'active', CURRENT_TIMESTAMP
                 FROM users u WHERE u.id = $2`,
                [teamId, ownerId]
            );
            
            // Set as user's current team
            await query(
                `UPDATE users SET current_team_id = $1 WHERE id = $2`,
                [teamId, ownerId]
            );
            
            await query('COMMIT');
            
            // Get team members to return full team object
            const membersResult = await query(`
                SELECT 
                    tm.id,
                    tm.email,
                    tm.role,
                    tm.status,
                    tm.joined_at,
                    COALESCE(u.name, tm.email) as user_name
                FROM team_members tm 
                LEFT JOIN users u ON tm.user_id = u.id
                WHERE tm.team_id = $1 AND tm.status = $2
                ORDER BY tm.joined_at ASC
            `, [teamId, 'active']);
            
            return {
                ...result.rows[0],
                user_role: 'owner',
                member_count: membersResult.rows.length,
                members: membersResult.rows
            };
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
    },

    // Get user's team info
    async getUserTeam(userId) {
        // First check if user is in any team
        const memberResult = await query(
            'SELECT team_id, role, status FROM team_members WHERE user_id = $1 AND status = $2',
            [userId, 'active']
        );

        if (memberResult.rows.length === 0) {
            return null;
        }

        const teamId = memberResult.rows[0].team_id;
        const userRole = memberResult.rows[0].role;

        // Get team details
        const teamResult = await query(
            'SELECT * FROM teams WHERE id = $1',
            [teamId]
        );

        if (teamResult.rows.length === 0) {
            return null;
        }

        // Get team members
        const membersResult = await query(`
            SELECT 
                tm.id,
                tm.email,
                tm.role,
                tm.status,
                tm.joined_at,
                COALESCE(u.name, tm.email) as user_name
            FROM team_members tm 
            LEFT JOIN users u ON tm.user_id = u.id
            WHERE tm.team_id = $1 AND tm.status = $2
            ORDER BY tm.joined_at ASC
        `, [teamId, 'active']);

        return {
            ...teamResult.rows[0],
            user_role: userRole,
            member_count: membersResult.rows.length,
            members: membersResult.rows
        };
    },

    // Invite a user to team
    async inviteToTeam(teamId, inviterUserId, inviteEmail, role = 'editor') {
        // Check if inviter has permission
        const inviter = await query(
            `SELECT tm.role, t.max_members, t.owner_id
             FROM team_members tm 
             JOIN teams t ON tm.team_id = t.id
             WHERE tm.team_id = $1 AND tm.user_id = $2 AND tm.status = 'active'`,
            [teamId, inviterUserId]
        );

        if (!inviter.rows[0] || !['owner', 'admin'].includes(inviter.rows[0].role)) {
            throw new Error('You do not have permission to invite users');
        }

        // Check team capacity
        const memberCount = await query(
            `SELECT COUNT(*) as count FROM team_members WHERE team_id = $1 AND status = 'active'`,
            [teamId]
        );

        if (parseInt(memberCount.rows[0].count) >= inviter.rows[0].max_members) {
            throw new Error(`Team is at maximum capacity (${inviter.rows[0].max_members} members)`);
        }

        // Check if user is already a team member
        const existingMember = await query(
            `SELECT 1 FROM team_members WHERE team_id = $1 AND email = $2 AND status = 'active'`,
            [teamId, inviteEmail]
        );

        if (existingMember.rows.length > 0) {
            throw new Error('User is already a member of this team');
        }

        // Check for existing pending invitations
        const existingInvite = await query(
            `SELECT * FROM team_invitations 
             WHERE team_id = $1 AND email = $2 AND status = 'pending'
             ORDER BY created_at DESC LIMIT 1`,
            [teamId, inviteEmail]
        );

        // Generate new invitation token and expiry
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        let invitation;
        let isResend = false;

        if (existingInvite.rows.length > 0) {
            // Update existing invitation with new token and expiry (allows resending)
            invitation = await query(
                `UPDATE team_invitations 
                 SET token = $1, expires_at = $2, created_at = CURRENT_TIMESTAMP, invited_by = $3, role = $4
                 WHERE id = $5
                 RETURNING *`,
                [token, expiresAt, inviterUserId, role, existingInvite.rows[0].id]
            );
            isResend = true;

            // Update pending team_members entry with new role
            await query(
                `UPDATE team_members 
                 SET role = $1
                 WHERE team_id = $2 AND email = $3 AND status = 'pending'`,
                [role, teamId, inviteEmail]
            );
        } else {
            // Create new invitation
            invitation = await query(
                `INSERT INTO team_invitations (team_id, email, invited_by, token, expires_at, role)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [teamId, inviteEmail, inviterUserId, token, expiresAt, role]
            );

            // Create a pending team_members entry with the specified role
            await query(
                `INSERT INTO team_members (team_id, email, role, status)
                 VALUES ($1, $2, $3, 'pending')`,
                [teamId, inviteEmail, role]
            );
        }

        // Send invitation email
        await this.sendInvitationEmail(inviteEmail, token, teamId);

        return { ...invitation.rows[0], isResend };
    },

    // Send invitation email using Resend
    async sendInvitationEmail(email, token, teamId) {
        try {
            const teamInfo = await query(
                `SELECT t.name, u.email as owner_email, u.name as owner_name
                 FROM teams t 
                 JOIN users u ON t.owner_id = u.id 
                 WHERE t.id = $1`,
                [teamId]
            );

            const team = teamInfo.rows[0];
            const clientUrl = process.env.CLIENT_URL || process.env.BASE_URL || 'https://suitegenie.in';
            const inviteUrl = `${clientUrl}/team/invite/${token}`;
            
            // Use the Resend EmailService
            const emailService = new EmailService();
            
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
            
            await emailService.sendTeamInvitation({
                recipientEmail: email,
                recipientName: email, // Use email as name since we don't have the recipient's name
                inviterName: team.owner_name,
                inviterEmail: team.owner_email,
                teamName: team.name,
                role: 'editor', // Default role for legacy invitations
                invitationToken: token,
                expiresAt: expiresAt
            });
            
            console.log(`✅ Team invitation email sent to ${email}`);
        } catch (error) {
            console.error('❌ Failed to send invitation email:', error);
            const clientUrl = process.env.CLIENT_URL || process.env.BASE_URL || 'https://suitegenie.in';
            const inviteUrl = `${clientUrl}/team/invite/${token}`;
            console.log('📧 Invitation link (email failed):', inviteUrl);
        }
    },

    // Accept team invitation
    async acceptInvitation(token, userId) {
        // Find invitation
        const invitation = await query(
            `SELECT ti.*, t.name as team_name, t.max_members
             FROM team_invitations ti
             JOIN teams t ON ti.team_id = t.id
             WHERE ti.token = $1 AND ti.status = 'pending' AND ti.expires_at > CURRENT_TIMESTAMP`,
            [token]
        );

        if (!invitation.rows[0]) {
            throw new Error('Invalid or expired invitation');
        }

        const invite = invitation.rows[0];

        // Check team capacity
        const memberCount = await query(
            `SELECT COUNT(*) as count FROM team_members WHERE team_id = $1 AND status = 'active'`,
            [invite.team_id]
        );

        if (parseInt(memberCount.rows[0].count) >= invite.max_members) {
            throw new Error(`Team is at maximum capacity`);
        }

        // Get the role from the pending team_members entry
        const pendingMember = await query(
            `SELECT role FROM team_members WHERE team_id = $1 AND email = $2 AND status = 'pending'`,
            [invite.team_id, invite.email]
        );
        
        const assignedRole = pendingMember.rows[0]?.role || 'editor'; // Fallback to editor if not found

        // Update the existing pending team_members entry to active
        const updateResult = await query(
            `UPDATE team_members 
             SET user_id = $1, status = 'active', joined_at = CURRENT_TIMESTAMP
             WHERE team_id = $2 AND email = $3 AND status = 'pending'
             RETURNING id`,
            [userId, invite.team_id, invite.email]
        );
        
        // If no pending entry was found (legacy invitations), create a new one
        if (updateResult.rows.length === 0) {
            await query(
                `INSERT INTO team_members (team_id, user_id, email, role, status, joined_at)
                 SELECT $1, $2, u.email, $3, 'active', CURRENT_TIMESTAMP
                 FROM users u WHERE u.id = $2`,
                [invite.team_id, userId, assignedRole]
            );
        }

        // Update user's current team
        await query(
            `UPDATE users SET current_team_id = $1 WHERE id = $2`,
            [invite.team_id, userId]
        );

        // Mark invitation as accepted
        await query(
            `UPDATE team_invitations SET status = 'accepted' WHERE id = $1`,
            [invite.id]
        );

        return { teamId: invite.team_id, teamName: invite.team_name };
    },

    // Remove team member
    async removeMember(teamId, memberUserId, removedByUserId) {
        // Check permissions
        const remover = await query(
            `SELECT role FROM team_members 
             WHERE team_id = $1 AND user_id = $2 AND status = 'active'`,
            [teamId, removedByUserId]
        );

        if (!remover.rows[0] || !['owner', 'admin'].includes(remover.rows[0].role)) {
            throw new Error('You do not have permission to remove members');
        }

        // Can't remove owner
        const member = await query(
            `SELECT role FROM team_members 
             WHERE team_id = $1 AND user_id = $2 AND status = 'active'`,
            [teamId, memberUserId]
        );

        if (member.rows[0]?.role === 'owner') {
            throw new Error('Cannot remove team owner');
        }

        // Remove member
        await query(
            `UPDATE team_members SET status = 'inactive' 
             WHERE team_id = $1 AND user_id = $2`,
            [teamId, memberUserId]
        );

        // Clear user's current team if this was their active team
        await query(
            `UPDATE users SET current_team_id = NULL 
             WHERE id = $1 AND current_team_id = $2`,
            [memberUserId, teamId]
        );

        return { success: true };
    },

    // Update team member role
    async updateMemberRole(teamId, memberId, newRole, updatedByUserId) {
        console.log('🔧 [TEAM SERVICE] updateMemberRole called:', {
            teamId,
            memberId,
            newRole,
            updatedByUserId
        });

        // Check permissions - only owners can update roles 
        console.log('🔍 [TEAM SERVICE] Checking updater permissions...');
        const updater = await query(
            `SELECT role FROM team_members 
             WHERE team_id = $1 AND user_id = $2 AND status = 'active'`,
            [teamId, updatedByUserId]
        );
        console.log('👤 [TEAM SERVICE] Updater result:', updater.rows);

        if (!updater.rows[0] || updater.rows[0].role !== 'owner') {
            console.log('❌ [TEAM SERVICE] Permission denied. Updater role:', updater.rows[0]?.role);
            throw new Error('Only team owners can modify member roles');
        }

        // Check if target member exists and is not owner (using member id instead of user_id)
        console.log('🔍 [TEAM SERVICE] Checking target member...');
        const member = await query(
            `SELECT role FROM team_members 
             WHERE team_id = $1 AND id = $2 AND status = 'active'`,
            [teamId, memberId]
        );
        console.log('🎯 [TEAM SERVICE] Target member result:', member.rows);

        if (!member.rows[0]) {
            console.log('❌ [TEAM SERVICE] Member not found');
            throw new Error('Member not found');
        }

        if (member.rows[0].role === 'owner') {
            console.log('❌ [TEAM SERVICE] Cannot change owner role');
            throw new Error('Cannot change owner role');
        }

        // Validate new role
        if (!['admin', 'editor', 'viewer'].includes(newRole)) {
            console.log('❌ [TEAM SERVICE] Invalid role:', newRole);
            throw new Error('Invalid role. Must be admin, editor, or viewer');
        }

        // Update member role (using member id instead of user_id)
        console.log('✏️ [TEAM SERVICE] Executing UPDATE query...');
        const updateResult = await query(
            `UPDATE team_members SET role = $1 
             WHERE team_id = $2 AND id = $3 RETURNING *`,
            [newRole, teamId, memberId]
        );
        console.log('✅ [TEAM SERVICE] Update result:', updateResult.rows);

        return { success: true };
    },

    // Get team's connected social accounts
    async getTeamSocialAccounts(teamId, userId) {
        // Verify user is team member
        const member = await query(
            `SELECT 1 FROM team_members 
             WHERE team_id = $1 AND user_id = $2 AND status = 'active'`,
            [teamId, userId]
        );

        if (!member.rows[0]) {
            throw new Error('You are not a member of this team');
        }

        const accounts = await query(`
            SELECT 
                sa.*,
                u.email as connected_by_email,
                u.name as connected_by_name
            FROM user_social_accounts sa
            JOIN users u ON sa.user_id = u.id
            WHERE sa.team_id = $1 AND sa.is_active = true
            ORDER BY sa.platform, sa.created_at DESC
        `, [teamId]);

        return accounts.rows;
    },

    // Delete team (owner only)
    async deleteTeam(ownerUserId) {
        // Verify requester is owner and get team id
        const teamResult = await query(
            `SELECT tm.team_id FROM team_members tm 
             WHERE tm.user_id = $1 AND tm.role = 'owner' AND tm.status = 'active'
             LIMIT 1`,
            [ownerUserId]
        );

        if (!teamResult.rows[0]) {
            throw new Error('Only team owners can delete the team');
        }

        const teamId = teamResult.rows[0].team_id;

        // Remove related data. No transaction helper here, so run sequentially.
        await query('DELETE FROM team_invitations WHERE team_id = $1', [teamId]);
        await query('DELETE FROM user_social_accounts WHERE team_id = $1', [teamId]);
        await query('DELETE FROM team_accounts WHERE team_id = $1', [teamId]);
        await query('UPDATE users SET current_team_id = NULL WHERE current_team_id = $1', [teamId]);
        await query('DELETE FROM team_members WHERE team_id = $1', [teamId]);
        await query('DELETE FROM teams WHERE id = $1', [teamId]);

        return { success: true };
    }
};