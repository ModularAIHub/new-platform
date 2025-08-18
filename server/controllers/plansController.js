import { query } from '../config/database.js';

// Plan configurations
const PLAN_LIMITS = {
    free: {
        credits: 25,
        profilesPerPlatform: 1,
        features: ['basic_ai_generation', 'built_in_keys'],
        support: 'community'
    },
    pro: {
        credits: 150, // 200 with own keys
        profilesPerPlatform: 3,
        features: ['basic_ai_generation', 'built_in_keys', 'own_keys', 'email_support'],
        support: 'email'
    },
    enterprise: {
        credits: 500, // 750 with own keys
        profilesPerPlatform: 6,
        features: ['basic_ai_generation', 'built_in_keys', 'own_keys', 'team_collaboration', 'priority_support'],
        support: 'priority',
        teamMembers: 5
    }
};

function getRequiredPlanForFeature(featureName) {
    const featurePlanMap = {
        own_keys: 'pro',
        team_collaboration: 'enterprise',
        priority_support: 'enterprise',
        email_support: 'pro'
    };
    return featurePlanMap[featureName] || 'free';
}

class PlansController {
    static async getLimits(req, res) {
        try {
            const result = await query('SELECT plan_type, credits_remaining FROM users WHERE id = $1', [req.user.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
            }

            const user = result.rows[0];
            const planConfig = PLAN_LIMITS[user.plan_type] || PLAN_LIMITS.free;

            const apiKeysResult = await query('SELECT COUNT(*) as key_count FROM api_keys WHERE user_id = $1 AND is_active = true', [req.user.id]);
            const hasOwnKeys = parseInt(apiKeysResult.rows[0].key_count) > 0;
            let effectiveCredits = planConfig.credits;
            if (hasOwnKeys && user.plan_type !== 'free') {
                if (user.plan_type === 'pro') effectiveCredits = 200;
                else if (user.plan_type === 'enterprise') effectiveCredits = 750;
            }

            res.json({
                currentPlan: {
                    type: user.plan_type,
                    name: user.plan_type.charAt(0).toUpperCase() + user.plan_type.slice(1),
                    creditsRemaining: user.credits_remaining,
                    effectiveCredits,
                    hasOwnKeys
                },
                limits: {
                    profilesPerPlatform: planConfig.profilesPerPlatform,
                    teamMembers: planConfig.teamMembers || 0
                },
                features: planConfig.features,
                support: planConfig.support,
                availablePlans: Object.keys(PLAN_LIMITS).map((planType) => ({
                    type: planType,
                    name: planType.charAt(0).toUpperCase() + planType.slice(1),
                    credits: PLAN_LIMITS[planType].credits,
                    bonusCredits: planType === 'pro' ? 200 : planType === 'enterprise' ? 750 : 25,
                    profilesPerPlatform: PLAN_LIMITS[planType].profilesPerPlatform,
                    features: PLAN_LIMITS[planType].features,
                    support: PLAN_LIMITS[planType].support,
                    teamMembers: PLAN_LIMITS[planType].teamMembers || 0,
                    price: planType === 'free' ? 0 : planType === 'pro' ? 800 : 1100
                }))
            });
        } catch (error) {
            console.error('Get plan limits error:', error);
            res.status(500).json({ error: 'Failed to get plan limits', code: 'PLAN_LIMITS_ERROR' });
        }
    }

    static async upgradePlan(req, res) {
        try {
            const { planType } = req.body;
            const currentResult = await query('SELECT plan_type, credits_remaining FROM users WHERE id = $1', [req.user.id]);
            if (currentResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
            }
            const currentPlan = currentResult.rows[0].plan_type;
            const currentCredits = Number(currentResult.rows[0].credits_remaining);
            if (currentPlan === 'enterprise') {
                return res.status(400).json({ error: 'Already on highest plan', code: 'ALREADY_HIGHEST_PLAN' });
            }
            if (currentPlan === 'pro' && planType === 'pro') {
                return res.status(400).json({ error: 'Already on Pro plan', code: 'ALREADY_PRO_PLAN' });
            }
            const newPlanConfig = PLAN_LIMITS[planType];
            let bonusCredits = 0;
            if (planType === 'pro') bonusCredits = 150;
            else if (planType === 'enterprise') bonusCredits = 500;
            const newCredits = currentCredits + bonusCredits;
            await query('UPDATE users SET plan_type = $1, credits_remaining = $2, updated_at = NOW() WHERE id = $3', [planType, newCredits, req.user.id]);
            res.json({
                message: 'Plan upgraded successfully',
                newPlan: {
                    type: planType,
                    name: planType.charAt(0).toUpperCase() + planType.slice(1),
                    creditsRemaining: newCredits,
                    bonusCredits,
                    features: newPlanConfig.features,
                    support: newPlanConfig.support
                }
            });
        } catch (error) {
            console.error('Upgrade plan error:', error);
            res.status(500).json({ error: 'Failed to upgrade plan', code: 'UPGRADE_ERROR' });
        }
    }

    static async comparison(req, res) {
        try {
            const result = await query('SELECT plan_type FROM users WHERE id = $1', [req.user.id]);
            const currentPlan = result.rows.length > 0 ? result.rows[0].plan_type : 'free';
            const comparison = Object.keys(PLAN_LIMITS).map((planType) => {
                const plan = PLAN_LIMITS[planType];
                return {
                    type: planType,
                    name: planType.charAt(0).toUpperCase() + planType.slice(1),
                    price: planType === 'free' ? 0 : planType === 'pro' ? 800 : 1100,
                    credits: plan.credits,
                    bonusCredits: planType === 'pro' ? 200 : planType === 'enterprise' ? 750 : 25,
                    profilesPerPlatform: plan.profilesPerPlatform,
                    features: plan.features,
                    support: plan.support,
                    teamMembers: plan.teamMembers || 0,
                    isCurrentPlan: planType === currentPlan,
                    canUpgrade: planType !== currentPlan && planType !== 'free'
                };
            });
            res.json({ currentPlan, comparison });
        } catch (error) {
            console.error('Get plan comparison error:', error);
            res.status(500).json({ error: 'Failed to get plan comparison', code: 'COMPARISON_ERROR' });
        }
    }

    static async featureAccess(req, res) {
        try {
            const { featureName } = req.params;
            const result = await query('SELECT plan_type FROM users WHERE id = $1', [req.user.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
            }
            const planType = result.rows[0].plan_type;
            const planConfig = PLAN_LIMITS[planType] || PLAN_LIMITS.free;
            const hasAccess = planConfig.features.includes(featureName);
            res.json({ feature: featureName, hasAccess, planType, requiredPlan: hasAccess ? planType : getRequiredPlanForFeature(featureName) });
        } catch (error) {
            console.error('Check feature access error:', error);
            res.status(500).json({ error: 'Failed to check feature access', code: 'FEATURE_CHECK_ERROR' });
        }
    }
}

export default PlansController;


