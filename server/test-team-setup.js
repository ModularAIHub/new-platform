import { query } from './config/database.js';

async function testTeamSetup() {
    try {
        console.log('\n🧪 Testing Team Setup\n');
        
        // 1. Check if teams table exists and has data
        console.log('1️⃣ Checking teams table...');
        const teamsResult = await query('SELECT COUNT(*) as count FROM teams');
        console.log(`   ✅ Teams table exists. Total teams: ${teamsResult.rows[0].count}`);
        
        // 2. Check if team_members table exists
        console.log('\n2️⃣ Checking team_members table...');
        const membersResult = await query('SELECT COUNT(*) as count FROM team_members');
        console.log(`   ✅ Team_members table exists. Total members: ${membersResult.rows[0].count}`);
        
        // 3. Check if team_invitations table exists
        console.log('\n3️⃣ Checking team_invitations table...');
        const invitesResult = await query('SELECT COUNT(*) as count FROM team_invitations');
        console.log(`   ✅ Team_invitations table exists. Total invitations: ${invitesResult.rows[0].count}`);
        
        // 4. Check if team_role_permissions exists
        console.log('\n4️⃣ Checking team_role_permissions table...');
        const permsResult = await query('SELECT role, COUNT(*) as count FROM team_role_permissions GROUP BY role');
        console.log('   ✅ Team_role_permissions table exists:');
        permsResult.rows.forEach(row => {
            console.log(`      - ${row.role}: ${row.count} permissions`);
        });
        
        // 5. Check if team_role_limits exists
        console.log('\n5️⃣ Checking team_role_limits table...');
        const limitsResult = await query('SELECT * FROM team_role_limits LIMIT 5');
        console.log('   ✅ Team_role_limits table exists:');
        limitsResult.rows.forEach(row => {
            console.log(`      - ${row.role}:`, row);
        });
        
        // 6. Check if teams have the required columns
        console.log('\n6️⃣ Checking teams table schema...');
        const schemaResult = await query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'teams'
            ORDER BY ordinal_position
        `);
        console.log('   ✅ Teams table columns:');
        schemaResult.rows.forEach(row => {
            console.log(`      - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
        });
        
        console.log('\n✅ All team infrastructure is set up correctly!\n');
        
        // 7. Check for any Pro users who might want to use teams
        console.log('7️⃣ Checking Pro users...');
        const proUsersResult = await query(`SELECT id, email, name, plan_type FROM users WHERE plan_type IN ('pro', 'enterprise')`);
        console.log(`   Found ${proUsersResult.rows.length} Pro/Enterprise users:`);
        proUsersResult.rows.forEach(user => {
            console.log(`      - ${user.email} (${user.name}) - ${user.plan_type}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testTeamSetup();
