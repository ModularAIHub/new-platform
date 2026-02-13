import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const DB_DEBUG = process.env.DB_DEBUG === 'true';
const IDLE_ERROR_LOG_THROTTLE_MS = Number.parseInt(
  process.env.DB_IDLE_ERROR_LOG_THROTTLE_MS || '30000',
  10
);
const DB_QUERY_RETRY_COUNT = Number.parseInt(process.env.DB_QUERY_RETRY_COUNT || '1', 10);
const DB_QUERY_RETRY_DELAY_MS = Number.parseInt(process.env.DB_QUERY_RETRY_DELAY_MS || '150', 10);

let hasLoggedConnect = false;
let lastIdleErrorAt = 0;

const dbDebug = (...args) => {
  if (DB_DEBUG) {
    console.log(...args);
  }
};


const throttledIdleError = (...args) => {
  const now = Date.now();
  if (now - lastIdleErrorAt < IDLE_ERROR_LOG_THROTTLE_MS) {
    return;
  }
  lastIdleErrorAt = now;
  console.error(...args);
};
const isTransientDbError = (error) => {
  const code = error?.code;
  const message = String(error?.message || '').toLowerCase();

  if (['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ECONNABORTED'].includes(code)) {
    return true;
  }

  return (
    message.includes('timeout') ||
    message.includes('connection terminated') ||
    message.includes('terminated unexpectedly') ||
    message.includes('could not connect')
  );
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const databaseUrl = process.env.DATABASE_URL || '';
const isSupabaseConnection = databaseUrl.includes('supabase.com');
const sslEnabled =
  process.env.DB_SSL === 'true' ||
  (process.env.DB_SSL !== 'false' && (process.env.NODE_ENV === 'production' || isSupabaseConnection));
const rejectUnauthorizedSsl = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
const dbSslCaRaw = process.env.DB_SSL_CA || '';
const dbSslCa = dbSslCaRaw ? dbSslCaRaw.replace(/\\n/g, '\n') : null;
const sslConfig = sslEnabled
  ? {
      rejectUnauthorized: rejectUnauthorizedSsl,
      ...(dbSslCa ? { ca: dbSslCa } : {}),
    }
  : false;
const dbConnectTimeoutMs = Number.parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '5000', 10);
const dbStatementTimeoutMs = Number.parseInt(process.env.DB_STATEMENT_TIMEOUT_MS || '10000', 10);
const dbQueryTimeoutMs = Number.parseInt(process.env.DB_QUERY_TIMEOUT_MS || '10000', 10);

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: dbConnectTimeoutMs,
  statement_timeout: dbStatementTimeoutMs,
  query_timeout: dbQueryTimeoutMs,
});

pool.on('connect', () => {
  if (hasLoggedConnect) return;
  hasLoggedConnect = true;
  dbDebug('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  // Non-fatal. Avoid crashing server on transient DNS/network pool errors.
  throttledIdleError('PostgreSQL idle client error (non-fatal):', err?.message || err);
});

async function query(text, params) {
  let attempt = 0;

  while (true) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      const shouldRetry = isTransientDbError(error) && attempt < DB_QUERY_RETRY_COUNT;
      if (!shouldRetry) {
        console.error('Database query error:', error?.message || error);
        throw error;
      }

      attempt += 1;
      console.error(`Database transient error (retry ${attempt}/${DB_QUERY_RETRY_COUNT}):`, error?.message || error);
      await sleep(DB_QUERY_RETRY_DELAY_MS);
    }
  }
}

export { query, pool };
