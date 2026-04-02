-- Add team context to credit transaction history for team-scoped usage
ALTER TABLE credit_transactions
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_credit_transactions_team_id
  ON credit_transactions(team_id);
