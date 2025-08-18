import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { encrypt, decrypt } from '../utils/encryption.js';

class ApiKeysController {
    static async listByProvider(req, res) {
        try {
            const { provider } = req.query;
            if (!provider) {
                return res.status(400).json({ error: 'Provider parameter is required', code: 'PROVIDER_REQUIRED' });
            }
            const result = await query(
                'SELECT id, provider, key_name, is_active, created_at FROM api_keys WHERE user_id = $1 AND provider = $2',
                [req.user.id, provider]
            );
            res.json({
                apiKeys: result.rows.map(row => ({
                    id: row.id,
                    provider: row.provider,
                    keyName: row.key_name,
                    isActive: row.is_active,
                    createdAt: row.created_at
                }))
            });
        } catch (error) {
            console.error('Get API keys error:', error);
            res.status(500).json({ error: 'Failed to get API keys', code: 'GET_KEYS_ERROR' });
        }
    }

    static async getDecryptedKey(req, res) {
        try {
            const { provider, keyId } = req.query;
            if (!provider) {
                return res.status(400).json({ error: 'Provider parameter is required', code: 'PROVIDER_REQUIRED' });
            }
            let text = 'SELECT id, encrypted_key, key_name FROM api_keys WHERE user_id = $1 AND provider = $2 AND is_active = true';
            const params = [req.user.id, provider];
            if (keyId) { text += ' AND id = $3'; params.push(keyId); }
            text += ' ORDER BY created_at DESC LIMIT 1';
            const result = await query(text, params);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'No active API key found for this provider', code: 'NO_ACTIVE_KEY' });
            }
            const apiKey = result.rows[0];
            const decryptedKey = decrypt(apiKey.encrypted_key);
            if (!decryptedKey) {
                return res.status(500).json({ error: 'Failed to decrypt API key', code: 'DECRYPT_ERROR' });
            }
            res.json({ apiKey: decryptedKey, keyName: apiKey.key_name, keyId: apiKey.id });
        } catch (error) {
            console.error('Get API key error:', error);
            res.status(500).json({ error: 'Failed to get API key', code: 'GET_KEY_ERROR' });
        }
    }

    static async create(req, res) {
        try {
            const { provider, apiKey, keyName } = req.body;
            const encryptedKey = encrypt(apiKey);
            if (!encryptedKey) {
                return res.status(500).json({ error: 'Failed to encrypt API key', code: 'ENCRYPT_ERROR' });
            }
            const existingKey = await query(
                'SELECT id FROM api_keys WHERE user_id = $1 AND provider = $2 AND key_name = $3',
                [req.user.id, provider, keyName]
            );
            if (existingKey.rows.length > 0) {
                return res.status(409).json({ error: 'API key with this name already exists', code: 'KEY_NAME_EXISTS' });
            }
            const keyId = uuidv4();
            const result = await query(
                `INSERT INTO api_keys (id, user_id, provider, encrypted_key, key_name, is_active, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 RETURNING id, provider, key_name, is_active, created_at`,
                [keyId, req.user.id, provider, encryptedKey, keyName, true]
            );
            res.status(201).json({
                message: 'API key added successfully',
                apiKey: {
                    id: result.rows[0].id,
                    provider: result.rows[0].provider,
                    keyName: result.rows[0].key_name,
                    isActive: result.rows[0].is_active,
                    createdAt: result.rows[0].created_at
                }
            });
        } catch (error) {
            console.error('Add API key error:', error);
            res.status(500).json({ error: 'Failed to add API key', code: 'ADD_KEY_ERROR' });
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const { apiKey, keyName, isActive } = req.body;
            const existingKey = await query('SELECT id, provider FROM api_keys WHERE id = $1 AND user_id = $2', [id, req.user.id]);
            if (existingKey.rows.length === 0) {
                return res.status(404).json({ error: 'API key not found', code: 'KEY_NOT_FOUND' });
            }
            let updateFields = [], params = [], idx = 1;
            if (apiKey !== undefined) {
                const encryptedKey = encrypt(apiKey);
                if (!encryptedKey) return res.status(500).json({ error: 'Failed to encrypt API key', code: 'ENCRYPT_ERROR' });
                updateFields.push(`encrypted_key = $${idx++}`); params.push(encryptedKey);
            }
            if (keyName !== undefined) {
                const nameCheck = await query(
                    'SELECT id FROM api_keys WHERE user_id = $1 AND provider = $2 AND key_name = $3 AND id != $4',
                    [req.user.id, existingKey.rows[0].provider, keyName, id]
                );
                if (nameCheck.rows.length > 0) {
                    return res.status(409).json({ error: 'API key with this name already exists', code: 'KEY_NAME_EXISTS' });
                }
                updateFields.push(`key_name = $${idx++}`); params.push(keyName);
            }
            if (isActive !== undefined) { updateFields.push(`is_active = $${idx++}`); params.push(isActive); }
            if (updateFields.length === 0) { return res.status(400).json({ error: 'No fields to update', code: 'NO_FIELDS_TO_UPDATE' }); }
            params.push(id);
            const result = await query(
                `UPDATE api_keys SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${idx} AND user_id = $${idx + 1}
                 RETURNING id, provider, key_name, is_active, created_at`,
                [...params, req.user.id]
            );
            res.json({
                message: 'API key updated successfully',
                apiKey: {
                    id: result.rows[0].id,
                    provider: result.rows[0].provider,
                    keyName: result.rows[0].key_name,
                    isActive: result.rows[0].is_active,
                    createdAt: result.rows[0].created_at
                }
            });
        } catch (error) {
            console.error('Update API key error:', error);
            res.status(500).json({ error: 'Failed to update API key', code: 'UPDATE_KEY_ERROR' });
        }
    }

    static async remove(req, res) {
        try {
            const { id } = req.params;
            const existingKey = await query('SELECT id FROM api_keys WHERE id = $1 AND user_id = $2', [id, req.user.id]);
            if (existingKey.rows.length === 0) {
                return res.status(404).json({ error: 'API key not found', code: 'KEY_NOT_FOUND' });
            }
            await query('DELETE FROM api_keys WHERE id = $1 AND user_id = $2', [id, req.user.id]);
            res.json({ message: 'API key deleted successfully' });
        } catch (error) {
            console.error('Delete API key error:', error);
            res.status(500).json({ error: 'Failed to delete API key', code: 'DELETE_KEY_ERROR' });
        }
    }

    static async listAll(req, res) {
        try {
            const result = await query(
                'SELECT id, provider, key_name, is_active, created_at FROM api_keys WHERE user_id = $1 ORDER BY provider, created_at DESC',
                [req.user.id]
            );
            const groupedKeys = result.rows.reduce((acc, row) => {
                const provider = row.provider;
                if (!acc[provider]) acc[provider] = [];
                acc[provider].push({ id: row.id, provider: row.provider, keyName: row.key_name, isActive: row.is_active, createdAt: row.created_at });
                return acc;
            }, {});
            res.json({ apiKeys: groupedKeys });
        } catch (error) {
            console.error('Get all API keys error:', error);
            res.status(500).json({ error: 'Failed to get API keys', code: 'GET_ALL_KEYS_ERROR' });
        }
    }
}

export default ApiKeysController;


