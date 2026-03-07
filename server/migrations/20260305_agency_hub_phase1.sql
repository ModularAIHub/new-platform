-- Agency Hub Phase-1 foundation
-- Date: 2026-03-05

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_type_check;
ALTER TABLE users
  ADD CONSTRAINT users_plan_type_check CHECK (plan_type IN ('free', 'pro', 'agency', 'enterprise'));

CREATE TABLE IF NOT EXISTS agency_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  seat_limit INTEGER NOT NULL DEFAULT 6,
  workspace_limit INTEGER NOT NULL DEFAULT 6,
  workspace_account_limit INTEGER NOT NULL DEFAULT 8,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_accounts_owner_id ON agency_accounts(owner_id);

CREATE TABLE IF NOT EXISTS agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agency_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed', 'declined')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_members_agency_email_unique
  ON agency_members(agency_id, email) WHERE status IN ('pending', 'active');
CREATE INDEX IF NOT EXISTS idx_agency_members_user_id ON agency_members(user_id);

CREATE TABLE IF NOT EXISTS agency_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agency_accounts(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agency_invitations_token ON agency_invitations(token);

CREATE TABLE IF NOT EXISTS agency_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agency_accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agency_workspaces_agency_id ON agency_workspaces(agency_id);

CREATE TABLE IF NOT EXISTS agency_workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES agency_workspaces(id) ON DELETE CASCADE,
  agency_member_id UUID NOT NULL REFERENCES agency_members(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, agency_member_id)
);

CREATE TABLE IF NOT EXISTS agency_workspace_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES agency_workspaces(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  source_type VARCHAR(100) NOT NULL,
  source_id VARCHAR(255) NOT NULL,
  account_id VARCHAR(255),
  account_username VARCHAR(255),
  account_display_name VARCHAR(255),
  profile_image_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  attached_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_workspace_accounts_unique_active
  ON agency_workspace_accounts(workspace_id, source_type, source_id)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS agency_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agency_accounts(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agency_audit_logs_agency_id ON agency_audit_logs(agency_id);
