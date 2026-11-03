-- Add trial window tracking used by plansController
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at
  ON users(trial_ends_at);
