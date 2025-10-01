import { query, pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class WorkspaceController {
    // Create a new workspace (Pro+ users only)
    static async create(req, res) {
        try {
            const { name, slug } = req.body;
            
            // Check if user has Pro+ plan
            const userResult = await query('SELECT plan_type FROM users WHERE id = $1', [req.user.id]);
            const userPlan = userResult.rows[0]?.plan_type;
            
            if (!userPlan || userPlan === 'free') {
                return res.status(403).json({ 
                    error: 'Workspace creation requires Pro plan or higher',
                    code: 'PLAN_UPGRADE_REQUIRED' 
                });
            }

            // Validate slug format (alphanumeric and hyphens only)
            if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
                return res.status(400).json({ 
                    error: 'Workspace URL can only contain letters, numbers, and hyphens',
                    code: 'INVALID_SLUG' 
                });
            }

            // Check if slug is available
            const existingSlug = await query('SELECT id FROM workspaces WHERE slug = $1', [slug]);
            if (existingSlug.rows.length > 0) {
                return res.status(400).json({ 
                    error: 'This workspace URL is already taken',
                    code: 'SLUG_TAKEN' 
                });
            }

            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                
                // Create workspace
                const workspaceResult = await client.query(
                    `INSERT INTO workspaces (name, slug, owner_id, plan_type, created_at, updated_at) 
                     VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
                    [name, slug, req.user.id, userPlan]
                );
                
                const workspace = workspaceResult.rows[0];
                
                // Add owner as team member
                await client.query(
                    `INSERT INTO team_members (user_id, account_owner_id, workspace_id, role, status, invited_at) 
                     VALUES ($1, $2, $3, 'owner', 'accepted', NOW())`,
                    [req.user.id, req.user.id, workspace.id]
                );
                
                // Set as user's current workspace
                await client.query(
                    'UPDATE users SET current_workspace_id = $1 WHERE id = $2',
                    [workspace.id, req.user.id]
                );
                
                await client.query('COMMIT');
                
                res.status(201).json({
                    message: 'Workspace created successfully',
                    workspace: {
                        id: workspace.id,
                        name: workspace.name,
                        slug: workspace.slug,
                        url: `autoverse.com/w/${workspace.slug}`,
                        plan_type: workspace.plan_type,
                        created_at: workspace.created_at
                    }
                });
                
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
            
        } catch (error) {
            console.error('Create workspace error:', error);
            res.status(500).json({ 
                error: 'Failed to create workspace', 
                code: 'WORKSPACE_CREATE_ERROR' 
            });
        }
    }

    // Get user's workspaces
    static async list(req, res) {
        try {
            const result = await query(`
                SELECT w.*, tm.role 
                FROM workspaces w
                JOIN team_members tm ON w.id = tm.workspace_id
                WHERE tm.user_id = $1 AND tm.status = 'accepted'
                ORDER BY w.created_at DESC
            `, [req.user.id]);
            
            const workspaces = result.rows.map(row => ({
                id: row.id,
                name: row.name,
                slug: row.slug,
                url: `autoverse.com/w/${row.slug}`,
                plan_type: row.plan_type,
                role: row.role,
                created_at: row.created_at
            }));
            
            res.json({ workspaces });
            
        } catch (error) {
            console.error('List workspaces error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch workspaces', 
                code: 'WORKSPACE_LIST_ERROR' 
            });
        }
    }

    // Switch to a different workspace
    static async switch(req, res) {
        try {
            const { workspaceId } = req.params;
            
            // Verify user has access to this workspace
            const accessResult = await query(`
                SELECT w.*, tm.role 
                FROM workspaces w
                JOIN team_members tm ON w.id = tm.workspace_id
                WHERE w.id = $1 AND tm.user_id = $2 AND tm.status = 'accepted'
            `, [workspaceId, req.user.id]);
            
            if (accessResult.rows.length === 0) {
                return res.status(403).json({ 
                    error: 'Access denied to this workspace',
                    code: 'WORKSPACE_ACCESS_DENIED' 
                });
            }
            
            // Update user's current workspace
            await query(
                'UPDATE users SET current_workspace_id = $1 WHERE id = $2',
                [workspaceId, req.user.id]
            );
            
            const workspace = accessResult.rows[0];
            res.json({
                message: 'Switched workspace successfully',
                workspace: {
                    id: workspace.id,
                    name: workspace.name,
                    slug: workspace.slug,
                    url: `autoverse.com/w/${workspace.slug}`,
                    role: workspace.role,
                    plan_type: workspace.plan_type
                }
            });
            
        } catch (error) {
            console.error('Switch workspace error:', error);
            res.status(500).json({ 
                error: 'Failed to switch workspace', 
                code: 'WORKSPACE_SWITCH_ERROR' 
            });
        }
    }

    // Get workspace details and team
    static async details(req, res) {
        try {
            const { workspaceId } = req.params;
            
            // Get workspace details
            const workspaceResult = await query(`
                SELECT w.*, u.name as owner_name
                FROM workspaces w
                JOIN users u ON w.owner_id = u.id
                WHERE w.id = $1
            `, [workspaceId]);
            
            if (workspaceResult.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'Workspace not found',
                    code: 'WORKSPACE_NOT_FOUND' 
                });
            }
            
            // Verify user has access
            const accessResult = await query(`
                SELECT role FROM team_members 
                WHERE workspace_id = $1 AND user_id = $2 AND status = 'accepted'
            `, [workspaceId, req.user.id]);
            
            if (accessResult.rows.length === 0) {
                return res.status(403).json({ 
                    error: 'Access denied to this workspace',
                    code: 'WORKSPACE_ACCESS_DENIED' 
                });
            }
            
            // Get team members
            const teamResult = await query(`
                SELECT tm.*, u.name, u.email, tm.role, tm.status, tm.invited_at
                FROM team_members tm
                LEFT JOIN users u ON tm.user_id = u.id
                WHERE tm.workspace_id = $1
                ORDER BY 
                    CASE tm.role 
                        WHEN 'owner' THEN 1 
                        WHEN 'admin' THEN 2 
                        WHEN 'editor' THEN 3 
                        WHEN 'viewer' THEN 4 
                        ELSE 5 
                    END,
                    tm.invited_at
            `, [workspaceId]);
            
            // Get social accounts count
            const accountsResult = await query(
                'SELECT COUNT(*) as count FROM social_accounts WHERE workspace_id = $1 AND is_active = true',
                [workspaceId]
            );
            
            const workspace = workspaceResult.rows[0];
            const userRole = accessResult.rows[0].role;
            
            res.json({
                workspace: {
                    id: workspace.id,
                    name: workspace.name,
                    slug: workspace.slug,
                    url: `autoverse.com/w/${workspace.slug}`,
                    plan_type: workspace.plan_type,
                    owner_name: workspace.owner_name,
                    created_at: workspace.created_at
                },
                userRole,
                team: teamResult.rows.map(member => ({
                    id: member.id,
                    name: member.name || member.invited_email,
                    email: member.email || member.invited_email,
                    role: member.role,
                    status: member.status,
                    invited_at: member.invited_at
                })),
                socialAccounts: {
                    connected: parseInt(accountsResult.rows[0].count),
                    limit: workspace.plan_type === 'pro' ? 8 : workspace.plan_type === 'enterprise' ? 25 : 2
                }
            });
            
        } catch (error) {
            console.error('Get workspace details error:', error);
            res.status(500).json({ 
                error: 'Failed to get workspace details', 
                code: 'WORKSPACE_DETAILS_ERROR' 
            });
        }
    }
}

export default WorkspaceController;