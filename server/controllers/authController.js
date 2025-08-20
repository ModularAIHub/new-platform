import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import redisClient from '../config/redis.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { sendMail } from '../utils/email.js';
import { comparePassword, hashPassword } from '../utils/bcrypt.js';
import {
    validateRegistrationData,
    validateLoginData,
    validateOTPRequest,
    validateOTPVerification,
    validatePasswordChange,
    validateNotificationPreferences,
    validateTwoFactorSettings,
    validatePassword
} from '../utils/validation.js';

class AuthController {
    // Helper function to set secure cookies
    static setAuthCookies(res, accessToken, refreshToken) {
        const isProduction = process.env.NODE_ENV === 'production';
        const domain = isProduction ? `.${process.env.DOMAIN}` : undefined;

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            domain: domain,
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            domain: domain,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
    }

    // Helper function to clear cookies
    static clearAuthCookies(res) {
        const isProduction = process.env.NODE_ENV === 'production';
        const domain = isProduction ? `.${process.env.DOMAIN}` : undefined;

        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            domain: domain
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            domain: domain
        });
    }

    // Helper to generate 6-digit numeric OTP
    static generateOTP() {
        // For testing purposes, use a fixed OTP
        // return '123456';
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Register user - single method with email verification
    static async register(req, res) {
        try {
            // Validate registration data
            const validation = validateRegistrationData(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors,
                    code: 'VALIDATION_ERROR'
                });
            }

            const { email, password, name, verificationToken } = validation.sanitized;

            // Verify the verification token instead of OTP
            let tokenPayload;
            try {
                tokenPayload = jwt.verify(verificationToken, process.env.JWT_SECRET);
                
                // Ensure token is for the same email and is for account verification
                if (tokenPayload.email !== email || tokenPayload.purpose !== 'account-verification' || !tokenPayload.verified) {
                    return res.status(400).json({ 
                        error: 'Invalid verification token',
                        code: 'INVALID_TOKEN'
                    });
                }
            } catch (error) {
                return res.status(400).json({ 
                    error: 'Invalid or expired verification token. Please verify your email again.',
                    code: 'TOKEN_EXPIRED'
                });
            }

            // Check if user already exists
            const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
            if (existingUser.rows.length > 0) {
                return res.status(409).json({
                    error: 'User with this email already exists',
                    code: 'USER_EXISTS'
                });
            }

            // Hash password
            const passwordHash = await hashPassword(password);
            
            // Create user
            const userId = uuidv4();
            const result = await query(
                `INSERT INTO users (id, email, password_hash, name, plan_type, credits_remaining, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                 RETURNING id, email, name, plan_type, credits_remaining, created_at`,
                [userId, email, passwordHash, name, 'free', 25]
            );
            const user = result.rows[0];

            // Initialize Redis credits and plan
            try {
                await redisClient.setCredits(user.id, 25);
                await redisClient.setPlan(user.id, 'free');
            } catch (e) {
                console.warn('Unable to initialize Redis for new user; will fallback to DB:', e?.message || e);
            }

            // Return user data without tokens (tokens only issued by login)
            res.status(201).json({
                message: 'Account created successfully. Please login to continue.',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    planType: user.plan_type,
                    creditsRemaining: user.credits_remaining
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ 
                error: 'Failed to create account',
                code: 'REGISTRATION_ERROR'
            });
        }
    }

    // Login user
    static async login(req, res) {
        try {
            // Validate login data
            const validation = validateLoginData(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors,
                    code: 'VALIDATION_ERROR'
                });
            }

            const { email, password } = validation.sanitized;

            // Find user
            const result = await query(
                'SELECT id, email, password_hash, name, plan_type, credits_remaining FROM users WHERE email = $1',
                [email]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({
                    error: 'Invalid email or password',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            const user = result.rows[0];

            // Verify password
            const isValidPassword = await comparePassword(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    error: 'Invalid email or password',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Generate tokens
            const accessToken = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
            );

            const refreshToken = jwt.sign(
                { userId: user.id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
            );

            // Set cookies
            AuthController.setAuthCookies(res, accessToken, refreshToken);

            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    planType: user.plan_type,
                    creditsRemaining: user.credits_remaining
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                error: 'Login failed',
                code: 'LOGIN_ERROR',
                details: error?.message || error
            });
        }
    }

    // Logout user
    static logout(req, res) {
        AuthController.clearAuthCookies(res);
        res.json({ message: 'Logged out successfully' });
    }

    // Reset password (for forgot password flow - no authentication required)
    static async resetPassword(req, res) {
        try {
            // Validate password change data
            const validation = validatePasswordChange(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors,
                    code: 'VALIDATION_ERROR'
                });
            }

            const { newPassword, verificationToken } = validation.sanitized;

            // Verify the verification token
            let decoded;
            try {
                decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
                
                // Check if token is for password reset purpose
                if (decoded.purpose !== 'verification' && decoded.purpose !== 'password-reset') {
                    return res.status(400).json({
                        error: 'Invalid verification token purpose',
                        code: 'INVALID_TOKEN_PURPOSE'
                    });
                }

                // Check if token is not expired
                if (decoded.timestamp && (Date.now() - decoded.timestamp) > 3600000) { // 1 hour
                    return res.status(400).json({
                        error: 'Verification token has expired',
                        code: 'TOKEN_EXPIRED'
                    });
                }

            } catch (jwtError) {
                return res.status(400).json({
                    error: 'Invalid or expired verification token',
                    code: 'INVALID_TOKEN'
                });
            }

            const userEmail = decoded.email;

            // Find user by email from token
            const userResult = await query('SELECT id FROM users WHERE email = $1', [userEmail]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            const userId = userResult.rows[0].id;

            // Hash new password
            const passwordHash = await hashPassword(newPassword);

            // Update password in database
            await query(
                'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
                [passwordHash, userId]
            );

            res.json({
                message: 'Password reset successfully!'
            });

        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ 
                error: 'Failed to reset password',
                code: 'RESET_PASSWORD_ERROR'
            });
        }
    }

    // Change password (for authenticated users) (with OTP verification)
    static async changePassword(req, res) {
        try {
            // Validate password change data
            const validation = validatePasswordChange(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors,
                    code: 'VALIDATION_ERROR'
                });
            }

            const { newPassword, verificationToken } = validation.sanitized;
            const userId = req.user.id;
            const userEmail = req.user.email;

            // Verify the verification token
            try {
                const decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
                
                // Check if token is for password change purpose
                if (decoded.purpose !== 'verification' && decoded.purpose !== 'password-reset') {
                    return res.status(400).json({
                        error: 'Invalid verification token purpose',
                        code: 'INVALID_TOKEN_PURPOSE'
                    });
                }

                // Check if the email in token matches the authenticated user
                if (decoded.email !== userEmail) {
                    return res.status(400).json({
                        error: 'Verification token does not match authenticated user',
                        code: 'TOKEN_EMAIL_MISMATCH'
                    });
                }

                // Check if token is not expired (additional check)
                if (decoded.timestamp && (Date.now() - decoded.timestamp) > 3600000) { // 1 hour
                    return res.status(400).json({
                        error: 'Verification token has expired',
                        code: 'TOKEN_EXPIRED'
                    });
                }

            } catch (jwtError) {
                return res.status(400).json({
                    error: 'Invalid or expired verification token',
                    code: 'INVALID_VERIFICATION_TOKEN'
                });
            }

            // Get user to ensure they exist
            const userResult = await query(
                'SELECT id, email FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Hash new password
            const hashedPassword = await hashPassword(newPassword);
            
            // Update password
            await query(
                'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
                [hashedPassword, userId]
            );

            res.json({ 
                message: 'Password updated successfully',
                email: userEmail
            });

        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ 
                error: 'Failed to change password',
                code: 'PASSWORD_CHANGE_ERROR'
            });
        }
    }

    // Update notification preferences
    static async updateNotifications(req, res) {
        try {
            // Validate notification preferences data
            const validation = validateNotificationPreferences(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors,
                    code: 'VALIDATION_ERROR'
                });
            }

            const { emailEnabled } = validation.sanitized;
            const userId = req.user.id;

            await query(
                'UPDATE users SET notification_email_enabled = $1, updated_at = NOW() WHERE id = $2',
                [emailEnabled, userId]
            );

            res.json({ 
                message: 'Notification preferences updated successfully',
                preferences: {
                    emailEnabled
                }
            });
        } catch (error) {
            console.error('Update notifications error:', error);
            res.status(500).json({ 
                error: 'Failed to update notification preferences',
                code: 'NOTIFICATION_UPDATE_ERROR'
            });
        }
    }

    // Toggle two-factor authentication
    static async toggleTwoFactor(req, res) {
        try {
            // Validate two-factor settings data
            const validation = validateTwoFactorSettings(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors,
                    code: 'VALIDATION_ERROR'
                });
            }

            const { enabled } = validation.sanitized;
            const userId = req.user.id;

            await query(
                'UPDATE users SET two_factor_enabled = $1, updated_at = NOW() WHERE id = $2',
                [enabled, userId]
            );

            res.json({ 
                message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`,
                twoFactorEnabled: enabled
            });
        } catch (error) {
            console.error('Toggle 2FA error:', error);
            res.status(500).json({ 
                error: 'Failed to update two-factor authentication settings',
                code: 'TWO_FACTOR_UPDATE_ERROR'
            });
        }
    }

    // Delete account
    static async deleteAccount(req, res) {
        try {
            const userId = req.user.id;

            // Check if user exists
            const userResult = await query('SELECT id FROM users WHERE id = $1', [userId]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Delete user account
            await query('DELETE FROM users WHERE id = $1', [userId]);

            // Clear authentication cookies
            AuthController.clearAuthCookies(res);

            // Clean up Redis data
            try {
                await redisClient.del(`credits:${userId}`);
                await redisClient.del(`plan:${userId}`);
            } catch (e) {
                console.warn('Failed to clean up Redis data for deleted user:', e?.message || e);
            }

            res.json({ 
                message: 'Account deleted successfully',
                deleted: true
            });
        } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({ 
                error: 'Failed to delete account',
                code: 'ACCOUNT_DELETION_ERROR'
            });
        }
    }

    // Generic send OTP method
    static async sendOTP(req, res) {
        try {
            // Validate OTP request data
            const validation = validateOTPRequest(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors,
                    code: 'VALIDATION_ERROR'
                });
            }

            const { email, purpose } = validation.sanitized;

            // Check rate limiting - prevent spam
            const rateLimitKey = `otp_rate_limit:${email}`;
            const attempts = await redisClient.get(rateLimitKey);
            if (attempts && parseInt(attempts) >= 3) {
                return res.status(429).json({ 
                    error: 'Too many OTP requests. Please wait 15 minutes before trying again.' 
                });
            }

            // For password-reset, check if user exists (but don't reveal if they don't)
            if (purpose === 'password-reset') {
                const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
                if (userResult.rows.length === 0) {
                    return res.json({ message: 'If this email exists, an OTP has been sent' });
                }
            }

            // Generate OTP
            const otp = AuthController.generateOTP();

            // Store OTP in Redis with purpose-specific key and 10 minute expiry
            const otpKey = `otp:${purpose}:${email}`;
            console.log(`Storing OTP with key: ${otpKey}, value: ${otp}`);
            await redisClient.setEx(otpKey, 600, otp);

            // Increment rate limit counter
            await redisClient.setEx(rateLimitKey, 900, String((parseInt(attempts) || 0) + 1)); // 15 minutes

            // Send OTP email based on purpose
            let subject, html;
            switch (purpose) {
                case 'password-reset':
                    subject = 'Password Reset OTP';
                    html = `
                        <h2>Password Reset Request</h2>
                        <p>Your OTP for resetting your password is: <strong>${otp}</strong></p>
                        <p>This OTP will expire in 10 minutes.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    `;
                    break;
                case 'account-verification':
                    subject = 'Account Verification OTP';
                    html = `
                        <h2>Account Verification</h2>
                        <p>Your OTP for account verification is: <strong>${otp}</strong></p>
                        <p>This OTP will expire in 10 minutes.</p>
                        <p>Please use this code to verify your account.</p>
                    `;
                    break;
                default: // verification
                    subject = 'Email Verification OTP';
                    html = `
                        <h2>Email Verification</h2>
                        <p>Your verification OTP is: <strong>${otp}</strong></p>
                        <p>This OTP will expire in 10 minutes.</p>
                        <p>Please use this code to complete the verification process.</p>
                    `;
            }

            await sendMail({
                to: email,
                subject,
                html
            });

            res.json({ 
                message: 'OTP sent successfully',
                purpose,
                expiresIn: 600 // 10 minutes in seconds
            });

        } catch (error) {
            console.error('Send OTP error:', error);
            res.status(500).json({ error: 'Failed to send OTP' });
        }
    }

    // Generic verify OTP method
    static async verifyOTP(req, res) {
        try {
            // Validate OTP verification data
            const validation = validateOTPVerification(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors,
                    code: 'VALIDATION_ERROR'
                });
            }


            const { email, otp, purpose } = validation.sanitized;

            // Get OTP from Redis
            const otpKey = `otp:${purpose}:${email}`;
            console.log('--- OTP DEBUG ---');
            console.log('Verifying OTP for:');
            console.log('Email:', email);
            console.log('Purpose:', purpose);
            console.log('OTP entered by user:', otp);
            console.log('Redis key used:', otpKey);
            const storedOTP = await redisClient.get(otpKey);
            console.log('OTP fetched from Redis:', storedOTP);

            if (!storedOTP) {
                console.log('OTP not found or expired in Redis.');
                return res.status(400).json({ 
                    error: 'OTP expired or not found. Please request a new one.' 
                });
            }

            if (String(storedOTP).trim() !== String(otp).trim()) {
                console.log('OTP mismatch. Entered:', otp, 'Stored:', storedOTP);
                return res.status(400).json({ error: 'Invalid OTP' });
            }

            // Generate verification token for confirmed verification
            const verificationToken = jwt.sign(
                { 
                    email, 
                    purpose, 
                    verified: true,
                    timestamp: Date.now()
                },
                process.env.JWT_SECRET,
                { expiresIn: '1h' } // Token valid for 1 hour
            );

            // Delete OTP from Redis
            await redisClient.del(otpKey);

            // Clear rate limit
            await redisClient.del(`otp_rate_limit:${email}`);

            res.json({ 
                message: 'OTP verified successfully',
                verified: true,
                email,
                purpose,
                verificationToken,
                token: verificationToken // Alias for backward compatibility
            });

        } catch (error) {
            console.error('Verify OTP error:', error);
            res.status(500).json({ error: 'Failed to verify OTP' });
        }
    }

    // Verify token (for modules)
    static async verifyToken(req, res) {
        try {
            res.json({
                valid: true,
                user: {
                    id: req.user.id,
                    email: req.user.email,
                    planType: req.user.plan_type,
                    creditsRemaining: req.user.credits_remaining
                }
            });
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(500).json({
                error: 'Token verification failed',
                code: 'VERIFY_ERROR'
            });
        }
    }

    // Refresh token
    static async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies?.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    error: 'Refresh token required',
                    code: 'REFRESH_TOKEN_MISSING'
                });
            }

            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

            // Check if user exists
            const result = await query(
                'SELECT id, email FROM users WHERE id = $1',
                [decoded.userId]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            const user = result.rows[0];

            // Generate new tokens
            const newAccessToken = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
            );

            const newRefreshToken = jwt.sign(
                { userId: user.id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
            );

            // Set new cookies
            AuthController.setAuthCookies(res, newAccessToken, newRefreshToken);

            res.json({
                message: 'Token refreshed successfully',
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        } catch (error) {
            console.error('Token refresh error:', error);
            AuthController.clearAuthCookies(res);
            res.status(401).json({
                error: 'Invalid refresh token',
                code: 'INVALID_REFRESH_TOKEN'
            });
        }
    }

    // Logout user
    static async logout(req, res) {
        try {
            AuthController.clearAuthCookies(res);
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ error: 'Failed to logout' });
        }
    }
}

export default AuthController;
