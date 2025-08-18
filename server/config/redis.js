import redis from 'redis';
import dotenv from 'dotenv';
dotenv.config();

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            this.client = redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.error('Redis connection failed after 10 retries');
                            return new Error('Redis connection failed');
                        }
                        return Math.min(retries * 100, 3000);
                    }
                }
            });

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('✅ Connected to Redis');
                this.isConnected = true;
            });

            this.client.on('ready', () => {
                console.log('✅ Redis client ready');
            });

            this.client.on('end', () => {
                console.log('❌ Redis connection ended');
                this.isConnected = false;
            });

            await this.client.connect();
        } catch (error) {
            console.error('❌ Redis connection failed:', error);
            this.isConnected = false;
            throw error;
        }
    }

    async disconnect() {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
        }
    }

    // Credit operations
    async getCredits(userId) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }
            const credits = await this.client.get(`credits:${userId}`);
            return credits ? parseFloat(credits) : null;
        } catch (error) {
            console.error('Redis getCredits error:', error);
            return null;
        }
    }

    async setCredits(userId, credits) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }
            await this.client.set(`credits:${userId}`, credits.toString());
            return true;
        } catch (error) {
            console.error('Redis setCredits error:', error);
            return false;
        }
    }

    async deductCredits(userId, amount) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }
            // Redis has INCRBYFLOAT but not DECRBYFLOAT; use negative increment
            const result = await this.client.incrByFloat(`credits:${userId}`, -Math.abs(amount));
            return result;
        } catch (error) {
            console.error('Redis deductCredits error:', error);
            return null;
        }
    }

    async addCredits(userId, amount) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }
            const result = await this.client.incrByFloat(`credits:${userId}`, Math.abs(amount));
            return result;
        } catch (error) {
            console.error('Redis addCredits error:', error);
            return null;
        }
    }

    // Plan operations
    async getPlan(userId) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }
            return await this.client.get(`plan:${userId}`);
        } catch (error) {
            console.error('Redis getPlan error:', error);
            return null;
        }
    }

    async setPlan(userId, plan) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }
            await this.client.set(`plan:${userId}`, plan);
            return true;
        } catch (error) {
            console.error('Redis setPlan error:', error);
            return false;
        }
    }

    // Dirty users tracking
    async addDirtyUser(userId) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }
            await this.client.sAdd('dirty_users', userId);
            return true;
        } catch (error) {
            console.error('Redis addDirtyUser error:', error);
            return false;
        }
    }

    async getDirtyUsers() {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }
            return await this.client.sMembers('dirty_users');
        } catch (error) {
            console.error('Redis getDirtyUsers error:', error);
            return [];
        }
    }

    async removeDirtyUser(userId) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }
            await this.client.sRem('dirty_users', userId);
            return true;
        } catch (error) {
            console.error('Redis removeDirtyUser error:', error);
            return false;
        }
    }

    // Health check
    async ping() {
        try {
            if (!this.isConnected) {
                return false;
            }
            const result = await this.client.ping();
            return result === 'PONG';
        } catch (error) {
            console.error('Redis ping error:', error);
            return false;
        }
    }

    // Generic Redis operations for OTP and other uses
    async get(key) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }
            return await this.client.get(key);
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }

    async setEx(key, seconds, value) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }
            // Ensure value is always a string
            const stringValue = typeof value === 'string' ? value : String(value);
            await this.client.setEx(key, seconds, stringValue);
            return true;
        } catch (error) {
            console.error('Redis setEx error:', error);
            return false;
        }
    }

    async del(key) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error('Redis del error:', error);
            return false;
        }
    }
}

// Create singleton instance
const redisClient = new RedisClient();

export default redisClient;
