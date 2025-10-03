-- Fix role limits to implement team-wide 8 account limit
-- Date: 2025-10-02

-- Update role limits to reflect team-wide account management
-- Only owner and admin can connect accounts, but it's a shared pool of 8 for the entire team

UPDATE team_role_limits 
SET max_profile_connections = 8,
    can_invite_members = true,
    can_manage_team = true
WHERE role = 'owner';

UPDATE team_role_limits 
SET max_profile_connections = 8,
    can_invite_members = false,
    can_manage_team = false  
WHERE role = 'admin';

UPDATE team_role_limits 
SET max_profile_connections = 0,
    can_invite_members = false,
    can_manage_team = false
WHERE role = 'editor';

UPDATE team_role_limits 
SET max_profile_connections = 0,
    can_invite_members = false,
    can_manage_team = false
WHERE role = 'viewer';