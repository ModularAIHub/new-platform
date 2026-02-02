-- Migration: Add credit management to teams table
-- Date: 2026-02-02
-- Purpose: Give teams their own credit pool separate from owner's personal credits

-- Add credit fields to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS credits_remaining INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS last_credit_reset TIMESTAMP;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'pro'; -- Teams are Pro by default

-- Add comment for clarity
COMMENT ON COLUMN teams.credits_remaining IS 'Team credit pool, separate from owner personal credits';
COMMENT ON COLUMN teams.plan_type IS 'Plan type inherited from owner (pro/enterprise)';

-- Initialize existing teams with credits based on owner's plan
UPDATE teams t
SET 
  credits_remaining = CASE 
    WHEN u.plan_type = 'pro' AND u.api_key_preference = 'platform' THEN 150
    WHEN u.plan_type = 'pro' AND u.api_key_preference = 'byok' THEN 300
    WHEN u.plan_type = 'enterprise' AND u.api_key_preference = 'platform' THEN 500
    WHEN u.plan_type = 'enterprise' AND u.api_key_preference = 'byok' THEN 1000
    ELSE 150 -- Default to Pro+Platform if uncertain
  END,
  plan_type = COALESCE(u.plan_type, 'pro'),
  last_credit_reset = NOW()
FROM users u
WHERE t.owner_id = u.id;

-- Index for faster credit queries
CREATE INDEX IF NOT EXISTS idx_teams_credits ON teams(credits_remaining);
