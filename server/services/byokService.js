// byokService.js
// Service for BYOK logic: preference switching, lock, key validation, credit tiering
import { query } from '../config/database.js';
import { UserApiKeyModel } from '../models/userApiKeyModel.js';
import { encrypt, decrypt } from '../utils/encryption.js';

const BYOK_CREDIT_AMOUNT = 55;
const PLATFORM_CREDIT_AMOUNT = 25;
const LOCK_PERIOD_DAYS = 90;

export const ByokService = {

  async setPreference(userId, preference) {
    console.log('[BYOK SERVICE] setPreference called with userId:', userId, 'preference:', preference);
    
    // Only allow switching if lock expired
    const user = await query('SELECT api_key_preference, byok_locked_until FROM users WHERE id = $1', [userId]);
    console.log('[BYOK SERVICE] User query result:', user.rows[0]);
    
    const now = new Date();
    if (user.rows[0].byok_locked_until && new Date(user.rows[0].byok_locked_until) > now) {
      console.log('[BYOK SERVICE] User is locked until:', user.rows[0].byok_locked_until);
      throw new Error('Cannot switch preference until lock expires');
    }
    let byokLockedUntil = null;
    let byokActivatedAt = null;
    if (preference === 'byok') {
      byokLockedUntil = new Date(now.getTime() + LOCK_PERIOD_DAYS * 24 * 60 * 60 * 1000);
      byokActivatedAt = now;
    } else if (preference === 'platform') {
      byokLockedUntil = new Date(now.getTime() + LOCK_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    }
    await query(
      'UPDATE users SET api_key_preference = $1, byok_locked_until = $2, byok_activated_at = $3 WHERE id = $4',
      [preference, byokLockedUntil, byokActivatedAt, userId]
    );
    // Set credits based on preference
    const credits = preference === 'byok' ? BYOK_CREDIT_AMOUNT : PLATFORM_CREDIT_AMOUNT;
    await query('UPDATE users SET credits_remaining = $1 WHERE id = $2', [credits, userId]);
    return { preference, credits, byokLockedUntil };
  },

  async getPreference(userId) {
    const result = await query('SELECT api_key_preference, byok_locked_until, byok_activated_at FROM users WHERE id = $1', [userId]);
    const pref = result.rows[0];
    let creditTier = 0;
    let api_key_preference = pref.api_key_preference;
    // Do not default to platform, only set if explicitly chosen
    if (!api_key_preference) {
      api_key_preference = null;
      creditTier = 0;
    } else if (api_key_preference === 'byok') {
      creditTier = BYOK_CREDIT_AMOUNT;
    } else if (api_key_preference === 'platform') {
      creditTier = PLATFORM_CREDIT_AMOUNT;
    }
    const now = new Date();
    let locked = false;
    let lockMessage = null;
    if (api_key_preference === 'byok' && pref.byok_locked_until && new Date(pref.byok_locked_until) > now) {
      locked = true;
      lockMessage = `BYOK is locked until ${new Date(pref.byok_locked_until).toLocaleString()}`;
    }
    return {
      ...pref,
      api_key_preference,
      creditTier,
      locked,
      lockMessage
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
