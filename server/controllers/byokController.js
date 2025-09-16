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
      const userId = req.user.id;
      const result = await ByokService.getPreference(userId);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(400).json({ error: error.message });
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
