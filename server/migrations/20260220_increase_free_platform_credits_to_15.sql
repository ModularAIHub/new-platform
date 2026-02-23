-- Increase free plan platform credits from 0 to 15
-- Free: Platform 15 / BYOK 50
-- Pro: Platform 100 / BYOK 180
-- Enterprise: Platform 500 / BYOK 1000

UPDATE users
SET
  plan_type = COALESCE(plan_type, 'free'),
  credits_remaining = CASE
    WHEN COALESCE(plan_type, 'free') = 'free' AND api_key_preference = 'platform' THEN 15
    WHEN COALESCE(plan_type, 'free') = 'free' AND api_key_preference = 'byok' THEN 50
    ELSE credits_remaining
  END,
  last_credit_reset = NOW(),
  updated_at = NOW()
WHERE api_key_preference IN ('platform', 'byok');

UPDATE teams t
SET
  credits_remaining = CASE
    WHEN COALESCE(u.plan_type, 'free') = 'free' AND u.api_key_preference = 'platform' THEN 15
    WHEN COALESCE(u.plan_type, 'free') = 'free' AND u.api_key_preference = 'byok' THEN 50
    WHEN u.plan_type = 'pro' AND u.api_key_preference = 'platform' THEN 100
    WHEN u.plan_type = 'pro' AND u.api_key_preference = 'byok' THEN 180
    WHEN u.plan_type = 'enterprise' AND u.api_key_preference = 'platform' THEN 500
    WHEN u.plan_type = 'enterprise' AND u.api_key_preference = 'byok' THEN 1000
    ELSE COALESCE(t.credits_remaining, 0)
  END,
  plan_type = COALESCE(u.plan_type, t.plan_type, 'pro'),
  last_credit_reset = NOW(),
  updated_at = NOW()
FROM users u
WHERE t.owner_id = u.id AND u.api_key_preference IN ('platform', 'byok');
