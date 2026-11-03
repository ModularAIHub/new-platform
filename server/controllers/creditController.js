import jwt from 'jsonwebtoken';
import CreditService from '../services/creditService.js';
import agencyCreditService from '../services/agencyCreditService.js';
import { TeamCreditService } from '../services/teamCreditService.js';

const roundCredits = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
};

const normalizeAgencyContext = (req) => {
  const rawToken = String(req.headers['x-agency-token'] || '').trim();
  const requestedWorkspaceId = String(req.headers['x-agency-workspace-id'] || '').trim();

  if (!rawToken || !requestedWorkspaceId) {
    return null;
  }

  const decoded = jwt.verify(rawToken, process.env.JWT_SECRET || 'development-secret');
  const tokenWorkspaceId = String(decoded?.workspaceId || '').trim();
  const tokenUserId = String(decoded?.userId || '').trim();
  const agencyId = String(decoded?.agencyId || '').trim();

  if (!tokenWorkspaceId || tokenWorkspaceId !== requestedWorkspaceId) {
    throw Object.assign(new Error('Agency workspace token does not match the requested workspace'), {
      statusCode: 400,
      code: 'AGENCY_WORKSPACE_ID_MISMATCH',
    });
  }

  if (!agencyId) {
    throw Object.assign(new Error('Agency workspace token is missing agency scope'), {
      statusCode: 400,
      code: 'AGENCY_SCOPE_MISSING',
    });
  }

  if (req.user?.id && tokenUserId && String(req.user.id) !== tokenUserId) {
    throw Object.assign(new Error('Agency workspace token does not belong to this user'), {
      statusCode: 403,
      code: 'AGENCY_WORKSPACE_USER_MISMATCH',
    });
  }

  return {
    agencyId,
    workspaceId: tokenWorkspaceId,
    userId: tokenUserId || String(req.user?.id || ''),
  };
};

const resolveRequestedTeamId = (req) =>
  String(
    req.headers['x-team-id'] ||
    req.user?.current_team_id ||
    req.user?.team_id ||
    req.user?.teamId ||
    req.user?.team_memberships?.[0]?.team_id ||
    req.user?.team_memberships?.[0]?.teamId ||
    ''
  ).trim() || null;

const resolveCreditScope = async (req) => {
  try {
    const agency = normalizeAgencyContext(req);
    if (agency) {
      return { scope: 'agency', agency, teamId: null };
    }
  } catch (error) {
    throw error;
  }

  const teamId = await TeamCreditService.resolveTeamContext(req.user?.id, resolveRequestedTeamId(req));
  if (teamId) {
    return { scope: 'team', agency: null, teamId };
  }

  return { scope: 'personal', agency: null, teamId: null };
};

class CreditController {
  static async getBalance(req, res) {
    try {
      const userId = req.user.id;
      const { scope, agency, teamId } = await resolveCreditScope(req);

      if (scope === 'agency') {
        const balance = await agencyCreditService.getBalance(agency.agencyId);
        return res.json({
          balance,
          creditsRemaining: balance,
          source: 'agency',
          scope: 'agency',
          agencyId: agency.agencyId,
          workspaceId: agency.workspaceId,
        });
      }

      if (scope === 'team') {
        const { credits } = await TeamCreditService.getCredits(userId, teamId);
        return res.json({
          balance: credits,
          creditsRemaining: credits,
          source: 'team',
          scope: 'team',
          teamId,
        });
      }

      const balance = await CreditService.getBalance(userId);
      return res.json({
        balance,
        creditsRemaining: balance,
        source: 'personal',
        scope: 'personal',
      });
    } catch (error) {
      console.error('Get balance error:', error);
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get credit balance',
        code: error.code || 'BALANCE_ERROR',
      });
    }
  }

  static async deductCredits(req, res) {
    try {
      const userId = req.user.id;
      const { operation, description, cost } = req.body;

      if (!operation) {
        return res.status(400).json({
          error: 'Operation is required',
          code: 'OPERATION_REQUIRED',
        });
      }

      const amount = roundCredits(cost);
      const { scope, agency, teamId } = await resolveCreditScope(req);

      if (scope === 'agency') {
        const result = await agencyCreditService.deductCredits({
          agencyId: agency.agencyId,
          workspaceId: agency.workspaceId,
          userId,
          amount,
          operation,
          description,
          serviceName: 'platform-agency',
        });

        if (!result.success) {
          return res.status(result.error === 'insufficient_credits' ? 400 : 404).json({
            error: result.error === 'insufficient_credits' ? 'Insufficient credits' : 'Agency credit pool not found',
            code: result.error === 'insufficient_credits' ? 'INSUFFICIENT_CREDITS' : 'AGENCY_CREDITS_NOT_FOUND',
            creditsRequired: result.creditsRequired ?? amount,
            creditsAvailable: result.creditsAvailable ?? 0,
            source: 'agency',
            agencyId: agency.agencyId,
            workspaceId: agency.workspaceId,
          });
        }

        return res.json({
          message: 'Credits deducted successfully',
          creditsDeducted: result.creditsDeducted,
          creditsRemaining: result.remainingCredits,
          transactionId: result.transactionId,
          source: 'agency',
          scope: 'agency',
          agencyId: agency.agencyId,
          workspaceId: agency.workspaceId,
        });
      }

      if (scope === 'team') {
        const result = await TeamCreditService.deductCredits(userId, teamId, amount, operation, description);
        return res.json({
          message: 'Credits deducted successfully',
          creditsDeducted: result.creditsDeducted,
          creditsRemaining: result.creditsRemaining,
          transactionId: result.transactionId,
          source: 'team',
          scope: 'team',
          teamId,
        });
      }

      const result = await CreditService.deductCredits(userId, operation, description, amount);
      return res.json({
        message: 'Credits deducted successfully',
        creditsDeducted: result.creditsDeducted,
        creditsRemaining: result.creditsRemaining,
        transactionId: result.transactionId,
        source: 'personal',
        scope: 'personal',
      });
    } catch (error) {
      console.error('Deduct credits error:', error);
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to deduct credits',
        code: error.code || 'DEDUCT_ERROR',
      });
    }
  }

  static async getTransactionHistory(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const type = req.query.type || null;
      const { scope, agency, teamId } = await resolveCreditScope(req);

      if (scope === 'agency') {
        const result = await agencyCreditService.getUsageHistory(agency.agencyId, { page, limit, type });
        return res.json({
          ...result,
          source: 'agency',
          scope: 'agency',
          agencyId: agency.agencyId,
          workspaceId: agency.workspaceId,
        });
      }

      if (scope === 'team') {
        const result = await TeamCreditService.getTransactionHistory(userId, teamId, page, limit, type);
        return res.json({
          ...result,
          source: 'team',
          scope: 'team',
          teamId,
        });
      }

      const result = await CreditService.getTransactionHistory(userId, page, limit);
      return res.json({
        ...result,
        source: 'personal',
        scope: 'personal',
      });
    } catch (error) {
      console.error('Get history error:', error);
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get transaction history',
        code: error.code || 'HISTORY_ERROR',
      });
    }
  }

  static async addCredits(req, res) {
    try {
      const userId = req.user.id;
      const {
        amount,
        description,
        costInRupees,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          error: 'Valid amount is required',
          code: 'INVALID_AMOUNT',
        });
      }

      const { scope, agency, teamId } = await resolveCreditScope(req);

      if (scope === 'agency') {
        const result = await agencyCreditService.addCredits({
          agencyId: agency.agencyId,
          workspaceId: agency.workspaceId,
          userId,
          amount,
          description,
          serviceName: 'platform-agency',
          type: 'refund',
        });

        return res.json({
          message: 'Credits added successfully',
          creditsAdded: result.creditsAdded,
          creditsRemaining: result.creditsRemaining,
          transactionId: result.transactionId,
          source: 'agency',
          scope: 'agency',
          agencyId: agency.agencyId,
          workspaceId: agency.workspaceId,
        });
      }

      if (scope === 'team') {
        const transactionData = {
          costInRupees,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        };
        const transactionType =
          costInRupees || razorpayOrderId || razorpayPaymentId || razorpaySignature
            ? 'purchase'
            : 'refund';
        const result = await TeamCreditService.addCredits(
          userId,
          teamId,
          amount,
          description,
          transactionData,
          { type: transactionType }
        );

        return res.json({
          message: 'Credits added successfully',
          creditsAdded: result.creditsAdded,
          creditsRemaining: result.creditsRemaining,
          transactionId: result.transactionId,
          source: 'team',
          scope: 'team',
          teamId,
        });
      }

      const transactionData = {
        costInRupees,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      };

      const result = await CreditService.addCredits(userId, amount, description, transactionData);
      return res.json({
        message: 'Credits added successfully',
        creditsAdded: result.creditsAdded,
        creditsRemaining: result.creditsRemaining,
        transactionId: result.transactionId,
        source: 'personal',
        scope: 'personal',
      });
    } catch (error) {
      console.error('Add credits error:', error);
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to add credits',
        code: error.code || 'ADD_CREDITS_ERROR',
      });
    }
  }

  static async checkSufficientCredits(req, res) {
    try {
      const userId = req.user.id;
      const { operation } = req.query;

      if (!operation) {
        return res.status(400).json({
          error: 'Operation is required',
          code: 'OPERATION_REQUIRED',
        });
      }

      const { scope, agency, teamId } = await resolveCreditScope(req);

      if (scope === 'agency') {
        const costs = CreditService.getCreditCosts();
        const cost = roundCredits(costs[operation] || 1);
        const result = await agencyCreditService.checkCredits(agency.agencyId, cost);
        return res.json({
          hasSufficient: result.success,
          currentBalance: result.available,
          requiredCredits: cost,
          operation,
          source: 'agency',
          scope: 'agency',
          agencyId: agency.agencyId,
          workspaceId: agency.workspaceId,
        });
      }

      if (scope === 'team') {
        const costs = CreditService.getCreditCosts();
        const cost = roundCredits(costs[operation] || 1);
        const result = await TeamCreditService.checkCredits(userId, teamId, cost);
        return res.json({
          hasSufficient: result.success,
          currentBalance: result.available,
          requiredCredits: cost,
          operation,
          source: 'team',
          scope: 'team',
          teamId,
        });
      }

      const hasSufficient = await CreditService.hasSufficientCredits(userId, operation);
      const balance = await CreditService.getBalance(userId);
      const costs = CreditService.getCreditCosts();
      const cost = costs[operation] || 1;

      return res.json({
        hasSufficient,
        currentBalance: balance,
        requiredCredits: cost,
        operation,
        source: 'personal',
        scope: 'personal',
      });
    } catch (error) {
      console.error('Check sufficient credits error:', error);
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to check credits',
        code: error.code || 'CHECK_ERROR',
      });
    }
  }

  static async getCreditCosts(req, res) {
    try {
      const costs = CreditService.getCreditCosts();

      return res.json({
        costs,
        operations: Object.keys(costs),
      });
    } catch (error) {
      console.error('Get credit costs error:', error);
      return res.status(500).json({
        error: 'Failed to get credit costs',
        code: 'COSTS_ERROR',
      });
    }
  }

  static async emergencySync(req, res) {
    try {
      const userId = req.user.id;
      await CreditService.emergencySync(userId);
      return res.json({
        message: 'Emergency sync completed successfully',
      });
    } catch (error) {
      console.error('Emergency sync error:', error);
      return res.status(500).json({
        error: 'Emergency sync failed',
        code: 'SYNC_ERROR',
      });
    }
  }

  static async healthCheck(req, res) {
    try {
      const health = await CreditService.healthCheck();
      return res.json(health);
    } catch (error) {
      console.error('Health check error:', error);
      return res.status(500).json({
        error: 'Health check failed',
        code: 'HEALTH_ERROR',
      });
    }
  }

  static async loadUserToRedis(req, res) {
    try {
      const userId = req.user.id;
      const result = await CreditService.loadUserToRedis(userId);
      return res.json({
        message: 'User data loaded to Redis successfully',
        data: result,
      });
    } catch (error) {
      console.error('Load user to Redis error:', error);
      return res.status(500).json({
        error: 'Failed to load user data to Redis',
        code: 'LOAD_ERROR',
      });
    }
  }
}

export default CreditController;
