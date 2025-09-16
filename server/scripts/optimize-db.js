import { query } from '../config/database.js';

async function optimizeDatabase() {
  console.log('🔧 Starting Platform database optimization...');
  
  try {
    // Analyze table statistics
    console.log('📊 Analyzing table statistics...');
    await query('ANALYZE users');
    await query('ANALYZE credit_transactions');
    await query('ANALYZE team_members');
    console.log('✅ Table statistics updated');

    // Add missing indexes if needed
    console.log('🔍 Checking and creating additional indexes...');
    
    // Performance indexes for credit transactions
    await query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_transactions_user_created 
      ON credit_transactions(user_id, created_at DESC)
    `);
    
    await query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_transactions_type_created 
      ON credit_transactions(type, created_at DESC)
    `);

    // Performance indexes for API keys

    console.log('✅ Additional indexes created');

    // Vacuum and reindex for better performance
    console.log('🧹 Running VACUUM and REINDEX...');
    await query('VACUUM ANALYZE users');
    await query('VACUUM ANALYZE credit_transactions');
    await query('REINDEX TABLE users');
    await query('REINDEX TABLE credit_transactions');
    console.log('✅ Database maintenance completed');

    // Check table sizes
    console.log('📏 Checking table sizes...');
    const sizes = await query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);

    console.log('Table sizes:');
    sizes.rows.forEach(row => {
      console.log(`  ${row.tablename}: ${row.size}`);
    });

    console.log('🎉 Platform database optimization completed!');

  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    throw error;
  }
}

// Run if called directly
if (process.argv[1].endsWith('optimize-db.js')) {
  optimizeDatabase()
    .then(() => {
      console.log('✅ Optimization finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Optimization failed:', error);
      process.exit(1);
    });
}

export { optimizeDatabase };
