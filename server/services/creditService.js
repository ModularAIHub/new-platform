import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import redisClient from '../config/redis.js';

// Credit costs for different operations
const CREDIT_COSTS = {
    'twitter_post': 1,
    'linkedin_post': 1.5,
    'image_generation': 2,
    'content_analysis': 0.5,
    'scheduling': 0.25
};

class CreditService {
    // Get credit balance (Redis first, fallback to PostgreSQL)
    static async getBalance(userId) {
        try {
            // Try Redis first
            let credits = await redisClient.getCredits(userId);

            if (credits === null) {
                // Fallback to PostgreSQL
                const result = await query(
                    'SELECT credits_remaining FROM users WHERE id = $1',
                    [userId]
                );

                if (result.rows.length === 0) {
                    throw new Error('User not found');
                }

                credits = result.rows[0].credits_remaining;

                // Store in Redis for future use
                await redisClient.setCredits(userId, credits);
            }

            return credits;
        } catch (error) {
            console.error('Get balance error:', error);
            throw error;
        }
    }

    // Deduct credits with Redis-first approach
    static async deductCredits(userId, operation, description = '', overrideCost = null) {
        try {
            const cost = overrideCost ? parseFloat(overrideCost) : (CREDIT_COSTS[operation] || 1);

            // Check balance in Redis
            const currentCredits = await redisClient.getCredits(userId);

            if (currentCredits === null) {
                // Load from PostgreSQL if not in Redis
                const result = await query(
                    'SELECT credits_remaining FROM users WHERE id = $1',
                    [userId]
                );

                if (result.rows.length === 0) {
                    throw new Error('User not found');
                }

                const dbCredits = result.rows[0].credits_remaining;
                await redisClient.setCredits(userId, dbCredits);

                if (dbCredits < cost) {
                    throw new Error('Insufficient credits');
                }
            } else if (currentCredits < cost) {
                throw new Error('Insufficient credits');
            }

            // Deduct from Redis
            const newBalance = await redisClient.deductCredits(userId, cost);

            if (newBalance === null) {
                throw new Error('Failed to deduct credits from Redis');
            }

            // Mark user as dirty for sync
            await redisClient.addDirtyUser(userId);

            // Log transaction in PostgreSQL
            const transactionId = uuidv4();
            await query(
                `INSERT INTO credit_transactions (id, user_id, type, credits_amount, description, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [transactionId, userId, 'usage', cost, `${operation}: ${description}`]
            );

            return {
                success: true,
                creditsDeducted: cost,
                creditsRemaining: newBalance,
                transactionId
            };
        } catch (error) {
            console.error('Deduct credits error:', error);
            throw error;
        }
    }

    // Add credits (purchase/refund)
    static async addCredits(userId, amount, description = '', transactionData = {}) {
        try {
            // Add to Redis
            const newBalance = await redisClient.addCredits(userId, amount);

            if (newBalance === null) {
                throw new Error('Failed to add credits to Redis');
            }

            // Mark user as dirty for sync
            await redisClient.addDirtyUser(userId);

            // Log transaction in PostgreSQL
            const transactionId = uuidv4();
            await query(
                `INSERT INTO credit_transactions (
                    id, user_id, type, credits_amount, cost_in_rupees, 
                    razorpay_order_id, razorpay_payment_id, razorpay_signature, description, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
                [
                    transactionId, userId, 'purchase', amount,
                    transactionData.costInRupees || null,
                    transactionData.razorpayOrderId || null,
                    transactionData.razorpayPaymentId || null,
                    transactionData.razorpaySignature || null,
                    description
                ]
            );

            return {
                success: true,
                creditsAdded: amount,
                creditsRemaining: newBalance,
                transactionId
            };
        } catch (error) {
            console.error('Add credits error:', error);
            throw error;
        }
    }

    // Sync Redis to PostgreSQL (for dirty users)
    static async syncToDatabase(userId = null) {
        try {
            if (userId) {
                // Sync specific user
                await this.syncUserToDatabase(userId);
            } else {
                // Sync all dirty users
                const dirtyUsers = await redisClient.getDirtyUsers();

                for (const dirtyUserId of dirtyUsers) {
                    await this.syncUserToDatabase(dirtyUserId);
                }
            }
        } catch (error) {
            console.error('Sync to database error:', error);
            throw error;
        }
    }

    // Sync specific user to database
    static async syncUserToDatabase(userId) {
        try {
            const credits = await redisClient.getCredits(userId);

            if (credits !== null) {
                // Update PostgreSQL
                await query(
                    'UPDATE users SET credits_remaining = $1, updated_at = NOW() WHERE id = $2',
                    [credits, userId]
                );

                // Remove from dirty users
                await redisClient.removeDirtyUser(userId);

                console.log(`✅ Synced credits for user ${userId}: ${credits}`);
            }
        } catch (error) {
            console.error(`Sync user ${userId} error:`, error);
            throw error;
        }
    }

    // Load user data from PostgreSQL to Redis
    static async loadUserToRedis(userId) {
        try {
            const result = await query(
                'SELECT credits_remaining, plan_type FROM users WHERE id = $1',
                [userId]
            );

            if (result.rows.length === 0) {
                throw new Error('User not found');
            }

            const user = result.rows[0];

            // Store in Redis
            await redisClient.setCredits(userId, user.credits_remaining);
            await redisClient.setPlan(userId, user.plan_type);

            return {
                credits: user.credits_remaining,
                plan: user.plan_type
            };
        } catch (error) {
            console.error('Load user to Redis error:', error);
            throw error;
        }
    }

    // Get transaction history
    static async getTransactionHistory(userId, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;

            // Get total count
            const countResult = await query(
                'SELECT COUNT(*) FROM credit_transactions WHERE user_id = $1',
                [userId]
            );
            const totalCount = parseInt(countResult.rows[0].count);

            // Get transactions
            const result = await query(
                `SELECT id, type, credits_amount, cost_in_rupees, description, created_at
                 FROM credit_transactions 
                 WHERE user_id = $1 
                 ORDER BY created_at DESC 
                 LIMIT $2 OFFSET $3`,
                [userId, limit, offset]
            );

            return {
                transactions: result.rows.map(row => ({
                    id: row.id,
                    type: row.type,
                    creditsAmount: row.credits_amount,
                    costInRupees: row.cost_in_rupees,
                    description: row.description,
                    createdAt: row.created_at
                })),
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit)
                }
            };
        } catch (error) {
            console.error('Get transaction history error:', error);
            throw error;
        }
    }

    // Check if user has sufficient credits
    static async hasSufficientCredits(userId, operation) {
        try {
            const cost = CREDIT_COSTS[operation] || 1;
            const balance = await this.getBalance(userId);
            return balance >= cost;
        } catch (error) {
            console.error('Check sufficient credits error:', error);
            return false;
        }
    }

    // Get credit costs for operations
    static getCreditCosts() {
        return CREDIT_COSTS;
    }

    // Emergency sync (for critical operations)
    static async emergencySync(userId) {
        try {
            console.log(`🚨 Emergency sync for user ${userId}`);
            await this.syncToDatabase(userId);
        } catch (error) {
            console.error('Emergency sync error:', error);
            throw error;
        }
    }

    // Health check
    static async healthCheck() {
        try {
            const redisHealth = await redisClient.ping();
            const dbHealth = await query('SELECT 1');

            return {
                redis: redisHealth,
                database: dbHealth.rows.length > 0,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Health check error:', error);
            return {
                redis: false,
                database: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

export default CreditService;
