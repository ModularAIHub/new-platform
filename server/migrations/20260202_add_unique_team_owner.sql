-- Migration: Add unique constraint on owner_id to prevent duplicate team creation
-- Date: 2026-02-02
-- Purpose: Prevent race condition where user can create multiple teams via double-click

-- Add unique constraint so each user can only own ONE team
ALTER TABLE teams 
ADD CONSTRAINT teams_owner_id_unique UNIQUE (owner_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
