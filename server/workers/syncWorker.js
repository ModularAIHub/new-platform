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

    // Monthly credit reset logic
    startMonthlyReset() {
        setInterval(async () => {
            const now = new Date();
            const utcMonth = now.getUTCMonth();
            const utcDate = now.getUTCDate();
            const utcYear = now.getUTCFullYear();
            const resetKey = `${utcYear}-${utcMonth}`;
            if (utcDate === 1 && this.lastResetMonth !== resetKey) {
                try {
                    console.log('🔄 Performing monthly credit reset for all users...');
                    // Update credits in DB: 25 for platform, 55 for BYOK
                    await query("UPDATE users SET credits_remaining = CASE WHEN api_key_preference = 'byok' THEN 55 WHEN api_key_preference = 'platform' THEN 25 ELSE 0 END");

                    // Fetch all user IDs and their mode
                    const { rows: users } = await query("SELECT id, api_key_preference FROM users");
                    for (const user of users) {
                        let credits = 0;
                        if (user.api_key_preference === 'byok') credits = 55;
                        else if (user.api_key_preference === 'platform') credits = 25;
                        // Update Redis cache
                        await redisClient.setCredits(user.id, credits);
                    }
                    this.lastResetMonth = resetKey;
                    console.log('✅ Monthly credit reset completed.');
                } catch (err) {
                    console.error('❌ Monthly credit reset failed:', err);
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
