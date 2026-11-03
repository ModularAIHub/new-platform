-- Agency billing, webhook idempotency, and workspace draft store
-- Date: 2026-03-19

CREATE TABLE IF NOT EXISTS agency_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agency_accounts(id) ON DELETE SET NULL,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  razorpay_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  razorpay_customer_id VARCHAR(255),
  razorpay_plan_id VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'created',
  cancel_at_cycle_end BOOLEAN NOT NULL DEFAULT false,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  grace_until TIMESTAMP,
  last_payment_id VARCHAR(255),
  last_payment_at TIMESTAMP,
  last_payment_status VARCHAR(64),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_subscriptions_owner_unique
  ON agency_subscriptions(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_agency_subscriptions_agency_id
  ON agency_subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_subscriptions_status
  ON agency_subscriptions(status);

CREATE TABLE IF NOT EXISTS agency_billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  signature TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_billing_events_type
  ON agency_billing_events(event_type);

CREATE TABLE IF NOT EXISTS agency_workspace_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES agency_workspaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255),
  prompt TEXT,
  content TEXT NOT NULL,
  platform_targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  media_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  generation_source VARCHAR(64),
  generation_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMP,
  published_at TIMESTAMP,
  last_error TEXT,
  downstream_results JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_workspace_drafts_workspace_id
  ON agency_workspace_drafts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agency_workspace_drafts_status
  ON agency_workspace_drafts(status);
CREATE INDEX IF NOT EXISTS idx_agency_workspace_drafts_scheduled_for
  ON agency_workspace_drafts(scheduled_for);
