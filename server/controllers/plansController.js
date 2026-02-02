import { query } from '../config/database.js';

// Plan configurations
// Credits: Platform API / BYOK (2x multiplier)
const PLAN_LIMITS = {
    free: {
        credits: 50, // 100 with BYOK (2x)
        profilesPerPlatform: 1,
        totalSocialAccounts: 2,
        features: ['basic_ai_generation', 'built_in_keys', 'own_keys'],
        support: 'community'
    },
    pro: {
        credits: 150, // 300 with BYOK (2x)
        profilesPerPlatform: 8,
        totalSocialAccounts: 8,
        features: ['basic_ai_generation', 'built_in_keys', 'own_keys', 'team_collaboration', 'bulk_scheduling', 'advanced_analytics', 'priority_email_support'],
        support: 'priority_email',
        teamMembers: 5 // max team size including owner
    },
    enterprise: {
        credits: 500, // 1000 with BYOK (2x)
        profilesPerPlatform: 15,
        totalSocialAccounts: 25,
        features: ['basic_ai_generation', 'built_in_keys', 'own_keys', 'team_collaboration', 'bulk_scheduling', 'advanced_analytics', 'priority_support', 'custom_integrations'],
        support: 'priority',
        teamMembers: 15
    }
};

function getRequiredPlanForFeature(featureName) {
    const featurePlanMap = {
        team_collaboration: 'enterprise',
        priority_support: 'enterprise',
        email_support: 'pro',
        bulk_scheduling: 'pro',
        advanced_analytics: 'pro'
    };
    return featurePlanMap[featureName] || 'free';
}

class PlansController {
    static async getLimits(req, res) {
        try {
            const result = await query('SELECT plan_type, credits_remaining, current_team_id FROM users WHERE id = $1', [req.user.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
            }

            const user = result.rows[0];
            // Default to 'free' if plan_type is null
            let userPlanType = user.plan_type || 'free';
            
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
            let effectiveCredits = planConfig.credits;
            if (hasOwnKeys && effectivePlanType !== 'free') {
                if (effectivePlanType === 'pro') effectiveCredits = 250;
                else if (effectivePlanType === 'enterprise') effectiveCredits = 750;
            }

            res.json({
                currentPlan: {
                    type: effectivePlanType,
                    name: effectivePlanType.charAt(0).toUpperCase() + effectivePlanType.slice(1),
                    creditsRemaining: user.credits_remaining,
                    effectiveCredits,
                    hasOwnKeys,
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
                availablePlans: Object.keys(PLAN_LIMITS).map((planType) => ({
                    type: planType,
                    name: planType.charAt(0).toUpperCase() + planType.slice(1),
                    credits: PLAN_LIMITS[planType].credits,
                    bonusCredits: planType === 'pro' ? 250 : planType === 'enterprise' ? 750 : 25,
                    profilesPerPlatform: PLAN_LIMITS[planType].profilesPerPlatform,
                    totalSocialAccounts: PLAN_LIMITS[planType].totalSocialAccounts,
                    features: PLAN_LIMITS[planType].features,
                    support: PLAN_LIMITS[planType].support,
                    teamMembers: PLAN_LIMITS[planType].teamMembers || 0,
                    price: planType === 'free' ? 0 : planType === 'pro' ? 399 : 1100
                }))
            });
        } catch (error) {
            console.error('Get plan limits error:', error);
            res.status(500).json({ error: 'Failed to get plan limits', code: 'PLAN_LIMITS_ERROR' });
        }
    }

    static async upgradePlan(req, res) {
        try {
            const { planType, isTrial } = req.body;
            const currentResult = await query('SELECT plan_type, credits_remaining, trial_ends_at FROM users WHERE id = $1', [req.user.id]);
            if (currentResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
            }
            const currentPlan = currentResult.rows[0].plan_type;
            const currentCredits = Number(currentResult.rows[0].credits_remaining);
            const existingTrialEndsAt = currentResult.rows[0].trial_ends_at;
            
            // Don't allow upgrade if already on enterprise
            if (currentPlan === 'enterprise') {
                return res.status(400).json({ error: 'Already on highest plan', code: 'ALREADY_HIGHEST_PLAN' });
            }
            
            // For Pro trial signups, allow even if null plan
            if (currentPlan === 'pro' && planType === 'pro' && !isTrial) {
                return res.status(400).json({ error: 'Already on Pro plan', code: 'ALREADY_PRO_PLAN' });
            }
            
            const newPlanConfig = PLAN_LIMITS[planType];
            let bonusCredits = 0;
            if (planType === 'pro' && isTrial) bonusCredits = 150; // Pro trial gets 150 credits
            else if (planType === 'pro' && !isTrial) bonusCredits = 150; // Paid Pro upgrade gets 150 credits
            else if (planType === 'enterprise') bonusCredits = 500;
            const newCredits = currentCredits + bonusCredits;
            
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
            
            res.json({
                message: isTrial ? 'Pro trial activated successfully' : 'Plan upgraded successfully',
                newPlan: {
                    type: planType,
                    name: planType.charAt(0).toUpperCase() + planType.slice(1),
                    creditsRemaining: newCredits,
                    bonusCredits,
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
                    price: planType === 'free' ? 0 : planType === 'pro' ? 399 : 1100,
                    credits: plan.credits,
                    bonusCredits: planType === 'pro' ? 250 : planType === 'enterprise' ? 750 : 25,
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


