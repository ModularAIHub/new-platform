import { pool } from './config/database.js';

async function testTeamAccounts() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Finding teams with members...');

    // Get a team that has members
    const teamResult = await client.query(`
      SELECT t.id, t.name, COUNT(tm.user_id) as member_count
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.status = 'active'
      GROUP BY t.id, t.name
      LIMIT 1
    `);
    
    if (teamResult.rows.length === 0) {
      console.log('❌ No teams with active members found');
      return;
    }

    const team = teamResult.rows[0];
    console.log(`✅ Found team: ${team.name} (${team.id}) with ${team.member_count} members`);

    // Check if this team has any social accounts
    const accountsResult = await client.query(`
      SELECT 
        id,
        account_id,
        account_username,
        account_display_name,
        platform,
        created_at
      FROM user_social_accounts 
      WHERE team_id = $1 AND is_active = true
      ORDER BY platform, created_at
    `, [team.id]);

    console.log(`\n📱 Team social accounts (${accountsResult.rows.length} total):`);
    if (accountsResult.rows.length === 0) {
      console.log('   No social accounts connected to this team yet');
    } else {
      accountsResult.rows.forEach(account => {
        console.log(`   ${account.platform}: @${account.account_username} (${account.account_display_name})`);
      });
    }

    // Test the API endpoint
    console.log(`\n🧪 Test the endpoint with: Invoke-WebRequest -Uri "http://localhost:3002/api/twitter/test-team-accounts?teamId=${team.id}" -Method GET`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    client.release();
  }
}

testTeamAccounts().catch(console.error);