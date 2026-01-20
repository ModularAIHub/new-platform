import { query } from './config/database.js';

async function checkUserRole() {
    try {
        const email = 'saraswatkanishk24@gmail.com';
        
        console.log(`\n🔍 Checking role for: ${email}\n`);
        
        // Get user
        const userResult = await query('SELECT id, email, name, plan_type FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            console.log('❌ User not found');
            process.exit(1);
        }
        
        const user = userResult.rows[0];
        console.log('User:', user);
        
        // Get team membership
        const teamResult = await query(`
            SELECT tm.id, tm.role, tm.status, t.name as team_name, t.owner_id
            FROM team_members tm
            JOIN teams t ON tm.team_id = t.id
            WHERE tm.user_id = $1
        `, [user.id]);
        
        console.log('\n📋 Team Memberships:');
        teamResult.rows.forEach(tm => {
            console.log(`  - Team: ${tm.team_name}`);
            console.log(`    Role: ${tm.role}`);
            console.log(`    Status: ${tm.status}`);
            console.log(`    Is Owner: ${tm.owner_id === user.id ? 'Yes' : 'No'}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkUserRole();
