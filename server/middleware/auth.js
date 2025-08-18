import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

const authenticateToken = async (req, res, next) => {
    try {
        // Get token from httpOnly cookie or Authorization header
        const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: 'Access token required',
                code: 'TOKEN_MISSING'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists in database
        const userResult = await query(
            'SELECT id, email, plan_type, credits_remaining, created_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        req.user = userResult.rows[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({
            error: 'Authentication error',
            code: 'AUTH_ERROR'
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
