-- Migration: Enhance team system for Pro Plan
-- Add support for 4 team roles and workspace URLs

-- Add workspace system
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- for autoverse.com/w/workspace-name
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);

-- Update team_members table to support 4 roles
ALTER TABLE team_members 
    DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE team_members 
    ADD CONSTRAINT team_members_role_check 
    CHECK (role IN ('owner', 'admin', 'editor', 'viewer', 'member'));

-- Add workspace association to team members
ALTER TABLE team_members 
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add invited status tracking
ALTER TABLE team_members 
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined'));

ALTER TABLE team_members 
    ADD COLUMN IF NOT EXISTS invited_email VARCHAR(255);

-- Add workspace association to users (current workspace)
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS current_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;

-- Create social_accounts table to track the 8 account limit
CREATE TABLE IF NOT EXISTS social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'linkedin', 'twitter', 'instagram'
    account_name VARCHAR(255) NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    oauth_data JSONB, -- store OAuth tokens securely
    connected_by UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_workspace ON social_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_accounts_unique ON social_accounts(workspace_id, platform, account_id) WHERE is_active = true;