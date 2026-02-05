import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

// Helper function to try refreshing token
const tryRefreshToken = async (req, res, refreshToken) => {
    try {
        console.log('[AUTH MIDDLEWARE] Attempting to verify refresh token...');
        
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        console.log('[AUTH MIDDLEWARE] Refresh token verified for userId:', decoded.userId);

        // Check if user exists
        const userResult = await query(
            'SELECT id, email, name, plan_type, credits_remaining, created_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            console.error('[AUTH MIDDLEWARE] User not found in database:', decoded.userId);
            return { success: false };
        }

        const user = userResult.rows[0];
        console.log('[AUTH MIDDLEWARE] User found:', user.email);

        // Generate new tokens
        const newAccessToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        const newRefreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
        );

        // Set new cookies
        setAuthCookies(res, newAccessToken, newRefreshToken);

        console.log('[AUTH MIDDLEWARE] Token refreshed successfully for user:', user.id);

        return { success: true, user };
    } catch (error) {
        console.error('[AUTH MIDDLEWARE] Token refresh failed:', error.message);
        console.error('[AUTH MIDDLEWARE] Error name:', error.name);
        console.error('[AUTH MIDDLEWARE] Error stack:', error.stack);
        console.error('[AUTH MIDDLEWARE] JWT_REFRESH_SECRET configured:', !!process.env.JWT_REFRESH_SECRET);
        return { success: false };
    }
};

// Helper to set auth cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = isProduction ? process.env.COOKIE_DOMAIN || '.suitegenie.in' : undefined;

    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
        ...(domain && { domain })
    };

    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log('[AUTH MIDDLEWARE] Cookies set with options:', { domain, secure: isProduction, sameSite: cookieOptions.sameSite });
};

// Main authentication middleware
export const authenticateToken = async (req, res, next) => {
    try {
        // Reduce logging noise
        // Get tokens from cookies
        let accessToken = req.cookies?.accessToken;
        const refreshToken = req.cookies?.refreshToken;

        // Fallback to Authorization header
        if (!accessToken) {
            const authHeader = req.headers['authorization'];
            accessToken = authHeader && authHeader.split(' ')[1];
        }

        // If no access token but have refresh token, try to refresh
        if (!accessToken && refreshToken) {
            const refreshResult = await tryRefreshToken(req, res, refreshToken);
            
            if (refreshResult.success) {
                req.user = refreshResult.user;
                return next();
            } else {
                return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
            }
        }

        // If no tokens at all
        if (!accessToken) {
            return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
        }

        // Verify access token
        let decoded;
        try {
            decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        } catch (jwtError) {
            // If token expired and we have refresh token, try to refresh
            if (jwtError.name === 'TokenExpiredError' && refreshToken) {
                const refreshResult = await tryRefreshToken(req, res, refreshToken);
                
                if (refreshResult.success) {
                    req.user = refreshResult.user;
                    return next();
                }
            }

            return res.status(401).json({ 
                error: 'Invalid or expired token', 
                code: jwtError.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN' 
            });
        }

        // Get user from database
        const userResult = await query(
            'SELECT id, email, name, plan_type, credits_remaining, created_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            console.error('[AUTH MIDDLEWARE] User not found:', decoded.userId);
            return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
        }

        req.user = userResult.rows[0];

        // Get team memberships
        try {
            const teamResult = await query(
                'SELECT team_id, role, status FROM team_members WHERE user_id = $1 AND status = $2',
                [req.user.id, 'active']
            );

            if (teamResult.rows.length > 0) {
                req.user.team_id = teamResult.rows[0].team_id;
                req.user.team_role = teamResult.rows[0].role;
                req.user.team_memberships = teamResult.rows;
            } else {
                req.user.team_id = null;
                req.user.team_role = null;
                req.user.team_memberships = [];
            }
        } catch (teamError) {
            console.error('[AUTH MIDDLEWARE] Error fetching team memberships:', teamError);
            req.user.team_id = null;
            req.user.team_role = null;
            req.user.team_memberships = [];
        }

        next();
    } catch (error) {
        console.error('[AUTH MIDDLEWARE] Unexpected error:', error);
        res.status(500).json({ error: 'Authentication error', code: 'AUTH_ERROR' });
    }
};

// Optional authentication middleware (doesn't fail if not authenticated)
export const optionalAuth = async (req, res, next) => {
    try {
        await authenticateToken(req, res, () => {
            next();
        });
    } catch (error) {
        // If authentication fails, continue without user
        req.user = null;
        next();
    }
};
