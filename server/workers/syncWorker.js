import { query } from '../config/database.js';
import redisClient from '../config/redis.js';
import CreditService from '../services/creditService.js';
import { CREDIT_TIERS } from '../utils/creditTiers.js';

class SyncWorker {
    constructor() {
        this.isRunning = false;
        this.interval = null;
        this.syncInterval = 10 * 60 * 1000; // 10 minutes

        // Monthly reset state
        this.monthlyResetTimer = null;
        this.monthlyResetInProgress = false;
        this.monthlyResetInterval = 60 * 60 * 1000; // 1 hour
        this.startMonthlyReset();
    }

    // Start the sync worker
    start() {
        if (this.isRunning) {
            console.log('⚠️  Sync worker is already running');
            return;
        }

        console.log('🚀 Starting credit sync worker...');
        this.isRunning = true;

        // Run initial sync
        this.performSync();

        // Set up interval for periodic sync
        this.interval = setInterval(() => {
            this.performSync();
        }, this.syncInterval);

        console.log(`✅ Credit sync worker started (interval: ${this.syncInterval / 1000}s)`);
    }
    // Monthly credit reset logic - checks hourly and resets accounts due for the current UTC month
    startMonthlyReset() {
        console.log('[CREDIT RESET] Monthly credit reset scheduler initialized (checks hourly, resets on UTC month start)');

        if (this.monthlyResetTimer) {
            clearInterval(this.monthlyResetTimer);
        }

        // Run once on startup so the reset is not missed after a restart.
        void this.runMonthlyCreditResetIfDue();

        this.monthlyResetTimer = setInterval(() => {
            void this.runMonthlyCreditResetIfDue();
        }, this.monthlyResetInterval);
    }

    async runMonthlyCreditResetIfDue() {
        if (this.monthlyResetInProgress) {
            return;
        }

        this.monthlyResetInProgress = true;

        try {
            const now = new Date();
            const utcMonth = now.getUTCMonth();
            const utcYear = now.getUTCFullYear();

            const updateResult = await query(`
                UPDATE users
                SET credits_remaining = CASE
                    WHEN COALESCE(plan_type, 'free') = 'free' AND api_key_preference = 'platform' THEN ${CREDIT_TIERS.free.platform}
                    WHEN COALESCE(plan_type, 'free') = 'free' AND api_key_preference = 'byok' THEN ${CREDIT_TIERS.free.byok}
                    WHEN plan_type = 'pro' AND api_key_preference = 'platform' THEN ${CREDIT_TIERS.pro.platform}
                    WHEN plan_type = 'pro' AND api_key_preference = 'byok' THEN ${CREDIT_TIERS.pro.byok}
                    WHEN plan_type = 'enterprise' AND api_key_preference = 'platform' THEN ${CREDIT_TIERS.enterprise.platform}
                    WHEN plan_type = 'enterprise' AND api_key_preference = 'byok' THEN ${CREDIT_TIERS.enterprise.byok}
                    ELSE 0
                END,
                last_credit_reset = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
                WHERE api_key_preference IS NOT NULL
                  AND (
                    last_credit_reset IS NULL
                    OR last_credit_reset < DATE_TRUNC('month', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
                  )
                RETURNING id, api_key_preference, plan_type, credits_remaining
            `);

            const users = updateResult.rows || [];
            let redisUpdates = 0;
            const statsByTier = {
                'free-platform': 0,
                'free-byok': 0,
                'pro-platform': 0,
                'pro-byok': 0,
                'enterprise-platform': 0,
                'enterprise-byok': 0
            };

            for (const user of users) {
                try {
                    await redisClient.setCredits(user.id, user.credits_remaining);
                    redisUpdates++;

                    const tier = `${user.plan_type || 'free'}-${user.api_key_preference}`;
                    if (statsByTier[tier] !== undefined) {
                        statsByTier[tier]++;
                    }
                } catch (redisError) {
                    console.error(`[CREDIT RESET] Failed to update Redis for user ${user.id}:`, redisError.message);
                }
            }

            const teamResetResult = await query(`
                UPDATE teams t
                SET
                  credits_remaining = CASE
                    WHEN u.plan_type = 'pro' AND u.api_key_preference = 'platform' THEN ${CREDIT_TIERS.pro.platform}
                    WHEN u.plan_type = 'pro' AND u.api_key_preference = 'byok' THEN ${CREDIT_TIERS.pro.byok}
                    WHEN u.plan_type = 'enterprise' AND u.api_key_preference = 'platform' THEN ${CREDIT_TIERS.enterprise.platform}
                    WHEN u.plan_type = 'enterprise' AND u.api_key_preference = 'byok' THEN ${CREDIT_TIERS.enterprise.byok}
                    ELSE ${CREDIT_TIERS.pro.platform}
                  END,
                  plan_type = COALESCE(u.plan_type, 'pro'),
                  last_credit_reset = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
                FROM users u
                WHERE t.owner_id = u.id
                  AND (
                    t.last_credit_reset IS NULL
                    OR t.last_credit_reset < DATE_TRUNC('month', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
                  )
            `);

            if (updateResult.rowCount === 0 && teamResetResult.rowCount === 0) {
                return;
            }

            console.log(`[CREDIT RESET] Monthly credit reset completed for ${utcMonth + 1}/${utcYear} (UTC month boundary)`);
            console.log(`[CREDIT RESET] User DB updates: ${updateResult.rowCount}, Redis updates: ${redisUpdates}`);
            console.log(`[CREDIT RESET] Team updates: ${teamResetResult.rowCount}`);
            console.log(`[CREDIT RESET] Credit allocation by tier:`);
            console.log(`   Free+Platform (${CREDIT_TIERS.free.platform}): ${statsByTier['free-platform']} users`);
            console.log(`   Free+BYOK (${CREDIT_TIERS.free.byok}): ${statsByTier['free-byok']} users`);
            console.log(`   Pro+Platform (${CREDIT_TIERS.pro.platform}): ${statsByTier['pro-platform']} users`);
            console.log(`   Pro+BYOK (${CREDIT_TIERS.pro.byok}): ${statsByTier['pro-byok']} users`);
            console.log(`   Enterprise+Platform (${CREDIT_TIERS.enterprise.platform}): ${statsByTier['enterprise-platform']} users`);
            console.log(`   Enterprise+BYOK (${CREDIT_TIERS.enterprise.byok}): ${statsByTier['enterprise-byok']} users`);
        } catch (err) {
            console.error('[CREDIT RESET] Monthly credit reset failed:', err);
        } finally {
            this.monthlyResetInProgress = false;
        }
    }

    // Stop the sync worker
    stop() {
        if (!this.isRunning) {
            console.log('⚠️  Sync worker is not running');
            return;
        }

        console.log('🛑 Stopping credit sync worker...');
        this.isRunning = false;

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        if (this.monthlyResetTimer) {
            clearInterval(this.monthlyResetTimer);
            this.monthlyResetTimer = null;
        }

        console.log('✅ Credit sync worker stopped');
    }

    // Perform the actual sync operation
    async performSync() {
        try {
            console.log('🔄 Starting credit sync...');
            const startTime = Date.now();

            // Check if Redis is available
            const redisHealth = await redisClient.ping();
            if (!redisHealth) {
                console.log('⚠️  Redis not available, skipping sync');
                return;
            }

            // Get dirty users from Redis
            const dirtyUsers = await redisClient.getDirtyUsers();

            if (dirtyUsers.length === 0) {
                console.log('✅ No dirty users to sync');
                return;
            }

            console.log(`📊 Syncing ${dirtyUsers.length} dirty users...`);

            let successCount = 0;
            let errorCount = 0;

            // Sync each dirty user
            for (const userId of dirtyUsers) {
                try {
                    await CreditService.syncUserToDatabase(userId);
                    successCount++;
                } catch (error) {
                    console.error(`❌ Failed to sync user ${userId}:`, error.message);
                    errorCount++;
                }
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log(`✅ Credit sync completed in ${duration}ms`);
            console.log(`📈 Success: ${successCount}, Errors: ${errorCount}`);

            // Log sync metrics
            this.logSyncMetrics({
                timestamp: new Date().toISOString(),
                duration,
                totalUsers: dirtyUsers.length,
                successCount,
                errorCount
            });

        } catch (error) {
            console.error('❌ Credit sync failed:', error);
        }
    }

    // Log sync metrics for monitoring
    logSyncMetrics(metrics) {
        // In production, you might want to send these metrics to a monitoring service
        console.log('📊 Sync Metrics:', JSON.stringify(metrics, null, 2));
    }

    // Manual sync trigger (for testing/debugging)
    async manualSync(userId = null) {
        try {
            console.log('🔧 Manual sync triggered...');

            if (userId) {
                console.log(`📊 Manual sync for user: ${userId}`);
                await CreditService.syncToDatabase(userId);
            } else {
                console.log('📊 Manual sync for all dirty users');
                await CreditService.syncToDatabase();
            }

            console.log('✅ Manual sync completed');
        } catch (error) {
            console.error('❌ Manual sync failed:', error);
            throw error;
        }
    }

    // Get worker status
    getStatus() {
        return {
            isRunning: this.isRunning,
            syncInterval: this.syncInterval,
            lastSync: this.lastSyncTime,
            uptime: this.isRunning ? Date.now() - this.startTime : null
        };
    }

    // Health check
    async healthCheck() {
        try {
            const redisHealth = await redisClient.ping();
            const dirtyUsers = await redisClient.getDirtyUsers();

            return {
                worker: this.isRunning,
                redis: redisHealth,
                dirtyUsersCount: dirtyUsers.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                worker: this.isRunning,
                redis: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Create singleton instance
const syncWorker = new SyncWorker();

// Graceful shutdown handling
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down sync worker...');
    syncWorker.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down sync worker...');
    syncWorker.stop();
    process.exit(0);
});

export default syncWorker;
