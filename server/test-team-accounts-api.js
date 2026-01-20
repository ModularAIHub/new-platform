import { query } from './config/database.js';

async function testTeamAccounts() {
    try {
        console.log('\n🧪 Testing Team Accounts Endpoint\n');
        
        // Check what's in team_accounts table
        const teamAccountsResult = await query(`
            SELECT ta.*, t.name as team_name 
            FROM team_accounts ta
            JOIN teams t ON ta.team_id = t.id
            ORDER BY ta.updated_at DESC
            LIMIT 10
        `);
        
        console.log('1️⃣ Team Accounts in database:');
        teamAccountsResult.rows.forEach(acc => {
            console.log(`  - @${acc.twitter_username} (${acc.twitter_display_name})`);
            console.log(`    Team: ${acc.team_name}`);
            console.log(`    Team ID: ${acc.team_id}`);
            console.log(`    Active: ${acc.active}`);
        });
        
        // Check team members for the user
        const email = 'saraswatkanishk24@gmail.com';
        const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
        
        if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].id;
            console.log(`\n2️⃣ User ID for ${email}: ${userId}`);
            
            const teamMemberResult = await query(`
                SELECT tm.team_id, tm.role, t.name as team_name
                FROM team_members tm
                JOIN teams t ON tm.team_id = t.id
                WHERE tm.user_id = $1 AND tm.status = 'active'
            `, [userId]);
            
            console.log('\n3️⃣ User team memberships:');
            teamMemberResult.rows.forEach(tm => {
                console.log(`  - Team: ${tm.team_name}`);
                console.log(`    Team ID: ${tm.team_id}`);
                console.log(`    Role: ${tm.role}`);
            });
            
            // Test the actual query from team.js route
            if (teamMemberResult.rows.length > 0) {
                const teamId = teamMemberResult.rows[0].team_id;
                console.log(`\n4️⃣ Testing query for team ${teamId}:`);
                
                const accountsResult = await query(`
                    SELECT 
                        id,
                        twitter_username as username,
                        twitter_display_name as display_name,
                        twitter_user_id as account_id,
                        twitter_profile_image_url as profile_image_url,
                        active,
                        updated_at
                    FROM team_accounts
                    WHERE team_id = $1 AND active = true
                    ORDER BY updated_at DESC
                `, [teamId]);
                
                console.log(`  Found ${accountsResult.rows.length} accounts:`);
                accountsResult.rows.forEach(acc => {
                    console.log(`    - @${acc.username} (${acc.display_name})`);
                });
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testTeamAccounts();
