import { query } from './config/database.js';

async function checkTeamAccountsColumns() {
    try {
        console.log('\n📊 Checking team_accounts table structure\n');
        
        const result = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'team_accounts'
            ORDER BY ordinal_position
        `);
        
        console.log('Columns in team_accounts table:');
        result.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkTeamAccountsColumns();
