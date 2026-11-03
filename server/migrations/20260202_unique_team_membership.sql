-- Migration: Prevent duplicate team memberships
-- Date: 2026-02-02
-- Purpose: Ensure one user can only have one membership per team

-- Add unique constraint on (team_id, email) combination
ALTER TABLE team_members 
ADD CONSTRAINT team_members_team_email_unique UNIQUE (team_id, email);

-- This prevents the same email from being added twice to the same team
