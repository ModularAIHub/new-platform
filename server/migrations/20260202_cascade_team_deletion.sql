-- Migration: Add CASCADE constraints for team deletion
-- Date: 2026-02-02
-- Purpose: Ensure when a team is deleted, all related data is automatically cleaned up

-- Add ON DELETE CASCADE for team_members
ALTER TABLE team_members 
DROP CONSTRAINT IF EXISTS team_members_team_id_fkey,
ADD CONSTRAINT team_members_team_id_fkey 
  FOREIGN KEY (team_id) 
  REFERENCES teams(id) 
  ON DELETE CASCADE;

-- Add ON DELETE CASCADE for team_invitations
ALTER TABLE team_invitations 
DROP CONSTRAINT IF EXISTS team_invitations_team_id_fkey,
ADD CONSTRAINT team_invitations_team_id_fkey 
  FOREIGN KEY (team_id) 
  REFERENCES teams(id) 
  ON DELETE CASCADE;

-- Add ON DELETE SET NULL for user_social_accounts (disconnect, don't delete accounts)
ALTER TABLE user_social_accounts 
DROP CONSTRAINT IF EXISTS user_social_accounts_team_id_fkey,
ADD CONSTRAINT user_social_accounts_team_id_fkey 
  FOREIGN KEY (team_id) 
  REFERENCES teams(id) 
  ON DELETE SET NULL;

-- Add ON DELETE SET NULL for users.current_team_id
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_current_team_id_fkey,
ADD CONSTRAINT users_current_team_id_fkey 
  FOREIGN KEY (current_team_id) 
  REFERENCES teams(id) 
  ON DELETE SET NULL;

-- Note: team_accounts will cascade delete automatically when references are added
