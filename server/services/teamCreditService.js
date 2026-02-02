// teamCreditService.js
// Service for managing team credits with context-aware deduction
import { query } from '../config/database.js';
import redisClient from '../config/redis.js';
import { v4 as uuidv4 } from 'uuid';

export const TeamCreditService = {
  /**
   * Get credits for team or user based on context
   * @param {number} userId - User ID
   * @param {number|null} teamId - Team ID (null for personal context)
   * @returns {Promise<{credits: number, source: 'user'|'team'}>}
   */
  async getCredits(userId, teamId = null) {
    try {
      if (teamId) {
        // Team context - get team credits
        const result = await query(
          'SELECT credits_remaining FROM teams WHERE id = $1',
          [teamId]
        );
        
        if (result.rows.length === 0) {
          throw new Error('Team not found');
        }
        
        return {
          credits: result.rows[0].credits_remaining,
          source: 'team'
        };
      } else {
        // Personal context - get user credits
        let credits = await redisClient.getCredits(userId);
        
        if (credits === null) {
          const result = await query(
            'SELECT credits_remaining FROM users WHERE id = $1',
            [userId]
          );
          
          if (result.rows.length === 0) {
            throw new Error('User not found');
          }
          
          credits = result.rows[0].credits_remaining;
          await redisClient.setCredits(userId, credits);
        }
        
        return {
          credits: parseFloat(credits),
          source: 'user'
        };
      }
    } catch (error) {
      console.error('[TEAM CREDIT] Get credits error:', error);
      throw error;
    }
  },

  /**
   * Deduct credits from team or user based on context
   * @param {number} userId - User making the request
   * @param {number|null} teamId - Team ID (null for personal)
   * @param {number} amount - Credit amount to deduct
   * @param {string} operation - Operation type
   * @param {string} description - Transaction description
   */
  async deductCredits(userId, teamId, amount, operation, description = '') {
    try {
      const roundedAmount = Math.round(amount * 100) / 100;
      
      if (teamId) {
        // Team context - deduct from team credits
        console.log(`[TEAM CREDIT] Deducting ${roundedAmount} from team ${teamId}`);
        
        // Check team balance
        const teamResult = await query(
          'SELECT credits_remaining FROM teams WHERE id = $1',
          [teamId]
        );
        
        if (teamResult.rows.length === 0) {
          throw new Error('Team not found');
        }
        
        const teamCredits = teamResult.rows[0].credits_remaining;
        
        if (teamCredits < roundedAmount) {
          throw new Error(`Insufficient team credits. Required: ${roundedAmount}, Available: ${teamCredits}`);
        }
        
        // Deduct from team
        await query(
          'UPDATE teams SET credits_remaining = credits_remaining - $1 WHERE id = $2',
          [roundedAmount, teamId]
        );
        
        // Log transaction
        const transactionId = uuidv4();
        await query(
          `INSERT INTO credit_transactions (id, user_id, type, credits_amount, description, service_name, team_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [transactionId, userId, 'usage', roundedAmount, `[Team] ${operation}: ${description}`, 'team-workspace', teamId]
        );
        
        return {
          success: true,
          remainingCredits: teamCredits - roundedAmount,
          source: 'team'
        };
        
      } else {
        // Personal context - deduct from user credits (using Redis)
        console.log(`[USER CREDIT] Deducting ${roundedAmount} from user ${userId}`);
        
        const currentCredits = await redisClient.getCredits(userId);
        
        if (currentCredits === null) {
          const result = await query(
            'SELECT credits_remaining FROM users WHERE id = $1',
            [userId]
          );
          
          if (result.rows.length === 0) {
            throw new Error('User not found');
          }
          
          const dbCredits = parseFloat(result.rows[0].credits_remaining);
          await redisClient.setCredits(userId, dbCredits);
          
          if (dbCredits < roundedAmount) {
            throw new Error(`Insufficient credits. Required: ${roundedAmount}, Available: ${dbCredits}`);
          }
        } else if (parseFloat(currentCredits) < roundedAmount) {
          throw new Error(`Insufficient credits. Required: ${roundedAmount}, Available: ${currentCredits}`);
        }
        
        // Deduct from Redis
        const newBalance = await redisClient.deductCredits(userId, roundedAmount);
        
        if (newBalance === null) {
          throw new Error('Failed to deduct credits from Redis');
        }
        
        // Mark user as dirty for sync
        await redisClient.addDirtyUser(userId);
        
        // Log transaction
        const transactionId = uuidv4();
        await query(
          `INSERT INTO credit_transactions (id, user_id, type, credits_amount, description, service_name, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [transactionId, userId, 'usage', roundedAmount, `${operation}: ${description}`, 'personal-workspace']
        );
        
        return {
          success: true,
          remainingCredits: newBalance,
          source: 'user'
        };
      }
    } catch (error) {
      console.error('[TEAM CREDIT] Deduct error:', error);
      throw error;
    }
  },

  /**
   * Get user's team context
   * @param {number} userId
   * @returns {Promise<number|null>} Team ID or null
   */
  async getUserTeamContext(userId) {
    try {
      const result = await query(
        'SELECT current_team_id FROM users WHERE id = $1',
        [userId]
      );
      
      return result.rows[0]?.current_team_id || null;
    } catch (error) {
      console.error('[TEAM CREDIT] Get team context error:', error);
      return null;
    }
  }
};
