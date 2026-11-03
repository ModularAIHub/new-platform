-- Script to diagnose and fix team membership issues

-- 1. Find all teams for suitegenie1@gmail.com
SELECT 
    u.email,
    tm.team_id,
    t.name as team_name,
    tm.role,
    tm.status,
    tm.joined_at,
    u.current_team_id
FROM users u
JOIN team_members tm ON u.id = tm.user_id
JOIN teams t ON tm.team_id = t.id
WHERE u.email = 'suitegenie1@gmail.com';

-- 2. Find the correct team (Kanishk's team)
-- This finds teams where Kanishk is the owner
SELECT 
    t.id as team_id,
    t.name as team_name,
    owner.email as owner_email
FROM teams t
JOIN team_members owner_tm ON t.id = owner_tm.team_id AND owner_tm.role = 'owner'
JOIN users owner ON owner_tm.user_id = owner.id
WHERE owner.email = 'saraswatkanishk24@gmail.com';

-- 3. Update suitegenie1's current_team_id to Kanishk's team
-- REPLACE 'kanishk-team-id-here' with the actual team_id from query #2
UPDATE users 
SET current_team_id = 'kanishk-team-id-here'
WHERE email = 'suitegenie1@gmail.com';

-- 4. Optional: Delete suitegenie1's personal team if not needed
-- First, check what team they own
SELECT 
    t.id as team_id,
    t.name as team_name,
    COUNT(tm.id) as member_count
FROM teams t
JOIN team_members tm ON t.id = tm.team_id
WHERE tm.user_id = (SELECT id FROM users WHERE email = 'suitegenie1@gmail.com')
    AND tm.role = 'owner'
GROUP BY t.id, t.name;

-- If you want to delete their personal team (only if member_count = 1):
-- REPLACE 'suitegenie1-team-id-here' with the team_id from query above
-- DELETE FROM team_members WHERE team_id = 'suitegenie1-team-id-here';
-- DELETE FROM teams WHERE id = 'suitegenie1-team-id-here';

-- 5. Verify the fix
SELECT 
    u.email,
    u.current_team_id,
    t.name as current_team_name,
    owner.email as team_owner
FROM users u
LEFT JOIN teams t ON u.current_team_id = t.id
LEFT JOIN team_members owner_tm ON t.id = owner_tm.team_id AND owner_tm.role = 'owner'
LEFT JOIN users owner ON owner_tm.user_id = owner.id
WHERE u.email = 'suitegenie1@gmail.com';
