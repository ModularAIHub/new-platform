-- Fix team_members table structure for Pro plan collaboration
-- Drop the existing table and recreate with correct structure
DROP TABLE IF EXISTS team_members CASCADE;

-- Recreate team members table with correct structure
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL,
    user_id UUID,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP,
    invited_by UUID
);

-- Add foreign key constraints
ALTER TABLE team_members ADD CONSTRAINT fk_team_members_team_id 
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE team_members ADD CONSTRAINT fk_team_members_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE team_members ADD CONSTRAINT fk_team_members_invited_by 
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;