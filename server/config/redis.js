

import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config();

const REDIS_DEBUG = process.env.REDIS_DEBUG === 'true';
const REDIS_ERROR_LOG_THROTTLE_MS = Number.parseInt(process.env.REDIS_ERROR_LOG_THROTTLE_MS || '30000', 10);
let lastRedisErrorAt = 0;

function logRedisError(...args) {
    const now = Date.now();
    if (now - lastRedisErrorAt < REDIS_ERROR_LOG_THROTTLE_MS) {
        return;
    }
    lastRedisErrorAt = now;
    console.error(...args);
}

function logRedisDebug(...args) {
    if (REDIS_DEBUG) {
        console.log(...args);
    }
}

const client = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const redisClient = {
    // Credit operations
    async getCredits(userId) {
        try {
            const credits = await client.get(`credits:${userId}`);
            return credits ? parseFloat(credits) : null;
        } catch (error) {
            logRedisError('Upstash getCredits error:', error?.message || error);
            return null;
        }
    },

    async setCredits(userId, credits) {
        try {
            await client.set(`credits:${userId}`, credits.toString());
            return true;
        } catch (error) {
            logRedisError('Upstash setCredits error:', error?.message || error);
            return false;
        }
    },

    async deductCredits(userId, amount) {
        try {
            // Upstash supports INCRBYFLOAT
            const result = await client.incrbyfloat(`credits:${userId}`, -Math.abs(amount));
            return result;
        } catch (error) {
            logRedisError('Upstash deductCredits error:', error?.message || error);
            return null;
        }
    },

    async addCredits(userId, amount) {
        try {
            const result = await client.incrbyfloat(`credits:${userId}`, Math.abs(amount));
            return result;
        } catch (error) {
            logRedisError('Upstash addCredits error:', error?.message || error);
            return null;
        }
    },

    // Plan operations
    async getPlan(userId) {
        try {
            return await client.get(`plan:${userId}`);
        } catch (error) {
            logRedisError('Upstash getPlan error:', error?.message || error);
            return null;
        }
    },

    async setPlan(userId, plan) {
        try {
            await client.set(`plan:${userId}`, plan);
            return true;
        } catch (error) {
            logRedisError('Upstash setPlan error:', error?.message || error);
            return false;
        }
    },

    // Dirty users tracking
    async addDirtyUser(userId) {
        try {
            await client.sadd('dirty_users', userId);
            return true;
        } catch (error) {
            logRedisError('Upstash addDirtyUser error:', error?.message || error);
            return false;
        }
    },

    async getDirtyUsers() {
        try {
            return await client.smembers('dirty_users');
        } catch (error) {
            logRedisError('Upstash getDirtyUsers error:', error?.message || error);
            return [];
        }
    },

    async removeDirtyUser(userId) {
        try {
            await client.srem('dirty_users', userId);
            return true;
        } catch (error) {
            logRedisError('Upstash removeDirtyUser error:', error?.message || error);
            return false;
        }
    },

    // Health check
    async ping() {
        try {
            const result = await client.ping();
            logRedisDebug('Upstash ping result:', result);
            return result === 'PONG';
        } catch (error) {
            logRedisError('Upstash ping error:', error?.message || error);
            return false;
        }
    },

    // Generic Redis operations for OTP and other uses
    async get(key) {
        try {
            return await client.get(key);
        } catch (error) {
            logRedisError('Upstash get error:', error?.message || error);
            return null;
        }
    },

    async setEx(key, seconds, value) {
        try {
            // Upstash uses EXPIRE after SET
            await client.set(key, value);
            await client.expire(key, seconds);
            return true;
        } catch (error) {
            logRedisError('Upstash setEx error:', error?.message || error);
            return false;
        }
    },

    async del(key) {
        try {
            await client.del(key);
            return true;
        } catch (error) {
            logRedisError('Upstash del error:', error?.message || error);
            return false;
        }
    },
};

export default redisClient;
