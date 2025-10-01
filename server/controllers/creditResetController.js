// creditResetController.js
// Controller for manual credit reset operations (admin only)
import { query } from '../config/database.js';
import redisClient from '../config/redis.js';

export const CreditResetController = {
  // Manual trigger for monthly credit reset (admin only)
  async manualMonthlyReset(req, res) {
    try {
      console.log('[CREDIT RESET] Manual monthly reset triggered by admin');
      
      // Update credits in DB: 55 for BYOK, 25 for Platform, 0 for unset preference
      const updateResult = await query(`
        UPDATE users 
        SET credits_remaining = CASE 
            WHEN api_key_preference = 'byok' THEN 55 
            WHEN api_key_preference = 'platform' THEN 25 
            ELSE 0 
        END,
        last_credit_reset = NOW()
        WHERE api_key_preference IS NOT NULL
      `);
      
      console.log(`[CREDIT RESET] Updated credits for ${updateResult.rowCount} users in database`);

      // Fetch all users with preferences and sync Redis cache
      const { rows: users } = await query(`
        SELECT id, api_key_preference, credits_remaining 
        FROM users 
        WHERE api_key_preference IS NOT NULL
      `);
      
      let redisUpdates = 0;
      for (const user of users) {
        try {
          // Update Redis cache with new credit balance
          await redisClient.setCredits(user.id, user.credits_remaining);
          redisUpdates++;
        } catch (redisError) {
          console.error(`[CREDIT RESET] Failed to update Redis for user ${user.id}:`, redisError.message);
        }
      }
      
      console.log(`[CREDIT RESET] Manual reset completed successfully!`);
      console.log(`[CREDIT RESET] Database updates: ${updateResult.rowCount}, Redis updates: ${redisUpdates}`);
      
      res.json({
        success: true,
        message: 'Monthly credit reset completed successfully',
        stats: {
          databaseUpdates: updateResult.rowCount,
          redisUpdates,
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
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      // Get last reset info from database
      const { rows } = await query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN api_key_preference = 'byok' THEN 1 END) as byok_users,
          COUNT(CASE WHEN api_key_preference = 'platform' THEN 1 END) as platform_users,
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
            platformUsers: parseInt(stats.platform_users)
          },
          creditAmounts: {
            byok: 55,
            platform: 25
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