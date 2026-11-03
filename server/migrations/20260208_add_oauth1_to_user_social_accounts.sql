-- Migration: Add OAuth 1.0a columns to user_social_accounts for team Twitter accounts
-- Date: 2026-02-08

ALTER TABLE user_social_accounts
ADD COLUMN IF NOT EXISTS oauth1_access_token TEXT;

ALTER TABLE user_social_accounts
ADD COLUMN IF NOT EXISTS oauth1_access_token_secret TEXT;

-- Ensure columns are available for both team and personal Twitter accounts
-- No data migration needed, just schema update

-- Optionally, add index for faster lookup if needed
-- CREATE INDEX IF NOT EXISTS idx_user_social_accounts_oauth1 ON user_social_accounts(oauth1_access_token, oauth1_access_token_secret);
