import { authenticateToken } from '../middleware/auth.js';
import CreditService from '../services/creditService.js';

class CreditController {
    // Get credit balance
    static async getBalance(req, res) {
        try {
            const userId = req.user.id;
            const balance = await CreditService.getBalance(userId);

            res.json({
                creditsRemaining: balance
            });
        } catch (error) {
            console.error('Get balance error:', error);
            res.status(500).json({
                error: 'Failed to get credit balance',
                code: 'BALANCE_ERROR'
            });
        }
    }

    // Deduct credits (used by modules)
    static async deductCredits(req, res) {
        try {
            const userId = req.user.id;
            const { operation, description, cost } = req.body;

            if (!operation) {
                return res.status(400).json({
                    error: 'Operation is required',
                    code: 'OPERATION_REQUIRED'
                });
            }

            const result = await CreditService.deductCredits(userId, operation, description, cost);

            res.json({
                message: 'Credits deducted successfully',
                creditsDeducted: result.creditsDeducted,
                creditsRemaining: result.creditsRemaining,
                transactionId: result.transactionId
            });
        } catch (error) {
            console.error('Deduct credits error:', error);

            if (error.message === 'Insufficient credits') {
                return res.status(400).json({
                    error: 'Insufficient credits',
                    code: 'INSUFFICIENT_CREDITS'
                });
            }

            if (error.message === 'User not found') {
                return res.status(404).json({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            res.status(500).json({
                error: 'Failed to deduct credits',
                code: 'DEDUCT_ERROR'
            });
        }
    }

    // Get transaction history
    static async getTransactionHistory(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await CreditService.getTransactionHistory(userId, page, limit);

            res.json(result);
        } catch (error) {
            console.error('Get history error:', error);
            res.status(500).json({
                error: 'Failed to get transaction history',
                code: 'HISTORY_ERROR'
            });
        }
    }

    // Add credits (for purchases)
    static async addCredits(req, res) {
        try {
            const userId = req.user.id;
            const {
                amount,
                description,
                costInRupees,
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature
            } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    error: 'Valid amount is required',
                    code: 'INVALID_AMOUNT'
                });
            }

            const transactionData = {
                costInRupees,
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature
            };

            const result = await CreditService.addCredits(userId, amount, description, transactionData);

            res.json({
                message: 'Credits added successfully',
                creditsAdded: result.creditsAdded,
                creditsRemaining: result.creditsRemaining,
                transactionId: result.transactionId
            });
        } catch (error) {
            console.error('Add credits error:', error);
            res.status(500).json({
                error: 'Failed to add credits',
                code: 'ADD_CREDITS_ERROR'
            });
        }
    }

    // Check if user has sufficient credits
    static async checkSufficientCredits(req, res) {
        try {
            const userId = req.user.id;
            const { operation } = req.query;

            if (!operation) {
                return res.status(400).json({
                    error: 'Operation is required',
                    code: 'OPERATION_REQUIRED'
                });
            }

            const hasSufficient = await CreditService.hasSufficientCredits(userId, operation);
            const balance = await CreditService.getBalance(userId);
            const costs = CreditService.getCreditCosts();
            const cost = costs[operation] || 1;

            res.json({
                hasSufficient,
                currentBalance: balance,
                requiredCredits: cost,
                operation
            });
        } catch (error) {
            console.error('Check sufficient credits error:', error);
            res.status(500).json({
                error: 'Failed to check credits',
                code: 'CHECK_ERROR'
            });
        }
    }

    // Get credit costs for operations
    static async getCreditCosts(req, res) {
        try {
            const costs = CreditService.getCreditCosts();

            res.json({
                costs,
                operations: Object.keys(costs)
            });
        } catch (error) {
            console.error('Get credit costs error:', error);
            res.status(500).json({
                error: 'Failed to get credit costs',
                code: 'COSTS_ERROR'
            });
        }
    }

    // Emergency sync (for critical operations)
    static async emergencySync(req, res) {
        try {
            const userId = req.user.id;

            await CreditService.emergencySync(userId);

            res.json({
                message: 'Emergency sync completed successfully'
            });
        } catch (error) {
            console.error('Emergency sync error:', error);
            res.status(500).json({
                error: 'Emergency sync failed',
                code: 'SYNC_ERROR'
            });
        }
    }

    // Health check
    static async healthCheck(req, res) {
        try {
            const health = await CreditService.healthCheck();

            res.json(health);
        } catch (error) {
            console.error('Health check error:', error);
            res.status(500).json({
                error: 'Health check failed',
                code: 'HEALTH_ERROR'
            });
        }
    }

    // Load user data to Redis (for debugging/admin)
    static async loadUserToRedis(req, res) {
        try {
            const userId = req.user.id;

            const result = await CreditService.loadUserToRedis(userId);

            res.json({
                message: 'User data loaded to Redis successfully',
                data: result
            });
        } catch (error) {
            console.error('Load user to Redis error:', error);
            res.status(500).json({
                error: 'Failed to load user data to Redis',
                code: 'LOAD_ERROR'
            });
        }
    }
}

export default CreditController;
