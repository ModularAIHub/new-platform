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
        
        // Clear refreshToken cookie to prevent repeated attempts
        const isDevelopment = process.env.NODE_ENV === 'development';
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: !isDevelopment,
            sameSite: isDevelopment ? 'lax' : 'none',
            path: '/',
            domain: isDevelopment ? undefined : '.suitegenie.in'
        });
        return { success: false };
    }
};

// Helper function to set auth cookies (copied from AuthController)
const setAuthCookies = (res, accessToken, refreshToken) => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const accessCookieOptions = {
        httpOnly: true,
        secure: !isDevelopment,
        sameSite: isDevelopment ? 'lax' : 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
    };

    const refreshCookieOptions = {
        httpOnly: true,
        secure: !isDevelopment,
        sameSite: isDevelopment ? 'lax' : 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
    };

    if (!isDevelopment) {
        accessCookieOptions.domain = '.suitegenie.in';
        refreshCookieOptions.domain = '.suitegenie.in';
    }

    res.cookie('accessToken', accessToken, accessCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
};

const authenticateToken = async (req, res, next) => {
    try {
        // Get token from httpOnly cookie or Authorization header
        const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
        const refreshToken = req.cookies?.refreshToken;

        console.log('[AUTH MIDDLEWARE] Cookies received:', { 
            hasAccessToken: !!token, 
            hasRefreshToken: !!refreshToken,
            accessTokenStart: token ? token.substring(0, 20) + '...' : 'none',
            refreshTokenStart: refreshToken ? refreshToken.substring(0, 20) + '...' : 'none'
        });

        if (!token) {
            // Check if refresh token exists for automatic refresh
            if (refreshToken) {
                console.log('[AUTH MIDDLEWARE] No access token, trying refresh...');
                const refreshResult = await tryRefreshToken(req, res, refreshToken);
                if (refreshResult.success) {
                    console.log('[AUTH MIDDLEWARE] Refresh successful, user set');
                    req.user = refreshResult.user;
                    return next();
                }
                console.log('[AUTH MIDDLEWARE] Refresh failed');
            }
            
            return res.status(401).json({
                error: 'Access token required',
                code: 'TOKEN_MISSING'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists in database
        const userResult = await query(
            'SELECT id, email, name, plan_type, credits_remaining, created_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

    req.user = userResult.rows[0];
    console.log('[AUTH MIDDLEWARE] req.user set:', req.user);
    next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            // Try to refresh token using refresh token
            const refreshToken = req.cookies?.refreshToken;
            if (refreshToken) {
                console.log('[AUTH MIDDLEWARE] Access token expired, trying refresh...');
                const refreshResult = await tryRefreshToken(req, res, refreshToken);
                if (refreshResult.success) {
                    console.log('[AUTH MIDDLEWARE] Refresh successful after expiry, user set');
                    req.user = refreshResult.user;
                    return next();
                }
                console.log('[AUTH MIDDLEWARE] Refresh failed after expiry');
            }
            
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
            'SELECT id, email, name, plan_type, credits_remaining, created_at FROM users WHERE id = $1',
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
