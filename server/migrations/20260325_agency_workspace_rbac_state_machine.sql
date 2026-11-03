-- Agency workspace RBAC state machine foundation
-- Date: 2026-03-25

ALTER TABLE agency_workspace_members
  ADD COLUMN IF NOT EXISTS role VARCHAR(20);

UPDATE agency_workspace_members awm
SET role = am.role
FROM agency_members am
WHERE am.id = awm.agency_member_id
  AND (awm.role IS NULL OR awm.role <> am.role);

ALTER TABLE agency_workspace_members
  DROP CONSTRAINT IF EXISTS agency_workspace_members_role_check;

ALTER TABLE agency_workspace_members
  ADD CONSTRAINT agency_workspace_members_role_check
  CHECK (role IN ('owner', 'admin', 'editor', 'viewer'));

ALTER TABLE agency_workspace_members
  ALTER COLUMN role SET DEFAULT 'editor';

UPDATE agency_workspace_members
SET role = 'editor'
WHERE role IS NULL;

ALTER TABLE agency_workspace_members
  ALTER COLUMN role SET NOT NULL;

ALTER TABLE agency_workspace_drafts
  ADD COLUMN IF NOT EXISTS rejected_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

UPDATE agency_workspace_drafts
SET status = 'draft'
WHERE status IS NULL
   OR status NOT IN ('draft', 'pending_approval', 'approved', 'rejected', 'scheduled', 'published', 'failed', 'archived');

ALTER TABLE agency_workspace_drafts
  DROP CONSTRAINT IF EXISTS agency_workspace_drafts_status_check;

ALTER TABLE agency_workspace_drafts
  ADD CONSTRAINT agency_workspace_drafts_status_check
  CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'scheduled', 'published', 'failed', 'archived'));

CREATE INDEX IF NOT EXISTS idx_agency_workspace_drafts_reviewed_at
  ON agency_workspace_drafts(reviewed_at);
