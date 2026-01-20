import { query } from './config/database.js';

async function checkInvitations() {
    try {
        const email = 'saraswatkanishk24@gmail.com';
        
        console.log(`\n📧 Checking invitations for: ${email}\n`);
        
        // Check team_invitations table
        const inviteResult = await query(`
            SELECT ti.id, ti.email, ti.invited_by, ti.status, ti.created_at,
                   u.name as invited_by_name, u.email as invited_by_email
            FROM team_invitations ti
            LEFT JOIN users u ON ti.invited_by = u.id
            WHERE ti.email = $1
            ORDER BY ti.created_at DESC
            LIMIT 5
        `, [email]);
        
        console.log('Invitations from team_invitations:');
        inviteResult.rows.forEach(inv => {
            console.log(`  - Status: ${inv.status}`);
            console.log(`    Invited by: ${inv.invited_by_name} (${inv.invited_by_email})`);
            console.log(`    Created: ${inv.created_at}`);
        });
        
        // Check team_members table for the role stored
        const memberResult = await query(`
            SELECT tm.role, tm.invited_by, tm.invited_at, tm.joined_at, tm.status,
                   u.name as invited_by_name
            FROM team_members tm
            LEFT JOIN users u ON tm.invited_by = u.id
            WHERE tm.email = $1
        `, [email]);
        
        console.log('\nTeam member record:');
        memberResult.rows.forEach(mem => {
            console.log(`  - Role: ${mem.role}`);
            console.log(`    Status: ${mem.status}`);
            console.log(`    Invited by: ${mem.invited_by_name}`);
            console.log(`    Invited at: ${mem.invited_at}`);
            console.log(`    Joined at: ${mem.joined_at}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkInvitations();
