-- Add new roles and permissions to team system
-- This migration adds expanded role system with detailed permissions

-- First, migrate existing roles to new system
DO $$
BEGIN
    -- Update existing 'member' roles to 'editor' (most appropriate mapping)
    UPDATE team_members SET role = 'editor' WHERE role = 'member';
    
    -- Add check constraint for new roles
    ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
    ALTER TABLE team_members ADD CONSTRAINT team_members_role_check 
    CHECK (role IN ('owner', 'admin', 'editor', 'viewer'));
    
    RAISE NOTICE 'Migrated existing member roles and updated constraint to include owner, admin, editor, viewer';
END $$;

-- Create role permissions table to define what each role can do
CREATE TABLE IF NOT EXISTS team_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL,
    permission VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission)
);

-- Insert role permissions
INSERT INTO team_role_permissions (role, permission, description) VALUES
-- Owner permissions (full control)
('owner', 'manage_team', 'Can invite/remove members and change roles'),
('owner', 'connect_profiles', 'Can connect up to 8 social media profiles'),
('owner', 'create_content', 'Can create and edit content'),
('owner', 'schedule_posts', 'Can schedule and publish posts'),
('owner', 'view_analytics', 'Can view all analytics and reports'),
('owner', 'manage_billing', 'Can manage team billing and plan'),

-- Admin permissions (profile management + content)
('admin', 'connect_profiles', 'Can connect social media profiles'),
('admin', 'create_content', 'Can create and edit content'),
('admin', 'schedule_posts', 'Can schedule and publish posts'),
('admin', 'view_analytics', 'Can view all analytics and reports'),
('admin', 'manage_content', 'Can manage all team content'),

-- Editor permissions (content creation only)
('editor', 'create_content', 'Can create and edit content'),
('editor', 'schedule_posts', 'Can schedule posts'),
('editor', 'view_own_content', 'Can view own created content'),

-- Viewer permissions (read-only)
('viewer', 'view_analytics', 'Can view analytics and reports'),
('viewer', 'view_scheduled_posts', 'Can view scheduled posts'),
('viewer', 'view_content', 'Can view team content (read-only)')

ON CONFLICT (role, permission) DO NOTHING;

-- Create table to track profile connection limits per role
CREATE TABLE IF NOT EXISTS team_role_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL UNIQUE,
    max_profile_connections INTEGER DEFAULT 0,
    can_invite_members BOOLEAN DEFAULT FALSE,
    can_manage_team BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert role limits
INSERT INTO team_role_limits (role, max_profile_connections, can_invite_members, can_manage_team) VALUES
('owner', 8, TRUE, TRUE),
('admin', 8, FALSE, FALSE),
('editor', 2, FALSE, FALSE),
('viewer', 0, FALSE, FALSE)
ON CONFLICT (role) DO UPDATE SET
    max_profile_connections = EXCLUDED.max_profile_connections,
    can_invite_members = EXCLUDED.can_invite_members,
    can_manage_team = EXCLUDED.can_manage_team;

COMMENT ON TABLE team_role_permissions IS 'Defines what permissions each team role has';
COMMENT ON TABLE team_role_limits IS 'Defines limits and capabilities for each team role';