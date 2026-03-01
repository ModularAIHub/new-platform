import express from 'express';
import Honeybadger from '@honeybadger-io/js';
import csurf from 'csurf';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, './.env') });

// Honeybadger configuration
Honeybadger.configure({
    apiKey: process.env.HONEYBADGER_API_KEY || process.env.HONEYBADGER_KEY || '',
    environment: process.env.NODE_ENV || 'development'
});

import apiRouter from './routes/index.js';
import { sanitizeBody, sanitizeQuery, sanitizeParams } from './middleware/sanitize.js';
import { errorHandler } from './middleware/errorHandler.js';
import { query as dbQuery } from './config/database.js';

// Initialize Redis and sync worker
import redisClient from './config/redis.js';
import syncWorker, { runSyncTick } from './workers/syncWorker.js';

const app = express();
const REQUEST_DEBUG = process.env.REQUEST_DEBUG === 'true';
const SECURITY_DEBUG = process.env.SECURITY_DEBUG === 'true';

const reqLog = (...args) => {
    if (REQUEST_DEBUG) {
        console.log(...args);
    }
};

const securityLog = (...args) => {
    if (SECURITY_DEBUG) {
        console.error(...args);
    }
};

// Honeybadger request handler (must be first middleware)
app.use(Honeybadger.requestHandler);

// Disable ETag to prevent 304 responses with cached CORS headers
app.set('etag', false);

// Trust the first proxy (needed for Railway and other cloud hosts)
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const READINESS_CHECK_INTERVAL_MS = Number.parseInt(process.env.READINESS_CHECK_INTERVAL_MS || '30000', 10);

const platformRuntimeState = {
    database: {
        ok: false,
        lastCheckedAt: null,
        error: 'Database readiness not checked yet',
    },
    syncWorkerStarted: false,
};

const setDatabaseReady = () => {
    platformRuntimeState.database.ok = true;
    platformRuntimeState.database.lastCheckedAt = new Date().toISOString();
    platformRuntimeState.database.error = null;
};

const setDatabaseNotReady = (error) => {
    platformRuntimeState.database.ok = false;
    platformRuntimeState.database.lastCheckedAt = new Date().toISOString();
    platformRuntimeState.database.error = error?.message || String(error || 'Unknown database error');
};

const getPlatformReadinessPayload = () => ({
    status: platformRuntimeState.database.ok ? 'OK' : 'DEGRADED',
    live: true,
    ready: platformRuntimeState.database.ok,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
        database: { ...platformRuntimeState.database },
        syncWorker: {
            started: platformRuntimeState.syncWorkerStarted,
        },
    },
});

const refreshPlatformDatabaseReadiness = async () => {
    try {
        await dbQuery('SELECT 1');
        setDatabaseReady();
        return true;
    } catch (error) {
        setDatabaseNotReady(error);
        return false;
    }
};

const maybeStartSyncWorker = async () => {
    if (platformRuntimeState.syncWorkerStarted) {
        return;
    }

    if (!platformRuntimeState.database.ok) {
        reqLog('Sync worker startup skipped because database is not ready');
        return;
    }

    try {
        try {
            const pong = await redisClient.ping();
            reqLog('Redis ping:', pong);
        } catch (err) {
            console.error('Redis ping test failed:', err?.message || err);
        }

        syncWorker.start();
        platformRuntimeState.syncWorkerStarted = true;
        console.log('Redis and sync worker initialized');
    } catch (error) {
        console.error('Failed to initialize Redis or sync worker:', error?.message || error);
    }
};

const startPlatformReadinessLoop = () => {
    const intervalMs =
        Number.isFinite(READINESS_CHECK_INTERVAL_MS) && READINESS_CHECK_INTERVAL_MS > 0
            ? READINESS_CHECK_INTERVAL_MS
            : 30000;

    const timer = setInterval(async () => {
        await refreshPlatformDatabaseReadiness();
        await maybeStartSyncWorker();
    }, intervalMs);

    timer.unref?.();
};

// Request logger (lightweight) to surface failing calls
app.use((req, res, next) => {
    reqLog(`[REQ] ${req.method} ${req.originalUrl} origin=${req.headers.origin || 'n/a'} referer=${req.headers.referer || 'n/a'}`);
    next();
});

// Security middleware with CSP configuration for development
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:*", "https://api.twitter.com", "https://*.suitegenie.in", "https://suitegenie.in"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "https:", "data:"],
    },
  },
}));

// Rate limiting - only enable in production
if (process.env.NODE_ENV !== 'development') {
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // production limit
        message: 'Too many requests from this IP, please try again later.',
        skipFailedRequests: true,
        skipSuccessfulRequests: false,
    });
    app.use('/api/', limiter);
}

// CORS configuration for cross-subdomain support
const envAllowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

const allowedOrigins = [
    'https://api.suitegenie.in',
    'https://apilinkedin.suitegenie.in',
    'https://tweetapi.suitegenie.in',
    'https://metaapi.suitegenie.in',
    'https://suitegenie.in',
    'https://tweet.suitegenie.in',
    'https://linkedin.suitegenie.in',
    'https://linkedin.suitgenie.in',
    'https://meta.suitegenie.in',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3004',
    'http://localhost:3006',
    process.env.CLIENT_URL,
    ...envAllowedOrigins,
].filter(Boolean);

const isAllowedOrigin = (origin) => {
    if (!origin) return true;

    if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
        return true;
    }

    try {
        const hostname = new URL(origin).hostname;

        if (
            hostname === 'suitegenie.in' ||
            hostname.endsWith('.suitegenie.in') ||
            hostname === 'suitgenie.in' ||
            hostname.endsWith('.suitgenie.in')
        ) {
            return true;
        }

        if (process.env.ALLOW_VERCEL_PREVIEWS === 'true' && hostname.endsWith('.vercel.app')) {
            return true;
        }
    } catch (err) {
        return false;
    }

    return false;
};

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (isAllowedOrigin(origin) || process.env.NODE_ENV === 'development') {
            return callback(null, true); // Allow the origin
        }

        reqLog('CORS blocked origin:', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-CSRF-Token', 'X-Requested-With', 'X-Selected-Account-Id'],
    exposedHeaders: ['Set-Cookie'], // Allow client to see Set-Cookie if needed
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Explicitly set CORS headers as a fallback and for non-cors-middleware-covered routes
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        if (isAllowedOrigin(origin) || process.env.NODE_ENV === 'development') {
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Vary', 'Origin');
            // Prevent caching of CORS responses to avoid cross-origin cache pollution
            res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.header('Pragma', 'no-cache');
            res.header('Expires', '0');
        }
    }
    next();
});

// Handle preflight for all routes
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global input sanitization
app.use(sanitizeBody);
app.use(sanitizeQuery);
app.use(sanitizeParams);

// CSRF protection for state-changing requests
// Dynamic CSRF cookie domain logic (matches auth cookies)

const isProduction = process.env.NODE_ENV === 'production';
const isLocalhost = (
    process.env.DOMAIN === 'localhost' ||
    process.env.CLIENT_URL?.includes('localhost') ||
    process.env.NODE_ENV === 'development'
);
let csrfCookieOptions = {
    httpOnly: true,
    secure: false, // Always false for localhost/dev
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
};
// Only set domain in production and not localhost
if (isProduction && process.env.DOMAIN && !isLocalhost) {
    csrfCookieOptions.domain = '.' + process.env.DOMAIN;
    csrfCookieOptions.secure = true;
}

const csrfProtection = csurf({
    cookie: csrfCookieOptions,
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
});

const shouldSkipCsrf = (req) => {
    const requestPath = req.path || req.originalUrl || '';

    // Skip CSRF for refresh token endpoint used by downstream services
    if (requestPath === '/api/auth/refresh' || requestPath.startsWith('/api/auth/refresh?')) {
        return true;
    }

    // Skip CSRF for SSO token generation (used by other services)
    if (requestPath === '/api/team/sso-token' || requestPath.startsWith('/api/team/sso-token?')) {
        return true;
    }

    // Skip CSRF for webhook endpoints
    if (requestPath.startsWith('/api/webhooks/')) {
        return true;
    }

    // Skip CSRF for team social accounts endpoints in development
    if (process.env.NODE_ENV === 'development' && requestPath.startsWith('/api/pro-team/social-accounts')) {
        return true;
    }

    return false;
};

app.use((req, res, next) => {
    if (shouldSkipCsrf(req)) {
        return next();
    }
    return csrfProtection(req, res, (err) => {
        if (err && err.code === 'EBADCSRFTOKEN') {
            // CSRF token is invalid - clear it and send a new one
            securityLog('[CSRF] Invalid CSRF token detected, clearing cookie and generating new token');
            res.clearCookie('_csrf', csrfCookieOptions);
            // Try again with fresh CSRF
            return csrfProtection(req, res, next);
        }
        if (err) {
            return next(err);
        }
        next();
    });
});

// CSRF token endpoint for frontend to fetch token
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Health check endpoint
app.get('/health', (req, res) => {
    const payload = getPlatformReadinessPayload();
    res.status(200).json(payload);
});

app.get('/ready', (req, res) => {
    const payload = getPlatformReadinessPayload();
    res.status(payload.ready ? 200 : 503).json(payload);
});

app.get('/', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        message: 'SuiteGenie Platform API is running'
    });
});

// Vercel Cron trigger for the credit sync worker.
// Called every 10 minutes by Vercel (see server/vercel.json). Auth via CRON_SECRET.
// Must be BEFORE app.use('/api', apiRouter) so it bypasses auth middleware.
app.post('/api/cron/sync', async (req, res) => {
    const cronSecret = (process.env.CRON_SECRET || '').trim();
    const authHeader = req.headers['authorization'] || '';
    const providedToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!cronSecret || providedToken !== cronSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        await runSyncTick();
        return res.json({ ok: true });
    } catch (error) {
        console.error('[SyncCron] Tick failed:', error?.message || error);
        return res.status(500).json({ ok: false, error: error?.message || 'unknown_error' });
    }
});

// API routes
app.use('/api', apiRouter);

// Detailed CSRF error logging
app.use((err, req, res, next) => {
    if (err && err.code === 'EBADCSRFTOKEN') {
        const origin = req.headers.origin;
        if (origin) {
            if (isAllowedOrigin(origin) || process.env.NODE_ENV === 'development') {
                res.header('Access-Control-Allow-Origin', origin);
                res.header('Access-Control-Allow-Credentials', 'true');
            }
        }
        
        securityLog('[CSRF ERROR]', {
            path: req.originalUrl,
            method: req.method,
            origin: req.headers.origin,
            referer: req.headers.referer,
            csrfHeader: req.headers['x-csrf-token'],
        });
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    return next(err);
});

// Generic error logger (before custom error handler)
app.use((err, req, res, next) => {
    if (err) {
        const origin = req.headers.origin;
        if (origin) {
            if (isAllowedOrigin(origin) || process.env.NODE_ENV === 'development') {
                res.header('Access-Control-Allow-Origin', origin);
                res.header('Access-Control-Allow-Credentials', 'true');
            }
        }

        securityLog('[REQUEST ERROR]', {
            path: req.originalUrl,
            method: req.method,
            origin: req.headers.origin,
            status: err.status || err.statusCode,
            message: err.message,
            stack: err.stack,
        });
    }
    next(err);
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
    console.log(`Autoverse Hub Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Health check: http://localhost:${PORT}/health`);

    await refreshPlatformDatabaseReadiness();
    await maybeStartSyncWorker();
    startPlatformReadinessLoop();
});

// Honeybadger error handler (must be after all routes/middleware)
app.use(Honeybadger.errorHandler);

export default app;


