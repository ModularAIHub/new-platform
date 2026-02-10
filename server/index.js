import express from 'express';
import Honeybadger from '@honeybadger-io/js';
import csurf from 'csurf';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

// Honeybadger configuration
Honeybadger.configure({
    apiKey: 'hbp_A8vjKimYh8OnyV8J3djwKrpqc4OniI3a4MJg', // Replace with your real key
    environment: process.env.NODE_ENV || 'development'
});

import apiRouter from './routes/index.js';
import { sanitizeBody, sanitizeQuery, sanitizeParams } from './middleware/sanitize.js';
import { errorHandler } from './middleware/errorHandler.js';

// Initialize Redis and sync worker
import redisClient from './config/redis.js';
import syncWorker from './workers/syncWorker.js';

const app = express();

// Honeybadger request handler (must be first middleware)
app.use(Honeybadger.requestHandler);

// Disable ETag to prevent 304 responses with cached CORS headers
app.set('etag', false);

// Trust the first proxy (needed for Railway and other cloud hosts)
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Request logger (lightweight) to surface failing calls
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.originalUrl} origin=${req.headers.origin || 'n/a'} referer=${req.headers.referer || 'n/a'}`);
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
const allowedOrigins = [
    'https://api.suitegenie.in',
    'https://apilinkedin.suitegenie.in',
    'https://apitweet.suitegenie.in',
    'https://suitegenie.in',
    'https://tweet.suitegenie.in',
    'https://linkedin.suitegenie.in',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list or is a subdomain of suitegenie.in
        let isAllowed = false;
        if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
            isAllowed = true;
        } else {
            try {
                const hostname = new URL(origin).hostname;
                if (hostname === 'suitegenie.in' || hostname.endsWith('.suitegenie.in')) {
                    isAllowed = true;
                }
            } catch (err) {
                isAllowed = false;
            }
        }

        if (isAllowed || process.env.NODE_ENV === 'development') {
            return callback(null, true); // Allow the origin
        }

        console.log('CORS blocked origin:', origin);
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
        let isAllowed = false;
        if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
            isAllowed = true;
        } else {
            try {
                const hostname = new URL(origin).hostname;
                if (hostname === 'suitegenie.in' || hostname.endsWith('.suitegenie.in')) {
                    isAllowed = true;
                }
            } catch (err) {
                isAllowed = false;
            }
        }

        if (isAllowed || process.env.NODE_ENV === 'development') {
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

// Skip CSRF for specific API routes that need external access
const csrfProtection = csurf({ 
    cookie: csrfCookieOptions,
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    skip: (req) => {
        // Skip CSRF for refresh token endpoint
        if (req.path === '/api/auth/refresh') return true;
        // Skip CSRF for SSO token generation (used by other services)
        if (req.path === '/api/team/sso-token') return true;
        // Skip CSRF for webhook endpoints
        if (req.path.startsWith('/api/webhooks/')) return true;
        // Skip CSRF for team social accounts endpoints in development
        if (process.env.NODE_ENV === 'development' && req.path.startsWith('/pro-team/social-accounts')) return true;
        return false;
    }
});
app.use(csrfProtection);

// CSRF token endpoint for frontend to fetch token
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

app.get('/', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        message: "Sab chal rha h theek thaak"
    });
});

// API routes
app.use('/api', apiRouter);

// Detailed CSRF error logging
app.use((err, req, res, next) => {
    if (err && err.code === 'EBADCSRFTOKEN') {
        const origin = req.headers.origin;
        if (origin) {
            let isAllowed = false;
            if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
                isAllowed = true;
            } else {
                try {
                    const hostname = new URL(origin).hostname;
                    if (hostname === 'suitegenie.in' || hostname.endsWith('.suitegenie.in')) {
                        isAllowed = true;
                    }
                } catch (e) {
                    isAllowed = false;
                }
            }
            if (isAllowed) {
                res.header('Access-Control-Allow-Origin', origin);
                res.header('Access-Control-Allow-Credentials', 'true');
            }
        }
        
        console.error('[CSRF ERROR]', {
            path: req.originalUrl,
            method: req.method,
            origin: req.headers.origin,
            referer: req.headers.referer,
            cookies: req.headers.cookie,
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
            let isAllowed = false;
            if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
                isAllowed = true;
            } else {
                try {
                    const hostname = new URL(origin).hostname;
                    if (hostname === 'suitegenie.in' || hostname.endsWith('.suitegenie.in')) {
                        isAllowed = true;
                    }
                } catch (e) {
                    isAllowed = false;
                }
            }
            if (isAllowed) {
                res.header('Access-Control-Allow-Origin', origin);
                res.header('Access-Control-Allow-Credentials', 'true');
            }
        }

        console.error('[REQUEST ERROR]', {
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
    console.log(`🚀 Autoverse Hub Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);

    try {
        // Initialize Redis

        // Upstash Redis does not require connect()
        // Test Upstash Redis connection
        try {
            const pong = await redisClient.ping();
            console.log('Redis ping:', pong);
        } catch (err) {
            console.error('Redis ping test failed:', err);
        }

        // Start sync worker
        syncWorker.start();

        console.log('✅ Redis and sync worker initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Redis or sync worker:', error);
    }
});


// Honeybadger error handler (must be after all routes/middleware)
app.use(Honeybadger.errorHandler);

export default app;

