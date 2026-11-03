// creditTiers.js
// Centralized monthly credit allocations by plan and API key preference

export const CREDIT_TIERS = Object.freeze({
  free: Object.freeze({ platform: 15, byok: 50 }),
  pro: Object.freeze({ platform: 120, byok: 220 }),
  agency: Object.freeze({ platform: 120, byok: 220 }),
  enterprise: Object.freeze({ platform: 600, byok: 1200 })
});

// Agency work is pooled across client workspaces, so the included balance
// needs to be materially larger than an individual user's personal balance.
export const AGENCY_POOL_CREDIT_TIERS = Object.freeze({
  agency: Object.freeze({ platform: 900, byok: 1800 }),
  enterprise: Object.freeze({ platform: 2500, byok: 5000 }),
});

export const isValidApiPreference = (preference) =>
  preference === 'platform' || preference === 'byok';

export const normalizePlanType = (planType) =>
  CREDIT_TIERS[planType] ? planType : 'free';

export const normalizeApiPreference = (preference) =>
  isValidApiPreference(preference) ? preference : null;

export function getCreditsForPlan(planType, apiPreference, options = {}) {
  const { defaultToPlatform = true } = options;
  const normalizedPlan = normalizePlanType(planType);
  const normalizedPreference = normalizeApiPreference(apiPreference);

  if (!normalizedPreference) {
    return defaultToPlatform ? CREDIT_TIERS[normalizedPlan].platform : 0;
  }

  return CREDIT_TIERS[normalizedPlan][normalizedPreference];
}
