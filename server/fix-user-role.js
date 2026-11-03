import { query } from './config/database.js';

async function fixUserRole() {
    try {
        const userId = '0e078cd3-c454-459a-b71b-b2195af0aeae';
        const email = 'saraswatkanishk24@gmail.com';
        
        console.log(`\n🔧 Fixing role for: ${email}\n`);
        
        // Update the role to admin
        const result = await query(`
            UPDATE team_members 
            SET role = 'admin'
            WHERE user_id = $1 AND email = $2 AND status = 'active' AND role = 'editor'
            RETURNING id, role, status
        `, [userId, email]);
        
        if (result.rows.length > 0) {
            console.log('✅ Updated role to admin:', result.rows[0]);
        } else {
            console.log('❌ No editor role found to update');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixUserRole();
