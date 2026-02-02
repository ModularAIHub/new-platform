import { query } from '../config/database.js';
import redisClient from '../config/redis.js';
import CreditService from '../services/creditService.js';

class SyncWorker {
    constructor() {
        this.isRunning = false;
        this.interval = null;
        this.syncInterval = 10 * 60 * 1000; // 10 minutes

        // Monthly reset state
        this.lastResetMonth = null;
        this.monthlyResetInterval = 24 * 60 * 60 * 1000; // 24 hours
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

    // Monthly credit reset logic - runs on 1st of every month
    startMonthlyReset() {
        console.log('🗓️  Monthly credit reset scheduler initialized');
        
        setInterval(async () => {
            const now = new Date();
            const utcMonth = now.getUTCMonth();
            const utcDate = now.getUTCDate();
            const utcYear = now.getUTCFullYear();
            const resetKey = `${utcYear}-${utcMonth}`;
            
            // Check if it's the 1st of the month and we haven't reset this month yet
            if (utcDate === 1 && this.lastResetMonth !== resetKey) {
                try {
                    console.log(`🔄 Performing monthly credit reset for ${utcMonth + 1}/${utcYear}...`);
                    
                    // Update credits based on BOTH plan_type and api_key_preference
                    // Free: 50 (platform) / 100 (BYOK)
                    // Pro: 150 (platform) / 300 (BYOK)
                    // Enterprise: 500 (platform) / 1000 (BYOK)
                    const updateResult = await query(`
                        UPDATE users 
                        SET credits_remaining = CASE 
                            WHEN COALESCE(plan_type, 'free') = 'free' AND api_key_preference = 'platform' THEN 50
                            WHEN COALESCE(plan_type, 'free') = 'free' AND api_key_preference = 'byok' THEN 100
                            WHEN plan_type = 'pro' AND api_key_preference = 'platform' THEN 150
                            WHEN plan_type = 'pro' AND api_key_preference = 'byok' THEN 300
                            WHEN plan_type = 'enterprise' AND api_key_preference = 'platform' THEN 500
                            WHEN plan_type = 'enterprise' AND api_key_preference = 'byok' THEN 1000
                            ELSE 0 
                        END,
                        last_credit_reset = NOW()
                        WHERE api_key_preference IS NOT NULL
                    `);
                    
                    console.log(`📊 Updated credits for ${updateResult.rowCount} users in database`);

                    // Fetch all users with preferences and sync Redis cache
                    const { rows: users } = await query(`
                        SELECT id, api_key_preference, plan_type, credits_remaining 
                        FROM users 
                        WHERE api_key_preference IS NOT NULL
                    `);
                    
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
                            // Update Redis cache with new credit balance
                            await redisClient.setCredits(user.id, user.credits_remaining);
                            redisUpdates++;
                            
                            // Track stats
                            const tier = `${user.plan_type || 'free'}-${user.api_key_preference}`;
                            if (statsByTier[tier] !== undefined) {
                                statsByTier[tier]++;
                            }
                        } catch (redisError) {
                            console.error(`❌ Failed to update Redis for user ${user.id}:`, redisError.message);
                        }
                    }
                    
                    // Mark this month as completed
                    this.lastResetMonth = resetKey;
                    
                    console.log(`✅ Monthly credit reset completed successfully!`);
                    console.log(`📈 Database updates: ${updateResult.rowCount}, Redis updates: ${redisUpdates}`);
                    console.log(`💰 Credit allocation by tier:`);
                    console.log(`   Free+Platform (50): ${statsByTier['free-platform']} users`);
                    console.log(`   Free+BYOK (100): ${statsByTier['free-byok']} users`);
                    console.log(`   Pro+Platform (150): ${statsByTier['pro-platform']} users`);
                    console.log(`   Pro+BYOK (300): ${statsByTier['pro-byok']} users`);
                    console.log(`   Enterprise+Platform (500): ${statsByTier['enterprise-platform']} users`);
                    console.log(`   Enterprise+BYOK (1000): ${statsByTier['enterprise-byok']} users`);
                    
                    // TEAM CREDIT RESET - Reset team credits based on owner's plan
                    console.log(`🔄 Resetting team credits...`);
                    const teamResetResult = await query(`
                        UPDATE teams t
                        SET 
                          credits_remaining = CASE 
                            WHEN u.plan_type = 'pro' AND u.api_key_preference = 'platform' THEN 150
                            WHEN u.plan_type = 'pro' AND u.api_key_preference = 'byok' THEN 300
                            WHEN u.plan_type = 'enterprise' AND u.api_key_preference = 'platform' THEN 500
                            WHEN u.plan_type = 'enterprise' AND u.api_key_preference = 'byok' THEN 1000
                            ELSE 150
                          END,
                          plan_type = COALESCE(u.plan_type, 'pro'),
                          last_credit_reset = NOW()
                        FROM users u
                        WHERE t.owner_id = u.id
                    `);
                    console.log(`✅ Reset credits for ${teamResetResult.rowCount} teams`);
                    
                } catch (err) {
                    console.error('❌ Monthly credit reset failed:', err);
                    // Don't update lastResetMonth so it will retry
                }
            }
        }, this.monthlyResetInterval);
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
