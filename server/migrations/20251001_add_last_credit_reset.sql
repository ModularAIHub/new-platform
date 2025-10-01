-- Add last_credit_reset column to track monthly credit resets
-- Migration: 20251001_add_last_credit_reset.sql

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_credit_reset TIMESTAMP DEFAULT NULL;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_last_credit_reset ON users(last_credit_reset);

-- Update existing users to have a baseline reset timestamp
UPDATE users 
SET last_credit_reset = CURRENT_TIMESTAMP 
WHERE api_key_preference IS NOT NULL AND last_credit_reset IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.last_credit_reset IS 'Timestamp of last monthly credit reset';