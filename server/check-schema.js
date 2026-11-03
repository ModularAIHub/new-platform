import { pool } from './config/database.js';

async function checkSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking user_social_accounts table schema...');

    const { rows } = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_social_accounts' 
      ORDER BY ordinal_position
    `);
    
    console.log('user_social_accounts columns:');
    rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });

    // Test if OAuth1 columns exist
    const oauth1TokenColumn = rows.find(row => row.column_name === 'oauth1_access_token');
    const oauth1SecretColumn = rows.find(row => row.column_name === 'oauth1_access_token_secret');
    
    if (!oauth1TokenColumn || !oauth1SecretColumn) {
      console.log('❌ OAuth1 columns missing - adding them...');
      
      await client.query(`
        ALTER TABLE user_social_accounts 
        ADD COLUMN IF NOT EXISTS oauth1_access_token TEXT,
        ADD COLUMN IF NOT EXISTS oauth1_access_token_secret TEXT
      `);
      
      console.log('✅ Added OAuth1 columns');
    } else {
      console.log('✅ OAuth1 columns exist');
    }

    // Check if table exists
    if (rows.length === 0) {
      console.log('❌ user_social_accounts table does not exist');
      return;
    }

    console.log('✅ Schema check completed successfully');

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  } finally {
    client.release();
  }
}

checkSchema().catch(console.error);