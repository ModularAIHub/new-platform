import { v4 as uuidv4 } from 'uuid';
import { pool, query } from '../config/database.js';

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundCredits = (value) => Math.round(toNumber(value, 0) * 100) / 100;

class AgencyCreditService {
  async getBalance(agencyId) {
    const result = await query(
      'SELECT credits_remaining FROM agency_accounts WHERE id = $1 LIMIT 1',
      [agencyId]
    );

    if (result.rows.length === 0) {
      throw new Error('Agency not found');
    }

    return roundCredits(result.rows[0].credits_remaining || 0);
  }

  async checkCredits(agencyId, amount) {
    const required = roundCredits(amount);
    const available = await this.getBalance(agencyId);

    return {
      success: available >= required,
      available,
      creditsAvailable: available,
      required,
      creditsRequired: required,
      source: 'agency',
    };
  }

  async deductCredits({
    agencyId,
    workspaceId = null,
    userId,
    amount,
    operation,
    description = '',
    serviceName = 'agency-workspace',
  }) {
    const roundedAmount = roundCredits(amount);

    if (roundedAmount <= 0) {
      const remainingCredits = await this.getBalance(agencyId);
      return {
        success: true,
        source: 'agency',
        creditsDeducted: 0,
        remainingCredits,
      };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const balanceResult = await client.query(
        'SELECT credits_remaining FROM agency_accounts WHERE id = $1 FOR UPDATE',
        [agencyId]
      );

      if (balanceResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: 'agency_not_found',
          source: 'agency',
          available: 0,
          creditsAvailable: 0,
          required: roundedAmount,
          creditsRequired: roundedAmount,
        };
      }

      const currentBalance = roundCredits(balanceResult.rows[0].credits_remaining || 0);
      if (currentBalance < roundedAmount) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: 'insufficient_credits',
          source: 'agency',
          available: currentBalance,
          creditsAvailable: currentBalance,
          required: roundedAmount,
          creditsRequired: roundedAmount,
        };
      }

      const newBalance = roundCredits(currentBalance - roundedAmount);
      await client.query(
        'UPDATE agency_accounts SET credits_remaining = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newBalance, agencyId]
      );

      const transactionId = uuidv4();
      await client.query(
        `INSERT INTO credit_transactions
          (id, user_id, type, credits_amount, description, service_name, agency_id, agency_workspace_id, created_at)
         VALUES
          ($1, $2, 'usage', $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
        [
          transactionId,
          userId,
          -roundedAmount,
          description || `${operation} - ${roundedAmount} credits deducted`,
          serviceName,
          agencyId,
          workspaceId,
        ]
      );

      await client.query('COMMIT');

      return {
        success: true,
        source: 'agency',
        transactionId,
        creditsDeducted: roundedAmount,
        remainingCredits: newBalance,
      };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async addCredits({
    agencyId,
    workspaceId = null,
    userId,
    amount,
    description = '',
    serviceName = 'agency-workspace',
    type = 'refund',
  }) {
    const roundedAmount = roundCredits(amount);

    if (roundedAmount <= 0) {
      const newBalance = await this.getBalance(agencyId);
      return {
        success: true,
        source: 'agency',
        creditsAdded: 0,
        creditsRemaining: newBalance,
      };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const balanceResult = await client.query(
        'SELECT credits_remaining FROM agency_accounts WHERE id = $1 FOR UPDATE',
        [agencyId]
      );

      if (balanceResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: 'agency_not_found',
          source: 'agency',
        };
      }

      const currentBalance = roundCredits(balanceResult.rows[0].credits_remaining || 0);
      const newBalance = roundCredits(currentBalance + roundedAmount);

      await client.query(
        'UPDATE agency_accounts SET credits_remaining = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newBalance, agencyId]
      );

      const transactionId = uuidv4();
      await client.query(
        `INSERT INTO credit_transactions
          (id, user_id, type, credits_amount, description, service_name, agency_id, agency_workspace_id, created_at)
         VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
        [
          transactionId,
          userId,
          type,
          roundedAmount,
          description || `${type} - ${roundedAmount} credits added`,
          serviceName,
          agencyId,
          workspaceId,
        ]
      );

      await client.query('COMMIT');

      return {
        success: true,
        source: 'agency',
        transactionId,
        creditsAdded: roundedAmount,
        creditsRemaining: newBalance,
      };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client?.release?.();
    }
  }

  async getUsageHistory(agencyId, { page = 1, limit = 20, type = null } = {}) {
    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number.parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    const params = [agencyId];
    let whereClause = 'agency_id = $1';

    if (type) {
      params.push(type);
      whereClause += ` AND type = $${params.length}`;
    }

    const countResult = await query(
      `SELECT COUNT(*) AS count
       FROM credit_transactions
       WHERE ${whereClause}`,
      params
    );

    params.push(safeLimit, offset);
    const result = await query(
      `SELECT id, user_id, type, credits_amount, description, service_name, agency_id, agency_workspace_id, created_at
       FROM credit_transactions
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      transactions: result.rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalCount: Number.parseInt(countResult.rows[0]?.count || '0', 10),
        totalPages: Math.ceil(Number.parseInt(countResult.rows[0]?.count || '0', 10) / safeLimit) || 1,
      },
    };
  }
}

const agencyCreditService = new AgencyCreditService();
export default agencyCreditService;
