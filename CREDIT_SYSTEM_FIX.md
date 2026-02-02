# Credit System Fix - Plan-Based Allocation

## Problem
The credit system wasn't properly differentiating between subscription tiers (Free vs Pro) and API preference (Platform vs BYOK). Previously:
- Free plan: 25 credits (Platform) / 55 credits (BYOK)
- Pro plan: 150 credits (regardless of Platform or BYOK)

This didn't make sense because:
1. Pro users got the same credits whether using BYOK or Platform
2. The BYOK multiplier wasn't applied to Pro tier
3. Credits didn't scale with subscription value

## Solution
Implemented a proper credit allocation system that considers BOTH subscription tier AND API preference:

### New Credit Structure
**BYOK provides 2x credits compared to Platform keys**

| Plan       | Platform Credits | BYOK Credits (2x) |
|------------|------------------|-------------------|
| Free       | 50               | 100               |
| Pro        | 150              | 300               |
| Enterprise | 500              | 1000              |

## Changes Made

### Backend Changes

#### 1. `server/services/byokService.js`
- **Replaced fixed constants** with `CREDIT_TIERS` object containing plan-specific credits
- **Added helper function** `getCreditsForPlan(planType, apiPreference)` 
- **Updated `setPreference()`** to fetch `plan_type` and calculate credits based on both plan and preference
- **Updated `getPreference()`** to fetch `plan_type` and return correct `creditTier`
- **Updated `validateAndStoreKey()`** to include `plan_type` in user query

#### 2. `server/controllers/plansController.js`
- Updated `PLAN_LIMITS` with correct credit amounts
- Added comments showing BYOK multiplier: `credits: 50 // 100 with BYOK (2x)`

#### 3. `server/workers/syncWorker.js`
- Updated monthly credit reset query to use **CASE WHEN** with both `plan_type` and `api_key_preference`
- Added detailed statistics tracking by tier (free-platform, free-byok, pro-platform, pro-byok, etc.)
- Enhanced logging to show credit allocation breakdown by tier

#### 4. `server/controllers/creditResetController.js`
- Updated `manualMonthlyReset()` to calculate credits based on plan and preference
- Updated `getResetInfo()` to show breakdown by plan tier
- Changed response structure to show:
  - `creditAmounts.free.platform: 50`
  - `creditAmounts.free.byok: 100`
  - `creditAmounts.pro.platform: 150`
  - `creditAmounts.pro.byok: 300`
  - etc.

### Frontend Changes

#### 5. `client/src/pages/ApiKeysPage.jsx`
- Updated description: "Platform: 50 credits (Free) / 150 (Pro). BYOK: 100 credits (Free) / 300 (Pro)"
- Updated radio button labels to show plan-specific credits
- Updated BYOK info modal to mention 2x multiplier

#### 6. `client/src/pages/DashboardPage.jsx`
- Updated API key preference selection modal descriptions
- Updated button labels: "Use Platform Keys (50 Free / 150 Pro)"
- Updated BYOK info to show plan-aware credits

#### 7. `client/src/pages/PlansPage.jsx`
- Added comparison rows:
  - "Monthly Credits (Platform): 50 / 150 / 500"
  - "Monthly Credits (BYOK): 100 / 300 / 1000"

#### 8. `client/src/components/UpgradePrompt.jsx`
- Updated Pro feature list: "150 credits (300 with BYOK)"

## Migration Notes

### Existing Users
When the monthly credit reset runs next (1st of the month), all users will automatically receive credits based on their:
- Current `plan_type` (defaults to 'free' if null)
- Current `api_key_preference` (platform or byok)

### Manual Reset
Admins can trigger manual reset via:
```bash
POST /api/credit-reset/manual-reset
```

This will:
1. Update all users' credits in PostgreSQL based on their plan and preference
2. Sync credits to Redis cache
3. Return detailed statistics by tier

### Testing Credit Allocation
```javascript
// Test different scenarios
const testCases = [
  { plan: 'free', pref: 'platform', expected: 50 },
  { plan: 'free', pref: 'byok', expected: 100 },
  { plan: 'pro', pref: 'platform', expected: 150 },
  { plan: 'pro', pref: 'byok', expected: 300 },
  { plan: 'enterprise', pref: 'platform', expected: 500 },
  { plan: 'enterprise', pref: 'byok', expected: 1000 }
];
```

## Benefits

### For Users
1. **Clear value proposition**: Pro users get 3x more credits than Free (150 vs 50)
2. **BYOK incentive**: Consistent 2x multiplier across all tiers
3. **Scalable**: Credits scale with subscription tier

### For Business
1. **Monetization clarity**: Clear upgrade path from Free → Pro based on credit needs
2. **BYOK adoption**: Strong incentive to use BYOK (2x credits) which reduces platform API costs
3. **Fair pricing**: Higher tiers get proportionally more resources

## SQL Query for Verification

Check current credit distribution:
```sql
SELECT 
  COALESCE(plan_type, 'free') as plan,
  api_key_preference,
  COUNT(*) as user_count,
  AVG(credits_remaining) as avg_credits
FROM users 
WHERE api_key_preference IS NOT NULL
GROUP BY plan_type, api_key_preference
ORDER BY plan_type, api_key_preference;
```

## Rollout Plan

1. ✅ Deploy backend changes first (backward compatible)
2. ✅ Deploy frontend changes (users see new credit amounts)
3. ⏳ Wait for monthly reset (or trigger manual reset)
4. ⏳ Monitor logs for credit allocation statistics
5. ⏳ Verify all users received correct credits based on plan + preference

---

**Date**: February 2, 2026  
**Status**: ✅ Implemented  
**Next Steps**: Test in development, verify calculations, deploy to production
