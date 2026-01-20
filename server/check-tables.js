import { query } from './config/database.js';

async function checkTables() {
    try {
        const result = await query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename
        `);
        
        console.log('\n📊 All database tables:');
        console.log(result.rows.map(r => r.tablename).join('\n'));
        
        // Check for team tables specifically
        const teamTables = result.rows.filter(r => r.tablename.includes('team'));
        console.log('\n🤝 Team-related tables:');
        console.log(teamTables.map(r => r.tablename).join('\n') || 'None found');
        
        // Check for workspace tables
        const workspaceTables = result.rows.filter(r => r.tablename.includes('workspace'));
        console.log('\n💼 Workspace-related tables:');
        console.log(workspaceTables.map(r => r.tablename).join('\n') || 'None found');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkTables();
