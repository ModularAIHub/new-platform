import { query } from '../config/database.js';

const REQUIRED_TABLES = Object.freeze([
  'agency_accounts',
  'agency_members',
  'agency_invitations',
  'agency_workspaces',
  'agency_workspace_members',
  'agency_workspace_accounts',
  'agency_audit_logs',
  'agency_subscriptions',
  'agency_billing_events',
  'agency_workspace_drafts',
  'agency_workspace_settings',
]);

const REQUIRED_MIGRATION_VERSION = 23;
const AGENCY_SCHEMA_CACHE_TTL_MS = Number.parseInt(
  process.env.AGENCY_SCHEMA_CACHE_TTL_MS || '30000',
  10
);

let cachedStatus = null;

function buildSchemaError(message, metadata = {}) {
  const error = new Error(message);
  error.code = 'AGENCY_SCHEMA_MISSING';
  error.status = 503;
  error.metadata = metadata;
  return error;
}

function isFresh(entry) {
  return entry && Number.isFinite(entry.expiresAt) && entry.expiresAt > Date.now();
}

export async function getAgencySchemaStatus({ force = false } = {}) {
  if (!force && isFresh(cachedStatus)) {
    return cachedStatus.value;
  }

  const tableRows = await query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])`,
    [REQUIRED_TABLES]
  );

  const existingTables = new Set((tableRows.rows || []).map((row) => String(row.table_name || '').trim()));
  const missingTables = REQUIRED_TABLES.filter((tableName) => !existingTables.has(tableName));

  let migrationVersion = null;
  try {
    const migrationResult = await query(
      `SELECT MAX(version)::int AS version
       FROM migration_history`
    );
    migrationVersion = Number(migrationResult.rows[0]?.version || 0) || 0;
  } catch {
    migrationVersion = null;
  }

  const ready = missingTables.length === 0 && (migrationVersion === null || migrationVersion >= REQUIRED_MIGRATION_VERSION);
  const value = {
    ready,
    checkedAt: new Date().toISOString(),
    requiredMigrationVersion: REQUIRED_MIGRATION_VERSION,
    detectedMigrationVersion: migrationVersion,
    missingTables,
  };

  cachedStatus = {
    expiresAt: Date.now() + Math.max(1000, AGENCY_SCHEMA_CACHE_TTL_MS),
    value,
  };

  return value;
}

export async function ensureAgencySchemaReady(options = {}) {
  const status = await getAgencySchemaStatus(options);
  if (status.ready) return status;

  const message = status.missingTables.length > 0
    ? `Agency schema is not ready. Missing tables: ${status.missingTables.join(', ')}`
    : `Agency schema requires migration ${REQUIRED_MIGRATION_VERSION} or newer`;

  throw buildSchemaError(message, status);
}

export function invalidateAgencySchemaCache() {
  cachedStatus = null;
}

export { REQUIRED_MIGRATION_VERSION as AGENCY_REQUIRED_MIGRATION_VERSION, REQUIRED_TABLES as AGENCY_REQUIRED_TABLES };
