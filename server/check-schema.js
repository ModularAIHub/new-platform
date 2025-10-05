import { pool } from './config/database.js';

async function checkSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking credit_transactions table schema...');

    const { rows } = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'credit_transactions' 
      ORDER BY ordinal_position
    `);
    
    console.log('credit_transactions columns:');
    rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });

    // Test if service_name column exists
    const serviceNameColumn = rows.find(row => row.column_name === 'service_name');
    if (serviceNameColumn) {
      console.log('✅ service_name column exists');
    } else {
      console.log('❌ service_name column missing - adding it...');
      
      await client.query(`
        ALTER TABLE credit_transactions 
        ADD COLUMN IF NOT EXISTS service_name VARCHAR(100)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_credit_transactions_service 
        ON credit_transactions(service_name)
      `);
      
      console.log('✅ Added service_name column');
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema().catch(console.error);
