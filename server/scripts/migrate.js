import { query } from '../config/database.js';
import crypto from 'crypto';

const migrations = [
  {
    version: 1,
    name: 'create_migration_history_table',
    sql: `
      CREATE TABLE IF NOT EXISTS migration_history (
        version INTEGER PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `
  },
  {
    version: 2,
    name: 'create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        plan_type VARCHAR(50) DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  credits_remaining NUMERIC(10,2) DEFAULT 0,
        notification_email_enabled BOOLEAN DEFAULT true,
        two_factor_enabled BOOLEAN DEFAULT false,
        two_factor_secret TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);
    `
  },
  {
    version: 4,
    name: 'create_credit_transactions_table',
    sql: `
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
        credits_amount NUMERIC(10,2) NOT NULL,
        cost_in_rupees DECIMAL(10,2),
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        razorpay_signature TEXT,
        description TEXT,
        service_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_type ON credit_transactions(user_id, type);
      CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
      CREATE INDEX IF NOT EXISTS idx_credit_transactions_service ON credit_transactions(service_name);
    `
  },
  {
    version: 5,
    name: 'create_team_members_table',
    sql: `
      CREATE TABLE IF NOT EXISTS team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'member')),
        invited_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, account_owner_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_team_members_owner ON team_members(account_owner_id);
      CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
    `
  },
  // BYOK migration
  {
    version: 6,
    name: 'byok_schema',
    sql: `
      -- BYOK: Add fields to users table
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='api_key_preference') THEN
          ALTER TABLE users ADD COLUMN api_key_preference VARCHAR(16);
        END IF;
        -- Remove NOT NULL and DEFAULT from api_key_preference if they exist
        BEGIN
          ALTER TABLE users ALTER COLUMN api_key_preference DROP NOT NULL;
        EXCEPTION WHEN others THEN NULL; END;
        BEGIN
          ALTER TABLE users ALTER COLUMN api_key_preference DROP DEFAULT;
        EXCEPTION WHEN others THEN NULL; END;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='byok_locked_until') THEN
          ALTER TABLE users ADD COLUMN byok_locked_until TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='byok_activated_at') THEN
          ALTER TABLE users ADD COLUMN byok_activated_at TIMESTAMP;
        END IF;
      END $$;

      -- BYOK: User API keys table
      CREATE TABLE IF NOT EXISTS user_api_keys (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(32) NOT NULL,
        key_name VARCHAR(64),
        encrypted_key TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_user_provider_active ON user_api_keys(user_id, provider) WHERE is_active;
    `
  }
];

async function runMigrations() {
  console.log('🚀 Starting Platform database migrations...');
  
  try {
    // Create migration history table first
    const migrationHistoryMigration = migrations.find(m => m.name === 'create_migration_history_table');
    if (migrationHistoryMigration) {
      console.log('Creating migration history table...');
      await query(migrationHistoryMigration.sql);
    }

    // Ensure credits_remaining always defaults to 0 for new users
    await query("ALTER TABLE users ALTER COLUMN credits_remaining SET DEFAULT 0;");

    // Get already executed migrations
    const { rows: executedMigrations } = await query(
      'SELECT version FROM migration_history ORDER BY version'
    );
    
    const executedVersions = executedMigrations.map(row => row.version);
    console.log('Already executed migrations:', executedVersions);

    // Run pending migrations in version order
    const sortedMigrations = migrations.sort((a, b) => a.version - b.version);
    
    for (const migration of sortedMigrations) {
      if (!executedVersions.includes(migration.version)) {
        console.log(`Running migration ${migration.version}: ${migration.name}`);
        
        try {
          await query('BEGIN');
          await query(migration.sql);
          await query(
            'INSERT INTO migration_history (version, name) VALUES ($1, $2)',
            [migration.version, migration.name]
          );
          await query('COMMIT');
          console.log(`✓ Migration ${migration.version} completed`);
        } catch (error) {
          await query('ROLLBACK');
          throw error;
        }
      } else {
        console.log(`⏭ Migration ${migration.version} already executed`);
      }
    }

    // After all migrations, set credits_remaining to 0 for users with no mode
    console.log('Resetting credits_remaining to 0 for users with no mode...');
    await query("UPDATE users SET credits_remaining = 0 WHERE api_key_preference IS NULL OR api_key_preference = '';\n");
    console.log('Done resetting credits for users with no mode.');

    console.log('🎉 All Platform migrations completed successfully!');

  } catch (error) {
    console.error('❌ Platform migration failed:', error);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (process.argv[1].endsWith('migrate.js')) {
  runMigrations()
    .then(() => {
      console.log('✅ Platform migrations finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Platform migration failed:', error);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    });
}

export { runMigrations };
