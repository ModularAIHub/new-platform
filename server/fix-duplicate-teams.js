import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixDuplicateTeams() {
  try {
    const userId = '67e725bb-87e2-441d-8373-200dcd12214d'; // saraswatkanishk24@gmail.com
    const keepTeamId = '3bac84aa-a216-441c-b968-7f354410c429'; // First team (created 0.05s earlier)
    const deleteTeamId = '7248e6bd-f506-43df-9bcf-d3e110998212'; // Duplicate team
    
    console.log('\n=== FIXING DUPLICATE TEAMS ===\n');
    
    // Step 1: Update user's current_team_id to the team we're keeping
    console.log('1. Updating current_team_id to first team...');
    const updateUser = await pool.query(
      'UPDATE users SET current_team_id = $1 WHERE id = $2 RETURNING email, current_team_id',
      [keepTeamId, userId]
    );
    console.log('✅ Updated:', JSON.stringify(updateUser.rows[0], null, 2));
    
    // Step 2: Delete team_members entry for duplicate team
    console.log('\n2. Deleting team_members entry for duplicate team...');
    const deleteMember = await pool.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 RETURNING team_id',
      [deleteTeamId, userId]
    );
    console.log('✅ Deleted team_members:', deleteMember.rowCount, 'row(s)');
    
    // Step 3: Delete the duplicate team
    console.log('\n3. Deleting duplicate team...');
    const deleteTeam = await pool.query(
      'DELETE FROM teams WHERE id = $1 RETURNING id, name',
      [deleteTeamId]
    );
    console.log('✅ Deleted team:', JSON.stringify(deleteTeam.rows[0], null, 2));
    
    // Step 4: Verify final state
    console.log('\n4. Verifying final state...');
    const verification = await pool.query(
      `SELECT u.email, u.current_team_id, t.name as team_name, tm.role
       FROM users u
       LEFT JOIN teams t ON u.current_team_id = t.id
       LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    console.log('✅ Final state:', JSON.stringify(verification.rows[0], null, 2));
    
    console.log('\n✅ DUPLICATE TEAMS FIXED!\n');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

fixDuplicateTeams();
