import express from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import ApiKeysController from '../controllers/apiKeysController.js';

const router = express.Router();

// Get API keys for a specific provider
router.get('/', authenticateToken, ApiKeysController.listByProvider);

// Get decrypted API key (for modules)
router.get('/key', authenticateToken, ApiKeysController.getDecryptedKey);

// Add new API key
router.post('/', [
    authenticateToken,
    body('provider').isIn(['openai', 'gemini', 'perplexity']).withMessage('Invalid provider'),
    body('apiKey').trim().notEmpty().withMessage('API key is required'),
    body('keyName').trim().notEmpty().withMessage('Key name is required'),
    validate
], ApiKeysController.create);

// Update API key
router.put('/:id', [
    authenticateToken,
    body('apiKey').optional().trim().notEmpty().withMessage('API key cannot be empty'),
    body('keyName').optional().trim().notEmpty().withMessage('Key name cannot be empty'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    validate
], ApiKeysController.update);

// Delete API key
router.delete('/:id', authenticateToken, ApiKeysController.remove);

// Get all API keys for user
router.get('/all', authenticateToken, ApiKeysController.listAll);

export default router;
