-- Migration: Create team_accounts table for team-wide social account management
-- Date: 2025-10-02

CREATE TABLE IF NOT EXISTS team_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    twitter_username VARCHAR(255) NOT NULL,
    twitter_display_name VARCHAR(255),
    twitter_user_id VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_accounts_team_id ON team_accounts(team_id);
CREATE INDEX IF NOT EXISTS idx_team_accounts_user_id ON team_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_team_accounts_twitter_user_id ON team_accounts(twitter_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_accounts_unique_team_twitter ON team_accounts(team_id, twitter_user_id) WHERE active = true;
