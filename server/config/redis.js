

import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config();

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
            console.error('Upstash getCredits error:', error);
            return null;
        }
    },

    async setCredits(userId, credits) {
        try {
            await client.set(`credits:${userId}`, credits.toString());
            return true;
        } catch (error) {
            console.error('Upstash setCredits error:', error);
            return false;
        }
    },

    async deductCredits(userId, amount) {
        try {
            // Upstash supports INCRBYFLOAT
            const result = await client.incrbyfloat(`credits:${userId}`, -Math.abs(amount));
            return result;
        } catch (error) {
            console.error('Upstash deductCredits error:', error);
            return null;
        }
    },

    async addCredits(userId, amount) {
        try {
            const result = await client.incrbyfloat(`credits:${userId}`, Math.abs(amount));
            return result;
        } catch (error) {
            console.error('Upstash addCredits error:', error);
            return null;
        }
    },

    // Plan operations
    async getPlan(userId) {
        try {
            return await client.get(`plan:${userId}`);
        } catch (error) {
            console.error('Upstash getPlan error:', error);
            return null;
        }
    },

    async setPlan(userId, plan) {
        try {
            await client.set(`plan:${userId}`, plan);
            return true;
        } catch (error) {
            console.error('Upstash setPlan error:', error);
            return false;
        }
    },

    // Dirty users tracking
    async addDirtyUser(userId) {
        try {
            await client.sadd('dirty_users', userId);
            return true;
        } catch (error) {
            console.error('Upstash addDirtyUser error:', error);
            return false;
        }
    },

    async getDirtyUsers() {
        try {
            return await client.smembers('dirty_users');
        } catch (error) {
            console.error('Upstash getDirtyUsers error:', error);
            return [];
        }
    },

    async removeDirtyUser(userId) {
        try {
            await client.srem('dirty_users', userId);
            return true;
        } catch (error) {
            console.error('Upstash removeDirtyUser error:', error);
            return false;
        }
    },

    // Health check
    async ping() {
        try {
            const result = await client.ping();
            return result === 'PONG';
        } catch (error) {
            console.error('Upstash ping error:', error);
            return false;
        }
    },

    // Generic Redis operations for OTP and other uses
    async get(key) {
        try {
            return await client.get(key);
        } catch (error) {
            console.error('Upstash get error:', error);
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
            console.error('Upstash setEx error:', error);
            return false;
        }
    },

    async del(key) {
        try {
            await client.del(key);
            return true;
        } catch (error) {
            console.error('Upstash del error:', error);
            return false;
        }
    },
};

export default redisClient;
