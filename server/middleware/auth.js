import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

const authenticateToken = async (req, res, next) => {
    try {
        // Debug: Log cookies and headers
        console.log('[AUTH] Cookies received:', req.cookies);
        console.log('[AUTH] Authorization header:', req.headers.authorization);

        // Get token from httpOnly cookie or Authorization header
        const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
        console.log('[AUTH] Extracted accessToken:', token ? token.substring(0, 20) + '...' : null);

        if (!token) {
            console.warn('[AUTH] No accessToken found in cookies or headers');
            return res.status(401).json({
                error: 'Access token required',
                code: 'TOKEN_MISSING'
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('[AUTH] Token verified for userId:', decoded.userId);
        } catch (jwtError) {
            console.error('[AUTH] JWT verification failed:', jwtError.message);
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: 'Invalid token',
                    code: 'INVALID_TOKEN'
                });
            }
            return res.status(401).json({
                error: 'Token verification failed',
                code: 'TOKEN_VERIFY_ERROR',
                details: jwtError.message
            });
        }

        // Check if user still exists in database
        const userResult = await query(
            'SELECT id, email, plan_type, credits_remaining, created_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            console.warn('[AUTH] User not found for userId:', decoded.userId);
            return res.status(401).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        req.user = userResult.rows[0];
        next();
    } catch (error) {
        console.error('[AUTH] Middleware error:', error);
        return res.status(500).json({
            error: 'Authentication error',
            code: 'AUTH_ERROR',
            details: error?.message || error
        });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userResult = await query(
            'SELECT id, email, plan_type, credits_remaining, created_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        req.user = userResult.rows.length > 0 ? userResult.rows[0] : null;
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

export { authenticateToken, optionalAuth };
