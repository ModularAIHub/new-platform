import express from 'express';
import AuthController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Login user
router.post('/login', AuthController.login);

// Login for external apps (returns token for redirect)
router.post('/login-redirect', AuthController.loginWithRedirect);

// Logout user
router.post('/logout', AuthController.logout);

// Verify token (for modules)
router.get('/verify-token', authenticateToken, AuthController.verifyToken);

// Get current user info (for external apps)
router.get('/me', authenticateToken, AuthController.getCurrentUser);

// Refresh token
router.post('/refresh', AuthController.refreshToken);

// Register user - single route that handles email verification and account creation
router.post('/register', AuthController.register);

// Generic email verification OTP (can be used for various purposes)
router.post('/send-otp', AuthController.sendOTP);

router.post('/verify-otp', AuthController.verifyOTP);

// Settings and account management
router.post('/change-password', authenticateToken, AuthController.changePassword);

// Reset password (for forgot password flow - no authentication required)
router.post('/reset-password', AuthController.resetPassword);

router.post('/notifications', authenticateToken, AuthController.updateNotifications);

router.post('/two-factor', authenticateToken, AuthController.toggleTwoFactor);

router.delete('/delete-account', authenticateToken, AuthController.deleteAccount);

export default router;
