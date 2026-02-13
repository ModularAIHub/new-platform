// byokService.js
// Service for BYOK logic: preference switching, lock, key validation, credit tiering
import { query } from '../config/database.js';
import { UserApiKeyModel } from '../models/userApiKeyModel.js';
import { encrypt, decrypt } from '../utils/encryption.js';
const BYOK_DEBUG = process.env.BYOK_DEBUG === 'true';

const byokLog = (...args) => {
  if (BYOK_DEBUG) {
    console.log(...args);
  }
};

// Credit allocation based on plan and API preference
// Free: 50 (platform) / 100 (BYOK 2x)
// Pro: 150 (platform) / 300 (BYOK 2x)
const CREDIT_TIERS = {
  free: { platform: 50, byok: 100 },
  pro: { platform: 150, byok: 300 },
  enterprise: { platform: 500, byok: 1000 }
};

const LOCK_PERIOD_DAYS = 90;

// Helper function to get credits based on plan and preference
function getCreditsForPlan(planType, apiPreference) {
  const plan = planType || 'free';
  const pref = apiPreference || 'platform';
  return CREDIT_TIERS[plan]?.[pref] || CREDIT_TIERS.free.platform;
}

export const ByokService = {

  async setPreference(userId, preference) {
    byokLog('[BYOK SERVICE] setPreference called with userId:', userId, 'preference:', preference);
    
    // Get current user preference, lock status, AND plan_type
    const user = await query('SELECT api_key_preference, byok_locked_until, plan_type FROM users WHERE id = $1', [userId]);
    byokLog('[BYOK SERVICE] User query result:', user.rows[0]);
    if (!user.rows[0]) {
      throw new Error('User not found');
    }
    
    const now = new Date();
    const planType = user.rows[0].plan_type || 'free';
    
    // Strict lock enforcement - user cannot make ANY preference changes while locked
    if (user.rows[0].byok_locked_until && new Date(user.rows[0].byok_locked_until) > now) {
      const lockUntilDate = new Date(user.rows[0].byok_locked_until).toLocaleDateString();
      byokLog('[BYOK SERVICE] User is locked until:', user.rows[0].byok_locked_until);
      throw new Error(`Preference is locked until ${lockUntilDate}. You cannot make any changes during the 3-month lock period.`);
    }
    let byokLockedUntil = null;
    let byokActivatedAt = null;
    if (preference === 'byok') {
      // BYOK mode: don't lock until user submits API key
      byokActivatedAt = now;
    } else if (preference === 'platform') {
      // Platform mode: lock immediately
      byokLockedUntil = new Date(now.getTime() + LOCK_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    }
    await query(
      'UPDATE users SET api_key_preference = $1, byok_locked_until = $2, byok_activated_at = $3 WHERE id = $4',
      [preference, byokLockedUntil, byokActivatedAt, userId]
    );
    // Set credits based on BOTH plan_type and preference
    const credits = getCreditsForPlan(planType, preference);
    await query('UPDATE users SET credits_remaining = $1, last_credit_reset = NOW() WHERE id = $2', [credits, userId]);
    byokLog(`[BYOK SERVICE] Updated user ${userId} credits to ${credits} (${planType} plan, ${preference} mode)`);
    return { preference, credits, byokLockedUntil };
  },

  async getPreference(userId) {
    const result = await query('SELECT api_key_preference, byok_locked_until, byok_activated_at, plan_type FROM users WHERE id = $1', [userId]);
    const pref = result.rows[0];
    const planType = pref.plan_type || 'free';
    let creditTier = 0;
    let api_key_preference = pref.api_key_preference;
    // Do not default to platform, only set if explicitly chosen
    if (!api_key_preference) {
      api_key_preference = null;
      creditTier = 0;
    } else {
      // Calculate based on both plan and preference
      creditTier = getCreditsForPlan(planType, api_key_preference);
    }
    const now = new Date();
    let locked = false;
    let lockMessage = null;
    // Check if user is locked regardless of current preference (both platform and byok can be locked)
    if (pref.byok_locked_until && new Date(pref.byok_locked_until) > now) {
      locked = true;
      const lockUntilDate = new Date(pref.byok_locked_until).toLocaleDateString();
      lockMessage = `Preference is locked until ${lockUntilDate}. You cannot make changes during the 3-month lock period.`;
    }
    return {
      ...pref,
      api_key_preference,
      creditTier,
      locked,
      lockMessage,
      plan_type: planType
    };
  },

  async validateAndStoreKey(userId, provider, keyName, apiKey) {
    // Add provider-specific validation here if needed
    if (!['openai', 'gemini', 'perplexity'].includes(provider)) {
      throw new Error('Invalid provider');
    }
    if (!apiKey || apiKey.length < 10) {
      throw new Error('API key too short');
    }
    
    // Check if user is in BYOK mode and not yet locked
    const user = await query('SELECT api_key_preference, byok_locked_until, plan_type FROM users WHERE id = $1', [userId]);
    const userPref = user.rows[0];
    
    // If user is in BYOK mode and not locked, this is their first API key submission - apply lock
    if (userPref.api_key_preference === 'byok' && (!userPref.byok_locked_until || new Date(userPref.byok_locked_until) <= new Date())) {
      const lockPeriod = new Date();
      lockPeriod.setDate(lockPeriod.getDate() + LOCK_PERIOD_DAYS);
      
      await query('UPDATE users SET byok_locked_until = $1 WHERE id = $2', [lockPeriod, userId]);
      byokLog('[BYOK SERVICE] First API key submitted - locking BYOK user until:', lockPeriod);
    }
    
    // Encrypt key
    const encryptedKey = encrypt(apiKey);
    // Deactivate any existing key for this provider
    const existing = await UserApiKeyModel.getByUserAndProvider(userId, provider);
    if (existing) {
      await UserApiKeyModel.deactivateKey(existing.id);
    }
    // Store new key
    return await UserApiKeyModel.create({ userId, provider, keyName, encryptedKey });
  },

  async getUserKeys(userId) {
    const keys = await UserApiKeyModel.getActiveByUser(userId);
    // Decrypt keys and map DB fields to camelCase for frontend
    return keys.map(k => ({
      id: k.id,
      provider: k.provider,
      keyName: k.key_name,
      apiKey: decrypt(k.encrypted_key),
      isActive: k.is_active,
      createdAt: k.created_at,
      updatedAt: k.updated_at
    }));
  },

  async deleteKey(userId, keyId) {
    // Only allow deleting own key
    const key = await query('SELECT * FROM user_api_keys WHERE id = $1 AND user_id = $2', [keyId, userId]);
    if (!key.rows[0]) throw new Error('Key not found');
    await UserApiKeyModel.deleteKey(keyId);
  }
};
