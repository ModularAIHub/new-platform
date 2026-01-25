-- Add role column to team_invitations to store invited role
ALTER TABLE team_invitations
ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'editor';

-- Backfill any existing rows without a role to editor
UPDATE team_invitations SET role = 'editor' WHERE role IS NULL;
