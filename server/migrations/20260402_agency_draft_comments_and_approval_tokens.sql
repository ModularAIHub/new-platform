CREATE TABLE IF NOT EXISTS agency_draft_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES agency_workspace_drafts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES agency_workspaces(id) ON DELETE CASCADE,
  author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('agency', 'client')),
  author_name VARCHAR(255),
  author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_draft_comments_draft_id
  ON agency_draft_comments(draft_id);
CREATE INDEX IF NOT EXISTS idx_agency_draft_comments_workspace_id
  ON agency_draft_comments(workspace_id);

CREATE TABLE IF NOT EXISTS agency_approval_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES agency_workspaces(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agency_accounts(id) ON DELETE CASCADE,
  token VARCHAR(512) NOT NULL UNIQUE,
  label VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_approval_tokens_workspace_id
  ON agency_approval_tokens(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agency_approval_tokens_token
  ON agency_approval_tokens(token);
