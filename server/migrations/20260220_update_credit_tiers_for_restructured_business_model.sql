-- Update credit tiers after SuiteGenie business model restructure
-- Free: Platform 15 / BYOK 75
-- Pro: Platform 100 / BYOK 200
-- Enterprise: Platform 500 / BYOK 1000

-- Safety: some environments may not have run 20260202_team_credits.sql yet.
-- Ensure required team credit columns exist before referencing them below.
ALTER TABLE teams ADD COLUMN IF NOT EXISTS credits_remaining INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS last_credit_reset TIMESTAMP;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'pro';

-- Normalize legacy null plans to free before tier-based credit updates.
UPDATE users
SET
  plan_type = 'free',
  updated_at = NOW()
WHERE plan_type IS NULL;

UPDATE users
SET
  credits_remaining = CASE
    WHEN plan_type = 'free' AND api_key_preference = 'platform' THEN 15
    WHEN plan_type = 'free' AND api_key_preference = 'byok' THEN 75
    WHEN plan_type = 'pro' AND api_key_preference = 'platform' THEN 100
    WHEN plan_type = 'pro' AND api_key_preference = 'byok' THEN 200
    WHEN plan_type = 'enterprise' AND api_key_preference = 'platform' THEN 500
    WHEN plan_type = 'enterprise' AND api_key_preference = 'byok' THEN 1000
    ELSE credits_remaining
  END,
  last_credit_reset = NOW(),
  updated_at = NOW()
WHERE api_key_preference IS NOT NULL;

UPDATE teams t
SET
  credits_remaining = CASE
    WHEN u.plan_type = 'pro' AND u.api_key_preference = 'platform' THEN 100
    WHEN u.plan_type = 'pro' AND u.api_key_preference = 'byok' THEN 200
    WHEN u.plan_type = 'enterprise' AND u.api_key_preference = 'platform' THEN 500
    WHEN u.plan_type = 'enterprise' AND u.api_key_preference = 'byok' THEN 1000
    ELSE COALESCE(t.credits_remaining, 0)
  END,
  plan_type = COALESCE(u.plan_type, t.plan_type, 'pro'),
  last_credit_reset = NOW(),
  updated_at = NOW()
FROM users u
WHERE t.owner_id = u.id;
