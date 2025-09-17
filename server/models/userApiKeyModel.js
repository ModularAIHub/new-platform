
// userApiKeyModel.js
// Model for user_api_keys table (BYOK)
import { query } from '../config/database.js';

export const UserApiKeyModel = {
  async create({ userId, provider, keyName, encryptedKey }) {
    const result = await query(
      `INSERT INTO user_api_keys (user_id, provider, key_name, encrypted_key) VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, provider, keyName, encryptedKey]
    );
    return result.rows[0];
  },

  async getActiveByUser(userId) {
    const result = await query(
      `SELECT * FROM user_api_keys WHERE user_id = $1 AND is_active = TRUE`,
      [userId]
    );
    return result.rows;
  },

  async getByUserAndProvider(userId, provider) {
    const result = await query(
      `SELECT * FROM user_api_keys WHERE user_id = $1 AND provider = $2 AND is_active = TRUE`,
      [userId, provider]
    );
    return result.rows[0];
  },

  async deactivateKey(id) {
    await query(
      `UPDATE user_api_keys SET is_active = FALSE, updated_at = NOW() WHERE id = $1`,
      [id]
    );
  },

  async deleteKey(id) {
    await query(`DELETE FROM user_api_keys WHERE id = $1`, [id]);
  },

  async updateKeyName(id, keyName) {
    await query(
      `UPDATE user_api_keys SET key_name = $1, updated_at = NOW() WHERE id = $2`,
      [keyName, id]
    );
  }
};
