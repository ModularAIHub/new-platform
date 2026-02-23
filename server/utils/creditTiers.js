// creditTiers.js
// Centralized monthly credit allocations by plan and API key preference

export const CREDIT_TIERS = Object.freeze({
  free: Object.freeze({ platform: 15, byok: 50 }),
  pro: Object.freeze({ platform: 100, byok: 180 }),
  enterprise: Object.freeze({ platform: 500, byok: 1000 })
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
