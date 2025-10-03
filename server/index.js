import express from 'express';
import csurf from 'csurf';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

// Initialize Redis and sync worker
import redisClient from './config/redis.js';
import syncWorker from './workers/syncWorker.js';

const app = express();

// Trust the first proxy (needed for Railway and other cloud hosts)
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Security middleware with CSP configuration for development
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:*", "https://api.twitter.com"],
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
app.use(cors({
    origin: function (origin, callback) {
        if (process.env.NODE_ENV === 'development') {
            // Allow all origins in development
            return callback(null, true);
        }
        // Explicitly allow SuiteGenie API subdomains
        const allowedOrigins = [
            'https://api.suitegenie.in',
            'https://apilinkedin.suitegenie.in',
            'https://apitweet.suitegenie.in',
            'https://suitegenie.in',
            'https://tweet.suitegenie.in',
            'https://linkedin.suitegenie.in',
        ];
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, origin);
        } else {
            console.log('CORS blocked origin:', origin);
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-CSRF-Token']
}));

// Body parsing middleware

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSRF protection for state-changing requests
// Dynamic CSRF cookie domain logic (matches auth cookies)
const isProduction = process.env.NODE_ENV === 'production';
const isLocalhost = process.env.DOMAIN === 'localhost' || process.env.CLIENT_URL?.includes('localhost');
let csrfCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
};
if (isProduction && process.env.DOMAIN && !isLocalhost) {
    csrfCookieOptions.domain = '.' + process.env.DOMAIN;
}

// Skip CSRF for specific API routes that need external access
const csrfProtection = csurf({ 
    cookie: csrfCookieOptions,
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    skip: (req) => {
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

export default app;
