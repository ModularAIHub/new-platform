// (removed duplicate top-level onboarding function)
// byokController.js
// Controller for BYOK preference and key management
import { ByokService } from '../services/byokService.js';

export const ByokController = {
  async setPreference(req, res) {
    try {
      const userId = req.user.id;
      const { preference } = req.body;
      if (!['platform', 'byok'].includes(preference)) {
        return res.status(400).json({ error: 'Invalid preference' });
      }
      const result = await ByokService.setPreference(userId, preference);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getPreference(req, res) {
    try {
      if (!req.user) {
        console.error('[DEBUG] /byok/preference: No req.user object', { cookies: req.cookies });
        return res.status(401).json({ error: 'No user object in request. Check authentication middleware.' });
      }
      if (!req.user.id) {
        console.error('[DEBUG] /byok/preference: req.user.id missing', { user: req.user });
        return res.status(401).json({ error: 'User ID missing in session. Check token parsing.' });
      }
      const userId = req.user.id;
      console.log('[DEBUG] /byok/preference: userId', userId);
      const result = await ByokService.getPreference(userId);
      if (!result) {
        console.error('[DEBUG] /byok/preference: No result from DB for user', userId);
        return res.status(404).json({ error: 'User not found in database.' });
      }
      console.log('[DEBUG] /byok/preference: result', result);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('[DEBUG] /byok/preference error:', error);
      res.status(400).json({ error: error.message, stack: error.stack, fullError: error });
    }
  },

// onboarding endpoint removed

  async addOrUpdateKey(req, res) {
    try {
      const userId = req.user.id;
      const { provider, keyName, apiKey } = req.body;
      const key = await ByokService.validateAndStoreKey(userId, provider, keyName, apiKey);
      res.json({ success: true, key });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getUserKeys(req, res) {
    try {
      const userId = req.user.id;
      const keys = await ByokService.getUserKeys(userId);
      res.json({ success: true, keys });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async deleteKey(req, res) {
    try {
      const userId = req.user.id;
      const { keyId } = req.body;
      await ByokService.deleteKey(userId, keyId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};
