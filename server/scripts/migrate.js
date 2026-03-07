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
    version: 12,
    name: 'add_role_to_team_invitations',
    sql: `
      ALTER TABLE team_invitations
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'editor';

      UPDATE team_invitations
      SET role = 'editor'
      WHERE role IS NULL;
    `
  },
  {
    version: 13,
    name: 'drop_two_factor_columns',
    sql: `
      ALTER TABLE users
        DROP COLUMN IF EXISTS two_factor_enabled,
        DROP COLUMN IF EXISTS two_factor_secret;
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
  },
  // Pro Plan enhancements
  {
    version: 7,
    name: 'enhance_team_system_for_pro_plan',
    sql: `
      -- Add workspace system
      CREATE TABLE IF NOT EXISTS workspaces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL, -- for autoverse.com/w/workspace-name
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_type VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
      CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);

      -- Update team_members table to support 4 roles
      ALTER TABLE team_members 
          DROP CONSTRAINT IF EXISTS team_members_role_check;

      ALTER TABLE team_members 
          ADD CONSTRAINT team_members_role_check 
          CHECK (role IN ('owner', 'admin', 'editor', 'viewer', 'member'));

      -- Add workspace association to team members
      ALTER TABLE team_members 
          ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

      -- Add invited status tracking
      ALTER TABLE team_members 
          ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined'));

      ALTER TABLE team_members 
          ADD COLUMN IF NOT EXISTS invited_email VARCHAR(255);

      -- Add workspace association to users (current workspace)
      ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS current_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;

      -- Create social_accounts table to track the 8 account limit
      CREATE TABLE IF NOT EXISTS social_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL, -- 'linkedin', 'twitter', 'instagram'
        account_name VARCHAR(255) NOT NULL,
        account_id VARCHAR(255) NOT NULL,
        oauth_data JSONB, -- store OAuth tokens securely
        connected_by UUID NOT NULL REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_social_accounts_workspace ON social_accounts(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_social_accounts_unique ON social_accounts(workspace_id, platform, account_id) WHERE is_active = true;
    `
  },
  {
    version: 18,
    name: 'restructure_credit_tiers_and_cleanup_two_factor_columns',
    sql: `
      -- Safety: some environments may not have all prior credit migrations.
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_credit_reset TIMESTAMP;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS credits_remaining INTEGER DEFAULT 0;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS last_credit_reset TIMESTAMP;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'pro';

      -- Normalize legacy null plan types so free-tier users are explicitly marked.
      UPDATE users
      SET
        plan_type = 'free',
        updated_at = NOW()
      WHERE plan_type IS NULL;

      UPDATE users
      SET
        credits_remaining = CASE
          WHEN plan_type = 'free' AND api_key_preference = 'platform' THEN 15
          WHEN plan_type = 'free' AND api_key_preference = 'byok' THEN 50
          WHEN plan_type = 'pro' AND api_key_preference = 'platform' THEN 100
          WHEN plan_type = 'pro' AND api_key_preference = 'byok' THEN 180
          WHEN plan_type = 'agency' AND api_key_preference = 'platform' THEN 100
          WHEN plan_type = 'agency' AND api_key_preference = 'byok' THEN 180
          WHEN plan_type = 'enterprise' AND api_key_preference = 'platform' THEN 500
          WHEN plan_type = 'enterprise' AND api_key_preference = 'byok' THEN 1000
          ELSE credits_remaining
        END,
        last_credit_reset = NOW(),
        updated_at = NOW()
      WHERE api_key_preference IS NOT NULL;

      UPDATE teams t
      SET
        credits_remaining = CASE
          WHEN u.plan_type = 'pro' AND u.api_key_preference = 'platform' THEN 100
          WHEN u.plan_type = 'pro' AND u.api_key_preference = 'byok' THEN 180
          WHEN u.plan_type = 'agency' AND u.api_key_preference = 'platform' THEN 100
          WHEN u.plan_type = 'agency' AND u.api_key_preference = 'byok' THEN 180
          WHEN u.plan_type = 'enterprise' AND u.api_key_preference = 'platform' THEN 500
          WHEN u.plan_type = 'enterprise' AND u.api_key_preference = 'byok' THEN 1000
          ELSE COALESCE(t.credits_remaining, 0)
        END,
        plan_type = COALESCE(u.plan_type, t.plan_type, 'pro'),
        last_credit_reset = NOW(),
        updated_at = NOW()
      FROM users u
      WHERE t.owner_id = u.id;

      ALTER TABLE users
        DROP COLUMN IF EXISTS two_factor_enabled,
        DROP COLUMN IF EXISTS two_factor_secret;
    `
  },
  {
    version: 19,
    name: 'increase_free_platform_credits_to_15',
    sql: `
      UPDATE users
      SET
        plan_type = COALESCE(plan_type, 'free'),
        credits_remaining = CASE
          WHEN COALESCE(plan_type, 'free') = 'free' AND api_key_preference = 'platform' THEN 15
          WHEN COALESCE(plan_type, 'free') = 'free' AND api_key_preference = 'byok' THEN 50
          ELSE credits_remaining
        END,
        last_credit_reset = NOW(),
        updated_at = NOW()
      WHERE api_key_preference IN ('platform', 'byok');

      UPDATE teams t
      SET
        credits_remaining = CASE
          WHEN COALESCE(u.plan_type, 'free') = 'free' AND u.api_key_preference = 'platform' THEN 15
          WHEN COALESCE(u.plan_type, 'free') = 'free' AND u.api_key_preference = 'byok' THEN 50
          WHEN u.plan_type = 'pro' AND u.api_key_preference = 'platform' THEN 100
          WHEN u.plan_type = 'pro' AND u.api_key_preference = 'byok' THEN 180
          WHEN u.plan_type = 'agency' AND u.api_key_preference = 'platform' THEN 100
          WHEN u.plan_type = 'agency' AND u.api_key_preference = 'byok' THEN 180
          WHEN u.plan_type = 'enterprise' AND u.api_key_preference = 'platform' THEN 500
          WHEN u.plan_type = 'enterprise' AND u.api_key_preference = 'byok' THEN 1000
          ELSE COALESCE(t.credits_remaining, 0)
        END,
        plan_type = COALESCE(u.plan_type, t.plan_type, 'pro'),
        last_credit_reset = NOW(),
        updated_at = NOW()
      FROM users u
      WHERE t.owner_id = u.id AND u.api_key_preference IN ('platform', 'byok');
    `
  },
  {
    version: 20,
    name: 'agency_hub_foundation_phase_1',
    sql: `
      -- Expand users.plan_type constraint to include agency.
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_type_check;
      ALTER TABLE users
        ADD CONSTRAINT users_plan_type_check CHECK (plan_type IN ('free', 'pro', 'agency', 'enterprise'));

      -- Agency root account.
      CREATE TABLE IF NOT EXISTS agency_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
        seat_limit INTEGER NOT NULL DEFAULT 6,
        workspace_limit INTEGER NOT NULL DEFAULT 6,
        workspace_account_limit INTEGER NOT NULL DEFAULT 8,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_accounts_owner_id ON agency_accounts(owner_id);

      -- Agency members (agency-wide seat pool).
      CREATE TABLE IF NOT EXISTS agency_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agency_id UUID NOT NULL REFERENCES agency_accounts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed', 'declined')),
        invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
        invited_at TIMESTAMP DEFAULT NOW(),
        joined_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_members_agency_email_unique
        ON agency_members(agency_id, email)
        WHERE status IN ('pending', 'active');
      CREATE INDEX IF NOT EXISTS idx_agency_members_user_id ON agency_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_agency_members_agency_id ON agency_members(agency_id);

      -- Invitation token table for email onboarding.
      CREATE TABLE IF NOT EXISTS agency_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agency_id UUID NOT NULL REFERENCES agency_accounts(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
        invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_agency_invitations_agency_id ON agency_invitations(agency_id);
      CREATE INDEX IF NOT EXISTS idx_agency_invitations_email ON agency_invitations(email);
      CREATE INDEX IF NOT EXISTS idx_agency_invitations_token ON agency_invitations(token);

      -- Workspace per client.
      CREATE TABLE IF NOT EXISTS agency_workspaces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agency_id UUID NOT NULL REFERENCES agency_accounts(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        brand_name VARCHAR(255) NOT NULL,
        logo_url TEXT,
        timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_agency_workspaces_agency_id ON agency_workspaces(agency_id);
      CREATE INDEX IF NOT EXISTS idx_agency_workspaces_status ON agency_workspaces(status);

      -- Member assignments to workspaces (many-to-many).
      CREATE TABLE IF NOT EXISTS agency_workspace_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES agency_workspaces(id) ON DELETE CASCADE,
        agency_member_id UUID NOT NULL REFERENCES agency_members(id) ON DELETE CASCADE,
        assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(workspace_id, agency_member_id)
      );

      CREATE INDEX IF NOT EXISTS idx_agency_workspace_members_workspace_id ON agency_workspace_members(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_agency_workspace_members_member_id ON agency_workspace_members(agency_member_id);

      -- Attached existing connected accounts to workspace.
      CREATE TABLE IF NOT EXISTS agency_workspace_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES agency_workspaces(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        source_type VARCHAR(100) NOT NULL,
        source_id VARCHAR(255) NOT NULL,
        account_id VARCHAR(255),
        account_username VARCHAR(255),
        account_display_name VARCHAR(255),
        profile_image_url TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT true,
        attached_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_workspace_accounts_unique_active
        ON agency_workspace_accounts(workspace_id, source_type, source_id)
        WHERE is_active = true;
      CREATE INDEX IF NOT EXISTS idx_agency_workspace_accounts_workspace_id ON agency_workspace_accounts(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_agency_workspace_accounts_platform ON agency_workspace_accounts(platform);

      -- Immutable audit logs for critical actions.
      CREATE TABLE IF NOT EXISTS agency_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agency_id UUID NOT NULL REFERENCES agency_accounts(id) ON DELETE CASCADE,
        actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(255),
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_agency_audit_logs_agency_id ON agency_audit_logs(agency_id);
      CREATE INDEX IF NOT EXISTS idx_agency_audit_logs_created_at ON agency_audit_logs(created_at);
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
