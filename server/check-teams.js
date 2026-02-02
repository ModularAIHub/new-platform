import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTeams() {
  try {
    // Get user info
    const userResult = await pool.query(
      'SELECT id, email, current_team_id FROM users WHERE email = $1',
      ['saraswatkanishk24@gmail.com']
    );
    
    console.log('\n=== USER INFO ===');
    console.log(JSON.stringify(userResult.rows[0], null, 2));
    
    if (userResult.rows.length === 0) {
      console.log('User not found');
      await pool.end();
      return;
    }
    
    const userId = userResult.rows[0].id;
    
    // Get all teams for this user
    const teamsResult = await pool.query(
      `SELECT t.id, t.name, t.created_at, tm.role, tm.joined_at, tm.status
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1
       ORDER BY tm.joined_at`,
      [userId]
    );
    
    console.log('\n=== TEAMS ===');
    console.log(JSON.stringify(teamsResult.rows, null, 2));
    
    // Get social accounts for each team
    for (const team of teamsResult.rows) {
      const accountsResult = await pool.query(
        `SELECT id, platform, account_username, account_display_name, team_id, user_id
         FROM user_social_accounts
         WHERE team_id = $1`,
        [team.id]
      );
      console.log(`\n=== SOCIAL ACCOUNTS FOR TEAM ${team.name} (${team.id}) ===`);
      console.log(JSON.stringify(accountsResult.rows, null, 2));
    }
    
    // Check for personal accounts (team_id IS NULL)
    const personalAccountsResult = await pool.query(
      `SELECT id, platform, account_username, account_display_name, team_id, user_id
       FROM user_social_accounts
       WHERE user_id = $1 AND team_id IS NULL`,
      [userId]
    );
    console.log('\n=== PERSONAL ACCOUNTS (team_id IS NULL) ===');
    console.log(JSON.stringify(personalAccountsResult.rows, null, 2));
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkTeams();
