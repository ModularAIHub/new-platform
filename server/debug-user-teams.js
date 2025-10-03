import { query } from './config/database.js';

(async () => {
  try {
    console.log('🔍 Debugging user-team relationships...');       

    // Get all users and their team memberships
    const result = await query(`
      SELECT 
        u.id as user_id,
        u.email,
        u.name,
        tm.team_id,
        tm.role,
        tm.status,
        t.name as team_name,
        tm.invited_at,
        tm.joined_at
      FROM users u
      LEFT JOIN team_members tm ON u.id = tm.user_id
      LEFT JOIN teams t ON tm.team_id = t.id
      WHERE u.email IN ('karmaakabane2504@gmail.com', 'saraswatkanishk24@gmail.com')
      ORDER BY u.email, tm.joined_at
    `);

    console.log('📊 User-Team Relationships:');
    console.log('=====================================');
    
    let currentUser = null;
    result.rows.forEach(row => {
      if (row.email !== currentUser) {
        currentUser = row.email;
        console.log(`\n👤 ${row.email} (${row.name}) - ID: ${row.user_id}`);
      }
      
      if (row.team_name) {
        console.log(`  └── Team: ${row.team_name} | Role: ${row.role} | Status: ${row.status}`);
        console.log(`      Joined: ${row.joined_at}`);
      } else {
        console.log(`  └── No team memberships found`);
      }
    });

    // Also check if there are multiple teams
    const teamCount = await query(`
      SELECT COUNT(DISTINCT team_id) as team_count
      FROM team_members 
      WHERE user_id IN (
        SELECT id FROM users 
        WHERE email IN ('karmaakabane2504@gmail.com', 'saraswatkanishk24@gmail.com')
      )
    `);

    console.log(`\n📈 Total unique teams these users belong to: ${teamCount.rows[0].team_count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();