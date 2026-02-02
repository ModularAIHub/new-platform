-- Migration: Add team_id to user_social_accounts for account separation
-- Date: 2026-02-02
-- Purpose: Separate personal accounts from team accounts

-- Add team_id to user_social_accounts (new-platform)
ALTER TABLE user_social_accounts ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE;

-- Add index for team account queries
CREATE INDEX IF NOT EXISTS idx_social_accounts_team ON user_social_accounts(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_social_accounts_personal ON user_social_accounts(user_id, team_id) WHERE team_id IS NULL;

-- Add comment
COMMENT ON COLUMN user_social_accounts.team_id IS 'If set, this is a team account; if NULL, personal account';
