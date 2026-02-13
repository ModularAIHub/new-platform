import { ByokService } from '../services/byokService.js';

const BYOK_DEBUG = process.env.BYOK_DEBUG === 'true';

const byokLog = (...args) => {
  if (BYOK_DEBUG) {
    console.log(...args);
  }
};

const byokWarn = (...args) => {
  if (BYOK_DEBUG) {
    console.warn(...args);
  }
};

export const ByokController = {
  async setPreference(req, res) {
    try {
      const userId = req.user?.id;
      const preference = req.body?.preference;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!['platform', 'byok'].includes(preference)) {
        return res.status(400).json({ error: 'Invalid preference' });
      }

      byokLog('[BYOK] setPreference', { userId, preference });
      const result = await ByokService.setPreference(userId, preference);
      return res.json({ success: true, ...result });
    } catch (error) {
      byokWarn('[BYOK] setPreference failed:', error?.message || error);
      return res.status(400).json({ error: error.message });
    }
  },

  async getPreference(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await ByokService.getPreference(userId);
      if (!result) {
        return res.status(404).json({ error: 'User not found' });
      }

      byokLog('[BYOK] getPreference', { userId });
      return res.json({ success: true, ...result });
    } catch (error) {
      byokWarn('[BYOK] getPreference failed:', error?.message || error);
      return res.status(400).json({ error: error.message });
    }
  },

  async addOrUpdateKey(req, res) {
    try {
      const userId = req.user.id;
      const { provider, keyName, apiKey } = req.body;
      const key = await ByokService.validateAndStoreKey(userId, provider, keyName, apiKey);
      return res.json({ success: true, key });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  async getUserKeys(req, res) {
    try {
      const userId = req.user.id;
      const keys = await ByokService.getUserKeys(userId);
      return res.json({ success: true, keys });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  async deleteKey(req, res) {
    try {
      const userId = req.user.id;
      const { keyId } = req.body;
      await ByokService.deleteKey(userId, keyId);
      return res.json({ success: true });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
};

