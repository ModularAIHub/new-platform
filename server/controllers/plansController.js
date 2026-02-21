import { query } from '../config/database.js';
import { CREDIT_TIERS, getCreditsForPlan } from '../utils/creditTiers.js';
import { invalidateAuthUserCache } from '../middleware/auth.js';

// Plan configurations
const PLAN_LIMITS = {
    free: {
        platformCredits: CREDIT_TIERS.free.platform,
        byokCredits: CREDIT_TIERS.free.byok,
        profilesPerPlatform: 1,
        totalSocialAccounts: 2,
        features: ['basic_ai_generation', 'built_in_keys', 'own_keys'],
        support: 'community'
    },
    pro: {
        platformCredits: CREDIT_TIERS.pro.platform,
        byokCredits: CREDIT_TIERS.pro.byok,
        profilesPerPlatform: 8,
        totalSocialAccounts: 8,
        features: ['basic_ai_generation', 'image_generation', 'built_in_keys', 'own_keys', 'team_collaboration', 'bulk_scheduling', 'advanced_analytics', 'priority_email_support'],
        support: 'priority_email',
        teamMembers: 5 // max team size including owner
    },
    enterprise: {
        platformCredits: CREDIT_TIERS.enterprise.platform,
        byokCredits: CREDIT_TIERS.enterprise.byok,
        profilesPerPlatform: 15,
        totalSocialAccounts: 25,
        features: ['basic_ai_generation', 'image_generation', 'built_in_keys', 'own_keys', 'team_collaboration', 'bulk_scheduling', 'advanced_analytics', 'priority_support', 'custom_integrations'],
        support: 'priority',
        teamMembers: 15
    }
};

function isTransientDbError(error) {
    const code = error?.code;
    const message = String(error?.message || '').toLowerCase();

    if (['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ECONNABORTED'].includes(code)) {
        return true;
    }

    return (
        message.includes('timeout') ||
        message.includes('connection terminated') ||
        message.includes('terminated unexpectedly') ||
        message.includes('could not connect')
    );
}

function getRequiredPlanForFeature(featureName) {
    const featurePlanMap = {
        team_collaboration: 'pro',
        priority_support: 'pro',
        email_support: 'pro',
        image_generation: 'pro',
        bulk_scheduling: 'pro',
        advanced_analytics: 'pro'
    };
    return featurePlanMap[featureName] || 'free';
}

function getPlanPrice(planType) {
    if (planType === 'free') return 0;
    if (planType === 'pro') return 399;
    return 1100;
}

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function buildPlanPayload(planType) {
    const planConfig = PLAN_LIMITS[planType] || PLAN_LIMITS.free;

    return {
        type: planType,
        name: planType.charAt(0).toUpperCase() + planType.slice(1),
        credits: planConfig.platformCredits,
        platformCredits: planConfig.platformCredits,
        byokCredits: planConfig.byokCredits,
        bonusCredits: planConfig.byokCredits,
        profilesPerPlatform: planConfig.profilesPerPlatform,
        totalSocialAccounts: planConfig.totalSocialAccounts,
        features: planConfig.features,
        support: planConfig.support,
        teamMembers: planConfig.teamMembers || 0,
        price: getPlanPrice(planType)
    };
}

class PlansController {
    static async getLimits(req, res) {
        try {
            const result = await query(
                'SELECT plan_type, credits_remaining, current_team_id, api_key_preference FROM users WHERE id = $1',
                [req.user.id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
            }

            const user = result.rows[0];
            // Default to 'free' if plan_type is null
            const userPlanType = PLAN_LIMITS[user.plan_type] ? user.plan_type : 'free';
            
            // Check if user is part of a Pro/Enterprise team
            let teamPlanType = null;
            if (user.current_team_id) {
                const teamResult = await query('SELECT plan_type FROM teams WHERE id = $1', [user.current_team_id]);
                if (teamResult.rows.length > 0) {
                    teamPlanType = teamResult.rows[0].plan_type;
                }
            }
            
            // Use the higher plan type (individual vs team)
            const effectivePlanType = teamPlanType && (teamPlanType === 'pro' || teamPlanType === 'enterprise') 
                ? teamPlanType 
                : userPlanType;
            
            const planConfig = PLAN_LIMITS[effectivePlanType] || PLAN_LIMITS.free;

            const apiKeysResult = await query('SELECT COUNT(*) as key_count FROM user_api_keys WHERE user_id = $1 AND is_active = true', [req.user.id]);
            const hasOwnKeys = parseInt(apiKeysResult.rows[0].key_count) > 0;
            const effectiveCredits = getCreditsForPlan(effectivePlanType, user.api_key_preference, { defaultToPlatform: false });

            res.json({
                currentPlan: {
                    type: effectivePlanType,
                    name: effectivePlanType.charAt(0).toUpperCase() + effectivePlanType.slice(1),
                    creditsRemaining: toNumber(user.credits_remaining, 0),
                    effectiveCredits,
                    platformCredits: planConfig.platformCredits,
                    byokCredits: planConfig.byokCredits,
                    hasOwnKeys,
                    apiKeyPreference: user.api_key_preference || null,
                    individualPlan: userPlanType,
                    teamPlan: teamPlanType,
                    hasTeamAccess: teamPlanType && (teamPlanType === 'pro' || teamPlanType === 'enterprise')
                },
                limits: {
                    profilesPerPlatform: planConfig.profilesPerPlatform,
                    totalSocialAccounts: planConfig.totalSocialAccounts,
                    teamMembers: planConfig.teamMembers || 0
                },
                features: planConfig.features,
                support: planConfig.support,
                availablePlans: Object.keys(PLAN_LIMITS).map((planType) => buildPlanPayload(planType))
            });
        } catch (error) {
            if (isTransientDbError(error)) {
                console.warn('Transient DB error in getLimits, returning degraded response:', error?.message || error);
                const rawFallbackPlanType = req.user?.plan_type || req.user?.planType || 'free';
                const fallbackPlanType = PLAN_LIMITS[rawFallbackPlanType] ? rawFallbackPlanType : 'free';
                const planConfig = PLAN_LIMITS[fallbackPlanType] || PLAN_LIMITS.free;
                const fallbackPreference = req.user?.api_key_preference || req.user?.apiKeyPreference || null;

                return res.json({
                    currentPlan: {
                        type: fallbackPlanType,
                        name: fallbackPlanType.charAt(0).toUpperCase() + fallbackPlanType.slice(1),
                        creditsRemaining: toNumber(req.user?.credits_remaining || req.user?.creditsRemaining, 0),
                        effectiveCredits: getCreditsForPlan(fallbackPlanType, fallbackPreference, { defaultToPlatform: false }),
                        platformCredits: planConfig.platformCredits,
                        byokCredits: planConfig.byokCredits,
                        hasOwnKeys: false,
                        apiKeyPreference: fallbackPreference,
                        individualPlan: fallbackPlanType,
                        teamPlan: null,
                        hasTeamAccess: false,
                        degraded: true
                    },
                    limits: {
                        profilesPerPlatform: planConfig.profilesPerPlatform,
                        totalSocialAccounts: planConfig.totalSocialAccounts,
                        teamMembers: planConfig.teamMembers || 0
                    },
                    features: planConfig.features,
                    support: planConfig.support,
                    availablePlans: Object.keys(PLAN_LIMITS).map((planType) => buildPlanPayload(planType))
                });
            }

            console.error('Get plan limits error:', error?.message || error);
            res.status(500).json({ error: 'Failed to get plan limits', code: 'PLAN_LIMITS_ERROR' });
        }
    }

    static async upgradePlan(req, res) {
        try {
            const { planType, isTrial } = req.body;
            if (!PLAN_LIMITS[planType]) {
                return res.status(400).json({ error: 'Invalid plan type', code: 'INVALID_PLAN_TYPE' });
            }
            if (!isTrial) {
                return res.status(402).json({
                    error: 'Direct upgrades are disabled. Please complete payment to upgrade your plan.',
                    code: 'PAYMENT_REQUIRED'
                });
            }

            const currentResult = await query(
                'SELECT plan_type, credits_remaining, trial_ends_at, api_key_preference FROM users WHERE id = $1',
                [req.user.id]
            );
            if (currentResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
            }
            const currentPlan = currentResult.rows[0].plan_type || 'free';
            const currentCredits = toNumber(currentResult.rows[0].credits_remaining, 0);
            const currentPreference = currentResult.rows[0].api_key_preference || null;
            const existingTrialEndsAt = currentResult.rows[0].trial_ends_at;
            
            // Don't allow upgrade if already on enterprise
            if (currentPlan === 'enterprise' && planType === 'enterprise') {
                return res.status(400).json({ error: 'Already on highest plan', code: 'ALREADY_HIGHEST_PLAN' });
            }
            
            // For Pro trial signups, allow even if null plan
            if (currentPlan === 'pro' && planType === 'pro' && !isTrial) {
                return res.status(400).json({ error: 'Already on Pro plan', code: 'ALREADY_PRO_PLAN' });
            }
            
            const newPlanConfig = PLAN_LIMITS[planType];
            const targetCredits = getCreditsForPlan(planType, currentPreference, { defaultToPlatform: false });
            const newCredits = currentPreference ? Math.max(currentCredits, targetCredits) : currentCredits;
            const bonusCredits = Math.max(0, newCredits - currentCredits);
            
            // Set trial end date if this is a trial upgrade
            let trialEndsAt = existingTrialEndsAt;
            if (isTrial && planType === 'pro' && !existingTrialEndsAt) {
                const trialEnd = new Date();
                trialEnd.setDate(trialEnd.getDate() + 14); // 14 days from now
                trialEndsAt = trialEnd;
            }
            
            // Update user with trial info
            if (trialEndsAt) {
                await query('UPDATE users SET plan_type = $1, credits_remaining = $2, trial_ends_at = $3, updated_at = NOW() WHERE id = $4', 
                    [planType, newCredits, trialEndsAt, req.user.id]);
            } else {
                await query('UPDATE users SET plan_type = $1, credits_remaining = $2, updated_at = NOW() WHERE id = $3', 
                    [planType, newCredits, req.user.id]);
            }
            invalidateAuthUserCache(req.user.id);
            
            res.json({
                message: isTrial ? 'Pro trial activated successfully' : 'Plan upgraded successfully',
                newPlan: {
                    type: planType,
                    name: planType.charAt(0).toUpperCase() + planType.slice(1),
                    creditsRemaining: newCredits,
                    bonusCredits,
                    platformCredits: newPlanConfig.platformCredits,
                    byokCredits: newPlanConfig.byokCredits,
                    features: newPlanConfig.features,
                    support: newPlanConfig.support,
                    isTrial: isTrial || false,
                    trialEndsAt: trialEndsAt
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
                    price: getPlanPrice(planType),
                    credits: plan.platformCredits,
                    platformCredits: plan.platformCredits,
                    byokCredits: plan.byokCredits,
                    bonusCredits: plan.byokCredits,
                    profilesPerPlatform: plan.profilesPerPlatform,
                    totalSocialAccounts: plan.totalSocialAccounts,
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
            const planType = PLAN_LIMITS[result.rows[0].plan_type] ? result.rows[0].plan_type : 'free';
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


