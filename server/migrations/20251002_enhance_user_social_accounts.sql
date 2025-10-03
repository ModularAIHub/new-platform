-- Enhance user_social_accounts table for team-based connections
-- Date: 2025-10-02

-- Add foreign key constraints
ALTER TABLE user_social_accounts 
ADD CONSTRAINT fk_user_social_accounts_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_social_accounts 
ADD CONSTRAINT fk_user_social_accounts_team_id 
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_team_id ON user_social_accounts(team_id);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_user_id ON user_social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_platform ON user_social_accounts(platform);

-- Add unique constraint to prevent duplicate accounts per team
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_social_accounts_unique_team_platform_account 
ON user_social_accounts(team_id, platform, account_id) 
WHERE is_active = true AND team_id IS NOT NULL;

-- Add constraint to ensure either team_id or user_id is present (but prefer team_id for team connections)
ALTER TABLE user_social_accounts 
ADD CONSTRAINT chk_user_social_accounts_context 
CHECK (team_id IS NOT NULL OR user_id IS NOT NULL);

-- Add constraint to limit 8 accounts per team
-- This will be enforced in application logic for flexibility