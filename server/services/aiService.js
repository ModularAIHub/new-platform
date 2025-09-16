
// aiService.js
// Service for AI requests, now supports BYOK logic
import { query } from '../config/database.js';
import { ByokService } from './byokService.js';
import { decrypt } from '../utils/encryption.js';

/**
 * Get the correct API key for a user based on BYOK preference.
 * Returns: { provider, apiKey, keyName }
 */

export async function getUserAIKey(userId, provider) {
  // Get user preference
  const userRes = await query('SELECT api_key_preference FROM users WHERE id = $1', [userId]);
  const pref = userRes.rows[0]?.api_key_preference || 'platform';

  if (pref === 'byok') {
    // Get user's BYOK key for this provider
    const keys = await ByokService.getUserKeys(userId);
    const key = keys.find(k => k.provider === provider);
    if (!key) throw new Error('No BYOK key found for this provider');
    return { provider, apiKey: key.apiKey, keyName: key.key_name };
  } else {
    // Platform key logic (fetch from platform config or env)
    // Example: process.env.OPENAI_API_KEY, etc.
    let envKey = null;
    if (provider === 'openai') envKey = process.env.OPENAI_API_KEY;
    if (provider === 'gemini') envKey = process.env.GEMINI_API_KEY;
    if (provider === 'perplexity') envKey = process.env.PERPLEXITY_API_KEY;
    if (!envKey) throw new Error('Platform API key not configured');
    return { provider, apiKey: envKey, keyName: 'Platform Default' };
  }
}

// Example AI request function (to be expanded for actual AI calls)
export async function performAIRequest(userId, provider, aiParams) {
  const { apiKey } = await getUserAIKey(userId, provider);
  // ... use apiKey to call the provider's API ...
  // This is a stub for integration.
  return { success: true, usedProvider: provider };
}
