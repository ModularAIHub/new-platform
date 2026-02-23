// creditResetController.js
// Controller for manual credit reset operations (admin only)
import { query } from '../config/database.js';
import redisClient from '../config/redis.js';
import { CREDIT_TIERS } from '../utils/creditTiers.js';

export const CreditResetController = {
  // Manual trigger for monthly credit reset (admin only)
  async manualMonthlyReset(req, res) {
    try {
      console.log('[CREDIT RESET] Manual monthly reset triggered by admin');
      
      // Update credits based on BOTH plan_type and api_key_preference
      // Free: 15 (platform) / 50 (BYOK) | Pro: 100 (platform) / 180 (BYOK) | Enterprise: 500 (platform) / 1000 (BYOK)
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
      `);
      
      console.log(`[CREDIT RESET] Updated credits for ${updateResult.rowCount} users in database`);

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
          console.error(`[CREDIT RESET] Failed to update Redis for user ${user.id}:`, redisError.message);
        }
      }
      
      console.log(`[CREDIT RESET] Manual reset completed successfully!`);
      console.log(`[CREDIT RESET] Database updates: ${updateResult.rowCount}, Redis updates: ${redisUpdates}`);
      console.log('[CREDIT RESET] Stats by tier:', statsByTier);
      
      res.json({
        success: true,
        message: 'Monthly credit reset completed successfully',
        stats: {
          databaseUpdates: updateResult.rowCount,
          redisUpdates,
          byTier: statsByTier,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('[CREDIT RESET] Manual reset failed:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to perform credit reset',
        details: error.message 
      });
    }
  },

  // Get next scheduled reset date
  async getResetInfo(req, res) {
    try {
      const now = new Date();
      const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      
      // Get last reset info from database with plan breakdown
      const { rows } = await query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN api_key_preference = 'byok' THEN 1 END) as byok_users,
          COUNT(CASE WHEN api_key_preference = 'platform' THEN 1 END) as platform_users,
          COUNT(CASE WHEN COALESCE(plan_type, 'free') = 'free' AND api_key_preference = 'platform' THEN 1 END) as free_platform,
          COUNT(CASE WHEN COALESCE(plan_type, 'free') = 'free' AND api_key_preference = 'byok' THEN 1 END) as free_byok,
          COUNT(CASE WHEN plan_type = 'pro' AND api_key_preference = 'platform' THEN 1 END) as pro_platform,
          COUNT(CASE WHEN plan_type = 'pro' AND api_key_preference = 'byok' THEN 1 END) as pro_byok,
          COUNT(CASE WHEN plan_type = 'enterprise' AND api_key_preference = 'platform' THEN 1 END) as enterprise_platform,
          COUNT(CASE WHEN plan_type = 'enterprise' AND api_key_preference = 'byok' THEN 1 END) as enterprise_byok,
          MAX(last_credit_reset) as last_global_reset
        FROM users 
        WHERE api_key_preference IS NOT NULL
      `);
      
      const stats = rows[0];
      
      res.json({
        success: true,
        resetInfo: {
          nextScheduledReset: nextMonth.toISOString(),
          lastGlobalReset: stats.last_global_reset,
          userStats: {
            totalUsers: parseInt(stats.total_users),
            byokUsers: parseInt(stats.byok_users),
            platformUsers: parseInt(stats.platform_users),
            breakdown: {
              freePlatform: parseInt(stats.free_platform),
              freeByok: parseInt(stats.free_byok),
              proPlatform: parseInt(stats.pro_platform),
              proByok: parseInt(stats.pro_byok),
              enterprisePlatform: parseInt(stats.enterprise_platform),
              enterpriseByok: parseInt(stats.enterprise_byok)
            }
          },
          creditAmounts: {
            free: { platform: CREDIT_TIERS.free.platform, byok: CREDIT_TIERS.free.byok },
            pro: { platform: CREDIT_TIERS.pro.platform, byok: CREDIT_TIERS.pro.byok },
            enterprise: { platform: CREDIT_TIERS.enterprise.platform, byok: CREDIT_TIERS.enterprise.byok }
          }
        }
      });
      
    } catch (error) {
      console.error('[CREDIT RESET] Failed to get reset info:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get reset information',
        details: error.message 
      });
    }
  }
};
