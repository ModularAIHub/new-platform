import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

const DEFAULT_ACCESS_TOKEN_EXPIRES_IN = '15m';
const DEFAULT_REFRESH_TOKEN_EXPIRES_IN = '15d';
const DEFAULT_SESSION_COOKIE_MAX_AGE_MS = 15 * 24 * 60 * 60 * 1000;

const parseDurationToMs = (value, fallbackMs) => {
    const raw = String(value || '').trim();
    if (!raw) return fallbackMs;

    const numeric = Number(raw);
    if (Number.isFinite(numeric) && numeric > 0) {
        return Math.floor(numeric);
    }

    const match = raw.match(/^(\d+)\s*(ms|s|m|h|d|w)$/i);
    if (!match) return fallbackMs;

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const unitMs = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000,
    }[unit];

    return Number.isFinite(amount) && unitMs ? amount * unitMs : fallbackMs;
};

const getAccessTokenExpiresIn = () => process.env.JWT_EXPIRES_IN || DEFAULT_ACCESS_TOKEN_EXPIRES_IN;
const getRefreshTokenExpiresIn = () => process.env.JWT_REFRESH_EXPIRES_IN || DEFAULT_REFRESH_TOKEN_EXPIRES_IN;
const getSessionCookieMaxAgeMs = () =>
    parseDurationToMs(process.env.AUTH_SESSION_MAX_AGE || process.env.JWT_REFRESH_EXPIRES_IN, DEFAULT_SESSION_COOKIE_MAX_AGE_MS);

const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const AUTH_DEBUG = process.env.AUTH_DEBUG === 'true';
const AUTH_USER_CACHE_TTL_MS = parsePositiveInt(process.env.AUTH_USER_CACHE_TTL_MS, 300000);
const AUTH_TEAM_CACHE_TTL_MS = parsePositiveInt(process.env.AUTH_TEAM_CACHE_TTL_MS, 300000);
const AUTH_WARN_LOG_THROTTLE_MS = parsePositiveInt(process.env.AUTH_WARN_LOG_THROTTLE_MS, 30000);
const AUTH_USER_CACHE_MAX_SIZE = parsePositiveInt(process.env.AUTH_USER_CACHE_MAX_SIZE, 5000);
const AUTH_TEAM_CACHE_MAX_SIZE = parsePositiveInt(process.env.AUTH_TEAM_CACHE_MAX_SIZE, 5000);
const AUTH_WARN_LOG_CACHE_MAX_SIZE = parsePositiveInt(process.env.AUTH_WARN_LOG_CACHE_MAX_SIZE, 200);
const AUTH_CACHE_CLEANUP_INTERVAL_MS = parsePositiveInt(process.env.AUTH_CACHE_CLEANUP_INTERVAL_MS, 300000);

const userCache = new Map();
const teamCache = new Map();
const warnLogCache = new Map();

const isPositiveInt = (value) => Number.isInteger(value) && value > 0;

const evictOldestIfNeeded = (cache, key, maxSize) => {
    if (!isPositiveInt(maxSize)) return;
    if (cache.has(key)) return;

    while (cache.size >= maxSize) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey === undefined) {
            break;
        }
        cache.delete(oldestKey);
    }
};

const cleanupExpiringCache = (cache, now = Date.now()) => {
    for (const [key, entry] of cache.entries()) {
        if (!entry || !isPositiveInt(entry.expiresAt) || entry.expiresAt <= now) {
            cache.delete(key);
        }
    }
};

const cleanupWarnLogCache = (now = Date.now()) => {
    const cutoff = now - AUTH_WARN_LOG_THROTTLE_MS;
    for (const [key, lastLoggedAt] of warnLogCache.entries()) {
        if (!isPositiveInt(lastLoggedAt) || lastLoggedAt < cutoff) {
            warnLogCache.delete(key);
        }
    }
};

const authLog = (...args) => {
    if (AUTH_DEBUG) {
        console.log(...args);
    }
};

const shouldLogWarning = (key) => {
    const now = Date.now();
    const lastLoggedAt = warnLogCache.get(key) || 0;
    if (now - lastLoggedAt < AUTH_WARN_LOG_THROTTLE_MS) {
        return false;
    }
    evictOldestIfNeeded(warnLogCache, key, AUTH_WARN_LOG_CACHE_MAX_SIZE);
    warnLogCache.set(key, now);
    return true;
};

const authWarn = (key, ...args) => {
    if (AUTH_DEBUG || shouldLogWarning(key)) {
        console.warn(...args);
    }
};

const setCached = (cache, key, value, ttlMs, maxSize) => {
    evictOldestIfNeeded(cache, key, maxSize);
    cache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
    });
};

const getFreshCached = (cache, key) => {
    const cached = cache.get(key);
    if (!cached) return null;
    if (cached.expiresAt > Date.now()) return cached.value;
    cache.delete(key);
    return null;
};

const getStaleCached = (cache, key) => {
    const cached = cache.get(key);
    return cached?.value || null;
};

export const invalidateAuthUserCache = (userId) => {
    if (!userId) return;
    userCache.delete(String(userId));
};

if (isPositiveInt(AUTH_CACHE_CLEANUP_INTERVAL_MS)) {
    const cleanupTimer = setInterval(() => {
        const now = Date.now();
        cleanupExpiringCache(userCache, now);
        cleanupExpiringCache(teamCache, now);
        cleanupWarnLogCache(now);
    }, AUTH_CACHE_CLEANUP_INTERVAL_MS);

    if (typeof cleanupTimer.unref === 'function') {
        cleanupTimer.unref();
    }
}

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
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

const buildAccessTokenPayload = (user) => ({
    userId: user.id,
    email: user.email,
    name: user.name || '',
    planType: user.plan_type || null,
    creditsRemaining: toNumber(user.credits_remaining, 0),
});

const buildUserFromToken = (decoded) => ({
    id: decoded.userId,
    email: decoded.email || null,
    name: decoded.name || '',
    plan_type: decoded.planType || decoded.plan_type || null,
    credits_remaining: toNumber(decoded.creditsRemaining ?? decoded.credits_remaining, 0),
    created_at: null,
});

const setAuthCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN || '.suitegenie.in';
    const clientUrl = String(process.env.CLIENT_URL || '');
    const isLocalhost = clientUrl.includes('localhost') || clientUrl.includes('127.0.0.1') || cookieDomain === 'localhost';
    const useCrossSiteCookie = isProduction && !isLocalhost;
    const domain = useCrossSiteCookie ? cookieDomain : undefined;
    const sessionCookieMaxAgeMs = getSessionCookieMaxAgeMs();

    const cookieOptions = {
        httpOnly: true,
        secure: useCrossSiteCookie,
        sameSite: useCrossSiteCookie ? 'none' : 'lax',
        path: '/',
        ...(domain && { domain }),
    };

    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: sessionCookieMaxAgeMs,
    });

    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: sessionCookieMaxAgeMs,
    });
};

const attachTeamScope = async (user) => {
    if (!user?.id) return;

    const cachedTeam = getFreshCached(teamCache, user.id);
    if (cachedTeam) {
        user.team_id = cachedTeam.team_id;
        user.team_role = cachedTeam.team_role;
        user.team_memberships = cachedTeam.team_memberships;
        return;
    }

    try {
        const teamResult = await query(
            'SELECT team_id, role, status FROM team_members WHERE user_id = $1 AND status = $2',
            [user.id, 'active']
        );

        const teamData = {
            team_id: teamResult.rows[0]?.team_id || null,
            team_role: teamResult.rows[0]?.role || null,
            team_memberships: teamResult.rows || [],
        };

        setCached(teamCache, user.id, teamData, AUTH_TEAM_CACHE_TTL_MS, AUTH_TEAM_CACHE_MAX_SIZE);
        user.team_id = teamData.team_id;
        user.team_role = teamData.team_role;
        user.team_memberships = teamData.team_memberships;
    } catch (teamError) {
        const staleTeam = getStaleCached(teamCache, user.id);
        if (staleTeam) {
            user.team_id = staleTeam.team_id;
            user.team_role = staleTeam.team_role;
            user.team_memberships = staleTeam.team_memberships;
        } else {
            user.team_id = null;
            user.team_role = null;
            user.team_memberships = [];
        }

        authWarn(
            'auth_team_query_failed',
            '[AUTH MIDDLEWARE] Team membership query failed, using fallback:',
            teamError?.message || teamError
        );
    }
};

const tryRefreshToken = async (req, res, refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const userResult = await query(
            'SELECT id, email, name, plan_type, credits_remaining, created_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            authWarn('refresh_user_not_found', '[AUTH MIDDLEWARE] User not found while refreshing token:', decoded.userId);
            return { success: false };
        }

        const user = userResult.rows[0];
        setCached(userCache, user.id, user, AUTH_USER_CACHE_TTL_MS, AUTH_USER_CACHE_MAX_SIZE);

        const newAccessToken = jwt.sign(
            buildAccessTokenPayload(user),
            process.env.JWT_SECRET,
            { expiresIn: getAccessTokenExpiresIn() }
        );

        const newRefreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: getRefreshTokenExpiresIn() }
        );

        setAuthCookies(res, newAccessToken, newRefreshToken);
        return { success: true, user };
    } catch (error) {
        authWarn('refresh_failed', '[AUTH MIDDLEWARE] Token refresh failed:', error?.message || error);
        return { success: false };
    }
};

export const authenticateToken = async (req, res, next) => {
    try {
        let accessToken = req.cookies?.accessToken;
        const refreshToken = req.cookies?.refreshToken;

        if (!accessToken) {
            const authHeader = req.headers.authorization;
            accessToken = authHeader && authHeader.split(' ')[1];
        }

        if (!accessToken && refreshToken) {
            const refreshResult = await tryRefreshToken(req, res, refreshToken);
            if (refreshResult.success) {
                req.user = refreshResult.user;
                await attachTeamScope(req.user);
                return next();
            }
            return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
        }

        if (!accessToken) {
            return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
        }

        let decoded;
        try {
            decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError' && refreshToken) {
                const refreshResult = await tryRefreshToken(req, res, refreshToken);
                if (refreshResult.success) {
                    req.user = refreshResult.user;
                    await attachTeamScope(req.user);
                    return next();
                }
            }

            return res.status(401).json({
                error: 'Invalid or expired token',
                code: jwtError.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
            });
        }

        let user = getFreshCached(userCache, decoded.userId);
        let userSource = user ? 'cache' : 'db';

        if (!user) {
            try {
                const userResult = await query(
                    'SELECT id, email, name, plan_type, credits_remaining, created_at FROM users WHERE id = $1',
                    [decoded.userId]
                );

                if (userResult.rows.length === 0) {
                    return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
                }

                user = userResult.rows[0];
                setCached(userCache, user.id, user, AUTH_USER_CACHE_TTL_MS, AUTH_USER_CACHE_MAX_SIZE);
                userSource = 'db';
            } catch (userError) {
                if (!isTransientDbError(userError)) {
                    throw userError;
                }

                const staleUser = getStaleCached(userCache, decoded.userId);
                if (staleUser) {
                    user = staleUser;
                    userSource = 'stale-cache';
                } else {
                    user = buildUserFromToken(decoded);
                    userSource = 'token-fallback';
                }

                authWarn(
                    'auth_user_query_failed',
                    '[AUTH MIDDLEWARE] User query failed, using fallback user:',
                    userError?.message || userError
                );
            }
        }

        req.user = user;
        await attachTeamScope(req.user);
        authLog('[AUTH MIDDLEWARE] Auth resolved', { userId: req.user?.id, source: userSource });
        return next();
    } catch (error) {
        authWarn('auth_unexpected_error', '[AUTH MIDDLEWARE] Unexpected error:', error?.message || error);
        return res.status(500).json({ error: 'Authentication error', code: 'AUTH_ERROR' });
    }
};

export const optionalAuth = async (req, res, next) => {
    try {
        await authenticateToken(req, res, () => {
            next();
        });
    } catch (error) {
        req.user = null;
        next();
    }
};
