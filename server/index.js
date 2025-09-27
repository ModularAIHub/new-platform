import express from 'express';
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

// Security middleware
app.use(helmet());

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
        const allowedOrigins = [
            'https://suitegenie.in',
            'https://tweet.suitegenie.in',
            'https://api.suitegenie.in',
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5174',
            'http://localhost:3002',
            'http://localhost:5175'
        ];
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
