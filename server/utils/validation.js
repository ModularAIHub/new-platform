/**
 * Validation utilities for the platform
 * Centralized validation functions for consistent validation across the application
 */

// Email validation
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errors = [];

    if (!email) {
        errors.push('Email is required');
        return { isValid: false, errors };
    }

    if (typeof email !== 'string') {
        errors.push('Email must be a string');
        return { isValid: false, errors };
    }

    if (!emailRegex.test(email)) {
        errors.push('Please enter a valid email address');
    }

    if (email.length > 254) {
        errors.push('Email address is too long');
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitized: email ? email.toLowerCase().trim() : ''
    };
};

// Password validation
export const validatePassword = (password) => {
    const errors = [];

    if (!password) {
        errors.push('Password is required');
        return { isValid: false, errors };
    }

    if (typeof password !== 'string') {
        errors.push('Password must be a string');
        return { isValid: false, errors };
    }

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
    }

    if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
        errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    // Check for common weak passwords
    const commonPasswords = [
        'password', 'password123', '12345678', 'qwerty123', 
        'abc123456', 'password1', '123456789', 'welcome123'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Password is too common. Please choose a stronger password');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// OTP validation
export const validateOTP = (otp) => {
    const errors = [];

    if (!otp) {
        errors.push('OTP is required');
        return { isValid: false, errors };
    }

    if (typeof otp !== 'string') {
        errors.push('OTP must be a string');
        return { isValid: false, errors };
    }

    if (!/^\d{6}$/.test(otp)) {
        errors.push('OTP must be exactly 6 digits');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Name validation
export const validateName = (name) => {
    const errors = [];

    if (!name) {
        errors.push('Name is required');
        return { isValid: false, errors };
    }

    if (typeof name !== 'string') {
        errors.push('Name must be a string');
        return { isValid: false, errors };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
        errors.push('Name must be at least 2 characters long');
    }

    if (trimmedName.length > 50) {
        errors.push('Name must be less than 50 characters');
    }

    if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
        errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitized: trimmedName
    };
};

// Phone number validation (optional)
export const validatePhone = (phone) => {
    const errors = [];

    if (!phone) {
        return { isValid: true, errors }; // Phone is optional
    }

    if (typeof phone !== 'string') {
        errors.push('Phone number must be a string');
        return { isValid: false, errors };
    }

    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        errors.push('Phone number must be between 10 and 15 digits');
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitized: cleanPhone
    };
};

// Purpose validation for OTP
export const validateOTPPurpose = (purpose) => {
    const validPurposes = ['verification', 'password-reset', 'account-verification', 'account-deletion'];
    const errors = [];

    if (!purpose) {
        return { isValid: true, errors, sanitized: 'verification' }; // Default purpose
    }

    if (typeof purpose !== 'string') {
        errors.push('Purpose must be a string');
        return { isValid: false, errors };
    }

    if (!validPurposes.includes(purpose)) {
        errors.push(`Purpose must be one of: ${validPurposes.join(', ')}`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitized: purpose
    };
};

// Boolean validation
export const validateBoolean = (value, fieldName = 'field') => {
    const errors = [];

    if (value === undefined || value === null) {
        errors.push(`${fieldName} is required`);
        return { isValid: false, errors };
    }

    if (typeof value !== 'boolean') {
        errors.push(`${fieldName} must be a boolean (true or false)`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitized: !!value
    };
};

// String length validation
export const validateStringLength = (value, fieldName, minLength = 0, maxLength = Infinity) => {
    const errors = [];

    if (!value && minLength > 0) {
        errors.push(`${fieldName} is required`);
        return { isValid: false, errors };
    }

    if (value && typeof value !== 'string') {
        errors.push(`${fieldName} must be a string`);
        return { isValid: false, errors };
    }

    if (value) {
        if (value.length < minLength) {
            errors.push(`${fieldName} must be at least ${minLength} characters long`);
        }

        if (value.length > maxLength) {
            errors.push(`${fieldName} must be less than ${maxLength} characters`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitized: value ? value.trim() : value
    };
};

// URL validation
export const validateURL = (url, fieldName = 'URL') => {
    const errors = [];

    if (!url) {
        errors.push(`${fieldName} is required`);
        return { isValid: false, errors };
    }

    if (typeof url !== 'string') {
        errors.push(`${fieldName} must be a string`);
        return { isValid: false, errors };
    }

    try {
        new URL(url);
    } catch {
        errors.push(`${fieldName} must be a valid URL`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Registration data validation (combined validation)
export const validateRegistrationData = (data) => {
    const { email, password, name, verificationToken } = data;
    const errors = {};

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        errors.email = emailValidation.errors;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors;
    }

    // Validate name
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
        errors.name = nameValidation.errors;
    }

    // Validate verification token
    if (!verificationToken) {
        errors.verificationToken = ['Verification token is required'];
    } else if (typeof verificationToken !== 'string') {
        errors.verificationToken = ['Verification token must be a string'];
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        sanitized: {
            email: email?.toLowerCase().trim(),
            password,
            name: nameValidation.sanitized,
            verificationToken
        }
    };
};

// Login data validation
export const validateLoginData = (data) => {
    const { email, password } = data;
    const errors = {};

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        errors.email = emailValidation.errors;
    }

    // Basic password validation for login (just check if provided)
    if (!password) {
        errors.password = ['Password is required'];
    } else if (typeof password !== 'string') {
        errors.password = ['Password must be a string'];
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        sanitized: {
            email: email?.toLowerCase().trim(),
            password
        }
    };
};

// OTP request validation
export const validateOTPRequest = (data) => {
    const { email, purpose } = data;
    const errors = {};

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        errors.email = emailValidation.errors;
    }

    // Validate purpose
    const purposeValidation = validateOTPPurpose(purpose);
    if (!purposeValidation.isValid) {
        errors.purpose = purposeValidation.errors;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        sanitized: {
            email: email?.toLowerCase().trim(),
            purpose: purposeValidation.sanitized
        }
    };
};

// OTP verification validation
export const validateOTPVerification = (data) => {
    const { email, otp, purpose } = data;
    const errors = {};

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        errors.email = emailValidation.errors;
    }

    // Validate OTP
    const otpValidation = validateOTP(otp);
    if (!otpValidation.isValid) {
        errors.otp = otpValidation.errors;
    }

    // Validate purpose
    const purposeValidation = validateOTPPurpose(purpose);
    if (!purposeValidation.isValid) {
        errors.purpose = purposeValidation.errors;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        sanitized: {
            email: email?.toLowerCase().trim(),
            otp,
            purpose: purposeValidation.sanitized
        }
    };
};

// Password change validation (with OTP verification)
export const validatePasswordChange = (data) => {
    const { newPassword, verificationToken } = data;
    const errors = {};

    // Validate verification token
    if (!verificationToken) {
        errors.verificationToken = ['Verification token is required'];
    } else if (typeof verificationToken !== 'string') {
        errors.verificationToken = ['Verification token must be a string'];
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
        errors.newPassword = passwordValidation.errors;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        sanitized: {
            newPassword,
            verificationToken
        }
    };
};

// Password reset validation (for forgot password flow with OTP)
export const validatePasswordReset = (data) => {
    const { newPassword, email, otp, verificationToken } = data;
    const errors = {};

    // If using verificationToken (JWT-based flow), validate token and newPassword only
    if (verificationToken) {
        // Validate new password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            errors.newPassword = passwordValidation.errors;
        }

        if (!verificationToken || typeof verificationToken !== 'string') {
            errors.verificationToken = ['Verification token is required'];
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
            sanitized: {
                newPassword: newPassword?.trim(),
                verificationToken: verificationToken?.trim()
            }
        };
    }

    // Original OTP-based flow validation
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        errors.email = emailValidation.errors;
    }

    // Validate OTP
    if (!otp) {
        errors.otp = ['OTP is required'];
    } else if (typeof otp !== 'string') {
        errors.otp = ['OTP must be a string'];
    } else if (!/^\d{6}$/.test(otp)) {
        errors.otp = ['OTP must be a 6-digit number'];
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
        errors.newPassword = passwordValidation.errors;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        sanitized: {
            newPassword,
            email: emailValidation.sanitized,
            otp
        }
    };
};

// Notification preferences validation
export const validateNotificationPreferences = (data) => {
    const { emailEnabled } = data;
    const errors = {};

    const booleanValidation = validateBoolean(emailEnabled, 'emailEnabled');
    if (!booleanValidation.isValid) {
        errors.emailEnabled = booleanValidation.errors;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        sanitized: {
            emailEnabled: booleanValidation.sanitized
        }
    };
};

// Two-factor authentication validation
export const validateTwoFactorSettings = (data) => {
    const { enabled } = data;
    const errors = {};

    const booleanValidation = validateBoolean(enabled, 'enabled');
    if (!booleanValidation.isValid) {
        errors.enabled = booleanValidation.errors;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        sanitized: {
            enabled: booleanValidation.sanitized
        }
    };
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/[<>]/g, '') // Remove < and > characters
        .trim();
};

// Validate and sanitize object
export const validateAndSanitizeObject = (obj, validations) => {
    const result = {
        isValid: true,
        errors: {},
        sanitized: {}
    };

    for (const [field, validator] of Object.entries(validations)) {
        const value = obj[field];
        const validation = validator(value);
        
        if (!validation.isValid) {
            result.isValid = false;
            result.errors[field] = validation.errors;
        }
        
        result.sanitized[field] = validation.sanitized !== undefined ? validation.sanitized : value;
    }

    return result;
};

export default {
    validateEmail,
    validatePassword,
    validateOTP,
    validateName,
    validatePhone,
    validateOTPPurpose,
    validateBoolean,
    validateStringLength,
    validateURL,
    validateRegistrationData,
    validateLoginData,
    validateOTPRequest,
    validateOTPVerification,
    validatePasswordChange,
    validatePasswordReset,
    validateNotificationPreferences,
    validateTwoFactorSettings,
    sanitizeInput,
    validateAndSanitizeObject
};
