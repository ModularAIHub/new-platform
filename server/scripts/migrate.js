

import { query } from '../config/database.js';

async function runMigrations() {
  console.log('--- MIGRATION SCRIPT EXECUTION STARTED ---');
  try {
  console.log('🚀 Starting database migrations...');
  console.log('Using database:', process.env.DATABASE_URL);

    // Create users table
    const usersTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        plan_type VARCHAR(50) DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
        credits_remaining NUMERIC(10,2) DEFAULT 25,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('Running SQL for users table:', usersTableSQL);
    try {
  await query(usersTableSQL);
  console.log('✅ Users table created');
    } catch (err) {
      console.error('❌ Error creating users table:', err);
    }

    // Create api_keys table
    const apiKeysTableSQL = `
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL CHECK (provider IN ('openai', 'gemini', 'perplexity')),
        encrypted_key TEXT NOT NULL,
        key_name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, provider, key_name)
      )
    `;
    console.log('Running SQL for api_keys table:', apiKeysTableSQL);
    try {
  await query(apiKeysTableSQL);
  console.log('✅ API keys table created');
    } catch (err) {
      console.error('❌ Error creating api_keys table:', err);
    }

    // Create credit_transactions table
    const creditTransactionsTableSQL = `
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'usage')),
        credits_amount NUMERIC(10,2) NOT NULL,
        cost_in_rupees DECIMAL(10,2),
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        razorpay_signature TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('Running SQL for credit_transactions table:', creditTransactionsTableSQL);
    try {
  await query(creditTransactionsTableSQL);
  console.log('✅ Credit transactions table created');
    } catch (err) {
      console.error('❌ Error creating credit_transactions table:', err);
    }

    // Ensure columns support fractional credits
  await query(`
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'users' AND column_name = 'credits_remaining' AND data_type = 'integer'
            ) THEN
              ALTER TABLE users ALTER COLUMN credits_remaining TYPE NUMERIC(10,2) USING credits_remaining::numeric;
            END IF;
          END$$;
        `);
  await query(`
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'credit_transactions' AND column_name = 'credits_amount' AND data_type = 'integer'
            ) THEN
              ALTER TABLE credit_transactions ALTER COLUMN credits_amount TYPE NUMERIC(10,2) USING credits_amount::numeric;
            END IF;
          END$$;
        `);
  console.log('✅ Ensured fractional credit columns in DB');

    // Create team_members table (for Enterprise plan)
    const teamMembersTableSQL = `
      CREATE TABLE IF NOT EXISTS team_members (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'member')),
        invited_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, account_owner_id)
      )
    `;
    console.log('Running SQL for team_members table:', teamMembersTableSQL);
    try {
  await query(teamMembersTableSQL);
  console.log('✅ Team members table created');
    } catch (err) {
      console.error('❌ Error creating team_members table:', err);
    }

    // Create indexes for better performance
  await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  await query('CREATE INDEX IF NOT EXISTS idx_api_keys_user_provider ON api_keys(user_id, provider)');
  await query('CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_type ON credit_transactions(user_id, type)');
  await query('CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at)');
  await query('CREATE INDEX IF NOT EXISTS idx_team_members_owner ON team_members(account_owner_id)');

  console.log('✅ Database indexes created');

    // Add settings-related columns if missing
  await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'notification_email_enabled'
        ) THEN
          ALTER TABLE users ADD COLUMN notification_email_enabled BOOLEAN DEFAULT true;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'two_factor_enabled'
        ) THEN
          ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'two_factor_secret'
        ) THEN
          ALTER TABLE users ADD COLUMN two_factor_secret TEXT;
        END IF;
      END$$;
    `);
  console.log('✅ Settings columns ensured on users table');

  console.log('🎉 All migrations completed successfully!');
  console.log('--- MIGRATION SCRIPT EXECUTION ENDED ---');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}





// Always run migrations when this script is executed directly
const isDirect = process.argv[1].endsWith('migrate.js');
if (isDirect) {
  console.log('Running migrate.js as main module...');
  try {
    await runMigrations();
  } catch (err) {
    console.error('❌ Uncaught migration error:', err);
    process.exit(1);
  }
}
