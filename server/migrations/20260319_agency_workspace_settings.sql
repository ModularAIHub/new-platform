-- Agency workspace settings for automation, approvals, and client intelligence

CREATE TABLE IF NOT EXISTS agency_workspace_settings (
  workspace_id UUID PRIMARY KEY REFERENCES agency_workspaces(id) ON DELETE CASCADE,
  profile_notes TEXT,
  competitor_targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  automation_enabled BOOLEAN NOT NULL DEFAULT false,
  require_admin_approval BOOLEAN NOT NULL DEFAULT true,
  auto_generate_twitter BOOLEAN NOT NULL DEFAULT true,
  auto_generate_linkedin BOOLEAN NOT NULL DEFAULT true,
  auto_generate_social BOOLEAN NOT NULL DEFAULT false,
  engagement_auto_reply BOOLEAN NOT NULL DEFAULT false,
  posting_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_workspace_settings_updated_at
  ON agency_workspace_settings(updated_at);

