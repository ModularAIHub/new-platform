import { isDatabaseUnavailableError, query } from '../config/database.js';
import redisClient from '../config/redis.js';
import CreditService from '../services/creditService.js';
import { CREDIT_TIERS } from '../utils/creditTiers.js';

class SyncWorker {
    constructor() {
        this.isRunning = false;
        this.interval = null;
        this.syncInterval = 10 * 60 * 1000; // 10 minutes
        this.startTime = null;
        this.lastSyncTime = null;

        this.monthlyResetTimer = null;
        this.monthlyResetInProgress = false;
        this.monthlyResetInterval = 60 * 60 * 1000; // 1 hour
        this.runInitialMonthlyReset =
            process.env.SYNC_WORKER_RUN_INITIAL_MONTHLY_RESET === 'true' ||
            (
                process.env.SYNC_WORKER_RUN_INITIAL_MONTHLY_RESET !== 'false' &&
                process.env.NODE_ENV === 'production'
            );

        this.databaseFailureCooldownMs = Number.parseInt(
            process.env.SYNC_WORKER_DB_FAILURE_COOLDOWN_MS || '120000',
            10
        );
        this.databaseCooldownUntil = 0;
        this.lastDatabaseCooldownReason = null;
    }

    start() {
        if (this.isRunning) {
            console.log('Sync worker is already running');
            return;
        }

        console.log('Starting credit sync worker...');
        this.isRunning = true;
        this.startTime = Date.now();

        this.startMonthlyReset();

        void this.performSync();

        this.interval = setInterval(() => {
            void this.performSync();
        }, this.syncInterval);

        console.log(`Credit sync worker started (interval: ${this.syncInterval / 1000}s)`);
    }

    startMonthlyReset() {
        console.log('[CREDIT RESET] Monthly credit reset scheduler initialized (checks hourly, resets on UTC month start)');

        if (this.monthlyResetTimer) {
            clearInterval(this.monthlyResetTimer);
        }

        if (this.runInitialMonthlyReset) {
            void this.runMonthlyCreditResetIfDue();
        }

        this.monthlyResetTimer = setInterval(() => {
            void this.runMonthlyCreditResetIfDue();
        }, this.monthlyResetInterval);
    }

    isDatabaseCooldownActive(taskLabel = 'worker task') {
        const remainingMs = this.databaseCooldownUntil - Date.now();
        if (remainingMs <= 0) {
            return false;
        }

        console.warn(
            `[SYNC WORKER] Skipping ${taskLabel}; database cooldown active for ${remainingMs}ms` +
            (this.lastDatabaseCooldownReason ? ` (${this.lastDatabaseCooldownReason})` : '')
        );
        return true;
    }

    markDatabaseUnavailable(taskLabel, error) {
        if (!isDatabaseUnavailableError(error)) {
            return false;
        }

        this.databaseCooldownUntil = Date.now() + this.databaseFailureCooldownMs;
        this.lastDatabaseCooldownReason = error?.message || 'database unavailable';
        console.warn(
            `[SYNC WORKER] ${taskLabel} paused for ${this.databaseFailureCooldownMs}ms:`,
            this.lastDatabaseCooldownReason
        );
        return true;
    }

    async runMonthlyCreditResetIfDue() {
        if (this.monthlyResetInProgress) {
            return;
        }

        if (this.isDatabaseCooldownActive('monthly credit reset')) {
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
                this.databaseCooldownUntil = 0;
                this.lastDatabaseCooldownReason = null;
                return;
            }

            this.databaseCooldownUntil = 0;
            this.lastDatabaseCooldownReason = null;
            console.log(`[CREDIT RESET] Monthly credit reset completed for ${utcMonth + 1}/${utcYear} (UTC month boundary)`);
            console.log(`[CREDIT RESET] User DB updates: ${updateResult.rowCount}, Redis updates: ${redisUpdates}`);
            console.log(`[CREDIT RESET] Team updates: ${teamResetResult.rowCount}`);
            console.log('[CREDIT RESET] Credit allocation by tier:');
            console.log(`   Free+Platform (${CREDIT_TIERS.free.platform}): ${statsByTier['free-platform']} users`);
            console.log(`   Free+BYOK (${CREDIT_TIERS.free.byok}): ${statsByTier['free-byok']} users`);
            console.log(`   Pro+Platform (${CREDIT_TIERS.pro.platform}): ${statsByTier['pro-platform']} users`);
            console.log(`   Pro+BYOK (${CREDIT_TIERS.pro.byok}): ${statsByTier['pro-byok']} users`);
            console.log(`   Enterprise+Platform (${CREDIT_TIERS.enterprise.platform}): ${statsByTier['enterprise-platform']} users`);
            console.log(`   Enterprise+BYOK (${CREDIT_TIERS.enterprise.byok}): ${statsByTier['enterprise-byok']} users`);
        } catch (err) {
            if (!this.markDatabaseUnavailable('monthly credit reset', err)) {
                console.error('[CREDIT RESET] Monthly credit reset failed:', err);
            }
        } finally {
            this.monthlyResetInProgress = false;
        }
    }

    stop() {
        if (!this.isRunning) {
            console.log('Sync worker is not running');
            return;
        }

        console.log('Stopping credit sync worker...');
        this.isRunning = false;

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        if (this.monthlyResetTimer) {
            clearInterval(this.monthlyResetTimer);
            this.monthlyResetTimer = null;
        }

        console.log('Credit sync worker stopped');
    }

    async performSync() {
        if (this.isDatabaseCooldownActive('credit sync')) {
            return;
        }

        try {
            console.log('Starting credit sync...');
            const startedAt = Date.now();

            const redisHealth = await redisClient.ping();
            if (!redisHealth) {
                console.log('Redis not available, skipping sync');
                return;
            }

            const dirtyUsers = await redisClient.getDirtyUsers();

            if (dirtyUsers.length === 0) {
                this.lastSyncTime = new Date().toISOString();
                console.log('No dirty users to sync');
                return;
            }

            console.log(`Syncing ${dirtyUsers.length} dirty users...`);

            let successCount = 0;
            let errorCount = 0;

            for (const userId of dirtyUsers) {
                try {
                    await CreditService.syncUserToDatabase(userId);
                    successCount++;
                } catch (error) {
                    if (this.markDatabaseUnavailable(`credit sync for user ${userId}`, error)) {
                        errorCount++;
                        break;
                    }

                    console.error(`Failed to sync user ${userId}:`, error.message);
                    errorCount++;
                }
            }

            const duration = Date.now() - startedAt;
            this.lastSyncTime = new Date().toISOString();
            this.databaseCooldownUntil = 0;
            this.lastDatabaseCooldownReason = null;

            console.log(`Credit sync completed in ${duration}ms`);
            console.log(`Success: ${successCount}, Errors: ${errorCount}`);

            this.logSyncMetrics({
                timestamp: this.lastSyncTime,
                duration,
                totalUsers: dirtyUsers.length,
                successCount,
                errorCount
            });
        } catch (error) {
            if (!this.markDatabaseUnavailable('credit sync', error)) {
                console.error('Credit sync failed:', error);
            }
        }
    }

    logSyncMetrics(metrics) {
        console.log('Sync Metrics:', JSON.stringify(metrics, null, 2));
    }

    async manualSync(userId = null) {
        try {
            console.log('Manual sync triggered...');

            if (userId) {
                console.log(`Manual sync for user: ${userId}`);
                await CreditService.syncToDatabase(userId);
            } else {
                console.log('Manual sync for all dirty users');
                await CreditService.syncToDatabase();
            }

            console.log('Manual sync completed');
        } catch (error) {
            console.error('Manual sync failed:', error);
            throw error;
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            syncInterval: this.syncInterval,
            lastSync: this.lastSyncTime,
            uptime: this.isRunning && this.startTime ? Date.now() - this.startTime : null,
            databaseCooldownUntil: this.databaseCooldownUntil || null,
            lastDatabaseCooldownReason: this.lastDatabaseCooldownReason
        };
    }

    async healthCheck() {
        try {
            const redisHealth = await redisClient.ping();
            const dirtyUsers = await redisClient.getDirtyUsers();

            return {
                worker: this.isRunning,
                redis: redisHealth,
                dirtyUsersCount: dirtyUsers.length,
                databaseCooldownActive: this.databaseCooldownUntil > Date.now(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                worker: this.isRunning,
                redis: false,
                error: error.message,
                databaseCooldownActive: this.databaseCooldownUntil > Date.now(),
                timestamp: new Date().toISOString()
            };
        }
    }
}

const syncWorker = new SyncWorker();

process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down sync worker...');
    syncWorker.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down sync worker...');
    syncWorker.stop();
    process.exit(0);
});

export async function runSyncTick() {
    return syncWorker.performSync();
}

export default syncWorker;
