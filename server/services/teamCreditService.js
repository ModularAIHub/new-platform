import { v4 as uuidv4 } from 'uuid';
import { pool, query } from '../config/database.js';
import redisClient from '../config/redis.js';
import CreditService from './creditService.js';

const roundCredits = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
};

let hasCreditTransactionsTeamIdColumnCache = null;
let hasTeamMembersCreatedAtColumnCache = null;

const hasCreditTransactionsTeamIdColumn = async () => {
  if (typeof hasCreditTransactionsTeamIdColumnCache === 'boolean') {
    return hasCreditTransactionsTeamIdColumnCache;
  }

  const result = await query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'credit_transactions'
         AND column_name = 'team_id'
     ) AS exists`,
    []
  );

  hasCreditTransactionsTeamIdColumnCache = Boolean(result.rows[0]?.exists);
  return hasCreditTransactionsTeamIdColumnCache;
};

const hasTeamMembersCreatedAtColumn = async () => {
  if (typeof hasTeamMembersCreatedAtColumnCache === 'boolean') {
    return hasTeamMembersCreatedAtColumnCache;
  }

  const result = await query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'team_members'
         AND column_name = 'created_at'
     ) AS exists`,
    []
  );

  hasTeamMembersCreatedAtColumnCache = Boolean(result.rows[0]?.exists);
  return hasTeamMembersCreatedAtColumnCache;
};

export const TeamCreditService = {
  async resolveTeamContext(userId, requestedTeamId = null) {
    try {
      if (requestedTeamId) {
        const explicitResult = await query(
          `SELECT tm.team_id
           FROM team_members tm
           WHERE tm.user_id = $1
             AND tm.team_id = $2
             AND tm.status = 'active'
           LIMIT 1`,
          [userId, requestedTeamId]
        );

        return explicitResult.rows[0]?.team_id || null;
      }

      const supportsTeamMembersCreatedAt = await hasTeamMembersCreatedAtColumn();
      const teamMemberOrderColumn = supportsTeamMembersCreatedAt
        ? 'tm.created_at'
        : 'COALESCE(tm.joined_at, tm.invited_at)';

      const result = await query(
        `SELECT COALESCE(
            (
              SELECT tm.team_id
              FROM team_members tm
              WHERE tm.user_id = u.id
                AND tm.team_id = u.current_team_id
                AND tm.status = 'active'
              LIMIT 1
            ),
            (
              SELECT tm.team_id
              FROM team_members tm
              WHERE tm.user_id = u.id
                AND tm.status = 'active'
              ORDER BY ${teamMemberOrderColumn} ASC NULLS LAST
              LIMIT 1
            )
         ) AS team_id
         FROM users u
         WHERE u.id = $1
         LIMIT 1`,
        [userId]
      );

      return result.rows[0]?.team_id || null;
    } catch (error) {
      console.error('[TEAM CREDIT] Resolve team context error:', error);
      return null;
    }
  },

  async getCredits(userId, teamId = null) {
    try {
      if (teamId) {
        const result = await query(
          'SELECT credits_remaining FROM teams WHERE id = $1',
          [teamId]
        );

        if (result.rows.length === 0) {
          throw new Error('Team not found');
        }

        return {
          credits: roundCredits(result.rows[0].credits_remaining),
          source: 'team',
        };
      }

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
        credits: roundCredits(credits),
        source: 'user',
      };
    } catch (error) {
      console.error('[TEAM CREDIT] Get credits error:', error);
      throw error;
    }
  },

  async checkCredits(userId, teamId, amount) {
    try {
      const roundedAmount = roundCredits(amount);
      const { credits, source } = await this.getCredits(userId, teamId);
      return {
        success: credits >= roundedAmount,
        available: credits,
        creditsAvailable: credits,
        required: roundedAmount,
        creditsRequired: roundedAmount,
        source,
      };
    } catch (error) {
      console.error('[TEAM CREDIT] Check credits error:', error);
      return {
        success: false,
        available: 0,
        creditsAvailable: 0,
        required: roundCredits(amount),
        creditsRequired: roundCredits(amount),
        source: teamId ? 'team' : 'user',
      };
    }
  },

  async deductCredits(userId, teamId, amount, operation, description = '') {
    if (!teamId) {
      return CreditService.deductCredits(userId, operation, description, amount);
    }

    try {
      const roundedAmount = roundCredits(amount);
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        const teamResult = await client.query(
          'SELECT credits_remaining FROM teams WHERE id = $1 FOR UPDATE',
          [teamId]
        );

        if (teamResult.rows.length === 0) {
          throw Object.assign(new Error('Team not found'), {
            statusCode: 404,
            code: 'TEAM_NOT_FOUND',
          });
        }

        const teamCredits = roundCredits(teamResult.rows[0].credits_remaining);
        if (teamCredits < roundedAmount) {
          throw Object.assign(new Error('Insufficient team credits'), {
            statusCode: 400,
            code: 'INSUFFICIENT_CREDITS',
            creditsRequired: roundedAmount,
            creditsAvailable: teamCredits,
          });
        }

        const newBalance = roundCredits(teamCredits - roundedAmount);
        await client.query(
          'UPDATE teams SET credits_remaining = $1 WHERE id = $2',
          [newBalance, teamId]
        );

        const transactionId = uuidv4();
        try {
          await client.query(
            `INSERT INTO credit_transactions (
               id,
               user_id,
               type,
               credits_amount,
               description,
               service_name,
               team_id,
               created_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
              transactionId,
              userId,
              'usage',
              roundedAmount,
              `[Team] ${operation}${description ? `: ${description}` : ''}`,
              'team-workspace',
              teamId,
            ]
          );
        } catch (error) {
          if (!['42703', '42P01'].includes(error?.code)) throw error;
          await client.query(
            `INSERT INTO credit_transactions (
               id,
               user_id,
               type,
               credits_amount,
               description,
               service_name,
               created_at
             ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              transactionId,
              userId,
              'usage',
              roundedAmount,
              `[team:${teamId}] [Team] ${operation}${description ? `: ${description}` : ''}`,
              'team-workspace',
            ]
          );
        }

        await client.query('COMMIT');
        return {
          success: true,
          creditsDeducted: roundedAmount,
          creditsRemaining: newBalance,
          remainingCredits: newBalance,
          transactionId,
          source: 'team',
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('[TEAM CREDIT] Deduct error:', error);
      throw error;
    }
  },

  async addCredits(userId, teamId, amount, description = '', transactionData = {}, options = {}) {
    if (!teamId) {
      return CreditService.addCredits(userId, amount, description, transactionData);
    }

    try {
      const roundedAmount = roundCredits(amount);
      const type = String(options.type || 'purchase').trim() || 'purchase';
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        const teamResult = await client.query(
          'SELECT credits_remaining FROM teams WHERE id = $1 FOR UPDATE',
          [teamId]
        );

        if (teamResult.rows.length === 0) {
          throw Object.assign(new Error('Team not found'), {
            statusCode: 404,
            code: 'TEAM_NOT_FOUND',
          });
        }

        const teamCredits = roundCredits(teamResult.rows[0].credits_remaining);
        const newBalance = roundCredits(teamCredits + roundedAmount);

        await client.query(
          'UPDATE teams SET credits_remaining = $1 WHERE id = $2',
          [newBalance, teamId]
        );

        const transactionId = uuidv4();
        try {
          await client.query(
            `INSERT INTO credit_transactions (
               id,
               user_id,
               type,
               credits_amount,
               cost_in_rupees,
               razorpay_order_id,
               razorpay_payment_id,
               razorpay_signature,
               description,
               service_name,
               team_id,
               created_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
            [
              transactionId,
              userId,
              type,
              roundedAmount,
              transactionData.costInRupees || null,
              transactionData.razorpayOrderId || null,
              transactionData.razorpayPaymentId || null,
              transactionData.razorpaySignature || null,
              description || `[Team] ${type}`,
              'team-workspace',
              teamId,
            ]
          );
        } catch (error) {
          if (!['42703', '42P01'].includes(error?.code)) throw error;
          await client.query(
            `INSERT INTO credit_transactions (
               id,
               user_id,
               type,
               credits_amount,
               cost_in_rupees,
               razorpay_order_id,
               razorpay_payment_id,
               razorpay_signature,
               description,
               service_name,
               created_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
            [
              transactionId,
              userId,
              type,
              roundedAmount,
              transactionData.costInRupees || null,
              transactionData.razorpayOrderId || null,
              transactionData.razorpayPaymentId || null,
              transactionData.razorpaySignature || null,
              `[team:${teamId}] ${description || `[Team] ${type}`}`,
              'team-workspace',
            ]
          );
        }

        await client.query('COMMIT');
        return {
          success: true,
          creditsAdded: roundedAmount,
          creditsRemaining: newBalance,
          transactionId,
          source: 'team',
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('[TEAM CREDIT] Add credits error:', error);
      throw error;
    }
  },

  async getTransactionHistory(userId, teamId, page = 1, limit = 20, type = null) {
    if (!teamId) {
      return CreditService.getTransactionHistory(userId, page, limit);
    }

    try {
      const offset = (page - 1) * limit;
      const hasTeamIdColumn = await hasCreditTransactionsTeamIdColumn();
      const whereClauses = hasTeamIdColumn
        ? ['team_id = $1']
        : ["description LIKE $1"];
      const params = hasTeamIdColumn ? [teamId] : [`[team:${teamId}]%`];

      if (type) {
        whereClauses.push(`type = $${params.length + 1}`);
        params.push(type);
      }

      const whereSql = whereClauses.join(' AND ');
      const countResult = await query(
        `SELECT COUNT(*) FROM credit_transactions WHERE ${whereSql}`,
        params
      );
      const totalCount = Number.parseInt(countResult.rows[0]?.count || '0', 10);

      const result = await query(
        `SELECT id, type, credits_amount, cost_in_rupees, description, created_at
         FROM credit_transactions
         WHERE ${whereSql}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      );

      return {
        transactions: result.rows.map((row) => ({
          id: row.id,
          type: row.type,
          creditsAmount: row.credits_amount,
          costInRupees: row.cost_in_rupees,
          description: row.description,
          createdAt: row.created_at,
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error('[TEAM CREDIT] Get transaction history error:', error);
      throw error;
    }
  },

  async getUserTeamContext(userId) {
    return this.resolveTeamContext(userId);
  },
};
