import { query } from './config/database.js';

async function checkTeamAccounts() {
    try {
        console.log('\n📊 Checking Team Accounts Structure\n');
        
        // 1. Check team_accounts table
        console.log('1️⃣ team_accounts table schema:');
        const schema1 = await query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'team_accounts'
            ORDER BY ordinal_position
        `);
        schema1.rows.forEach(c => {
            console.log(`   - ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? '(required)' : ''}`);
        });
        
        const count1 = await query('SELECT COUNT(*) FROM team_accounts');
        console.log(`   Total records: ${count1.rows[0].count}\n`);
        
        // 2. Check user_social_accounts table (team_id column)
        console.log('2️⃣ user_social_accounts table (for team accounts):');
        const schema2 = await query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'user_social_accounts'
            ORDER BY ordinal_position
        `);
        schema2.rows.forEach(c => {
            console.log(`   - ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? '(required)' : ''}`);
        });
        
        const count2 = await query('SELECT COUNT(*) FROM user_social_accounts WHERE team_id IS NOT NULL');
        console.log(`   Total team social accounts: ${count2.rows[0].count}\n`);
        
        // 3. Sample data
        console.log('3️⃣ Sample team social accounts:');
        const sample = await query('SELECT * FROM user_social_accounts WHERE team_id IS NOT NULL LIMIT 3');
        if (sample.rows.length > 0) {
            sample.rows.forEach(row => {
                console.log(`   - ${row.platform} | ${row.account_username} | team_id: ${row.team_id}`);
            });
        } else {
            console.log('   No team accounts found');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkTeamAccounts();
