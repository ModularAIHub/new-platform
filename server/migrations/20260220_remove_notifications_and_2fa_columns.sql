-- Remove legacy 2FA columns from users
-- 2FA is not currently supported in SuiteGenie

ALTER TABLE users
  DROP COLUMN IF EXISTS two_factor_enabled,
  DROP COLUMN IF EXISTS two_factor_secret;
