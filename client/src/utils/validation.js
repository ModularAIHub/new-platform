// Client-side validation utilities that match backend validation

/**
 * Validate email format
 */
export const validateEmail = (email) => {
    const errors = []
    
    if (!email || typeof email !== 'string') {
        errors.push('Email is required')
        return { isValid: false, errors }
    }
    
    const trimmedEmail = email.trim()
    
    if (trimmedEmail.length === 0) {
        errors.push('Email is required')
        return { isValid: false, errors }
    }
    
    if (trimmedEmail.length > 254) {
        errors.push('Email is too long')
        return { isValid: false, errors }
    }
    
    // RFC 5322 compliant email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    
    if (!emailRegex.test(trimmedEmail)) {
        errors.push('Please enter a valid email address')
        return { isValid: false, errors }
    }
    
    return { 
        isValid: true, 
        errors: [], 
        sanitized: trimmedEmail.toLowerCase() 
    }
}

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
    const errors = []
    
    if (!password || typeof password !== 'string') {
        errors.push('Password is required')
        return { isValid: false, errors }
    }
    
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long')
    }
    
    if (password.length > 128) {
        errors.push('Password is too long (maximum 128 characters)')
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number')
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
        errors.push('Password must contain at least one special character (@$!%*?&)')
    }
    
    // Check for common weak patterns
    const commonPatterns = [
        /(.)\1{2,}/, // Three or more repeated characters
        /123456|654321|abcdef|qwerty|password/i, // Common sequences
    ]
    
    for (const pattern of commonPatterns) {
        if (pattern.test(password)) {
            errors.push('Password contains common patterns and is too weak')
            break
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: password
    }
}

/**
 * Validate name (for registration)
 */
export const validateName = (name) => {
    const errors = []
    
    if (!name || typeof name !== 'string') {
        errors.push('Name is required')
        return { isValid: false, errors }
    }
    
    const trimmedName = name.trim()
    
    if (trimmedName.length === 0) {
        errors.push('Name is required')
        return { isValid: false, errors }
    }
    
    if (trimmedName.length < 2) {
        errors.push('Name must be at least 2 characters long')
    }
    
    if (trimmedName.length > 100) {
        errors.push('Name is too long (maximum 100 characters)')
    }
    
    // Allow letters, spaces, hyphens, apostrophes, and dots
    const nameRegex = /^[a-zA-Z\s\-'.]+$/
    if (!nameRegex.test(trimmedName)) {
        errors.push('Name can only contain letters, spaces, hyphens, apostrophes, and dots')
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: trimmedName
    }
}

/**
 * Validate OTP format
 */
export const validateOTP = (otp) => {
    const errors = []
    
    if (!otp || typeof otp !== 'string') {
        errors.push('OTP is required')
        return { isValid: false, errors }
    }
    
    const trimmedOTP = otp.trim()
    
    if (trimmedOTP.length === 0) {
        errors.push('OTP is required')
        return { isValid: false, errors }
    }
    
    if (trimmedOTP.length !== 6) {
        errors.push('OTP must be exactly 6 digits')
    }
    
    if (!/^\d{6}$/.test(trimmedOTP)) {
        errors.push('OTP must contain only numbers')
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized: trimmedOTP
    }
}

/**
 * Validate registration data
 */
export const validateRegistrationData = (data) => {
    const { name, email, password, otp } = data
    const errors = {}
    let isValid = true
    
    // Validate name
    const nameValidation = validateName(name)
    if (!nameValidation.isValid) {
        errors.name = nameValidation.errors
        isValid = false
    }
    
    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
        errors.email = emailValidation.errors
        isValid = false
    }
    
    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors
        isValid = false
    }
    
    // Validate OTP if provided
    if (otp) {
        const otpValidation = validateOTP(otp)
        if (!otpValidation.isValid) {
            errors.otp = otpValidation.errors
            isValid = false
        }
    }
    
    return {
        isValid,
        errors,
        sanitized: {
            name: nameValidation.sanitized || name,
            email: emailValidation.sanitized || email,
            password: passwordValidation.sanitized || password,
            otp: otp ? validateOTP(otp).sanitized || otp : otp
        }
    }
}

/**
 * Validate login data
 */
export const validateLoginData = (data) => {
    const { email, password } = data
    const errors = {}
    let isValid = true
    
    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
        errors.email = emailValidation.errors
        isValid = false
    }
    
    // Basic password validation for login (just check if present)
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
        errors.password = ['Password is required']
        isValid = false
    }
    
    return {
        isValid,
        errors,
        sanitized: {
            email: emailValidation.sanitized || email,
            password: password
        }
    }
}

/**
 * Validate OTP request data
 */
export const validateOTPRequest = (data) => {
    const { email, purpose } = data
    const errors = {}
    let isValid = true
    
    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
        errors.email = emailValidation.errors
        isValid = false
    }
    
    // Validate purpose
    const validPurposes = ['verification', 'password-reset', 'account-verification']
    if (!purpose || !validPurposes.includes(purpose)) {
        errors.purpose = ['Invalid OTP purpose']
        isValid = false
    }
    
    return {
        isValid,
        errors,
        sanitized: {
            email: emailValidation.sanitized || email,
            purpose: purpose
        }
    }
}

/**
 * Validate OTP verification data
 */
export const validateOTPVerification = (data) => {
    const { email, otp, purpose } = data
    const errors = {}
    let isValid = true
    
    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
        errors.email = emailValidation.errors
        isValid = false
    }
    
    // Validate OTP
    const otpValidation = validateOTP(otp)
    if (!otpValidation.isValid) {
        errors.otp = otpValidation.errors
        isValid = false
    }
    
    // Validate purpose
    const validPurposes = ['verification', 'password-reset', 'account-verification']
    if (!purpose || !validPurposes.includes(purpose)) {
        errors.purpose = ['Invalid OTP purpose']
        isValid = false
    }
    
    return {
        isValid,
        errors,
        sanitized: {
            email: emailValidation.sanitized || email,
            otp: otpValidation.sanitized || otp,
            purpose: purpose
        }
    }
}

/**
 * Validate password change data
 */
export const validatePasswordChange = (data) => {
    const { newPassword, confirmPassword, verificationToken } = data
    const errors = {}
    let isValid = true
    
    // Validate new password
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
        errors.newPassword = passwordValidation.errors
        isValid = false
    }
    
    // Validate confirm password
    if (!confirmPassword || confirmPassword !== newPassword) {
        errors.confirmPassword = ['Passwords do not match']
        isValid = false
    }
    
    // Validate verification token
    if (!verificationToken || typeof verificationToken !== 'string' || verificationToken.trim().length === 0) {
        errors.verificationToken = ['Verification token is required']
        isValid = false
    }
    
    return {
        isValid,
        errors,
        sanitized: {
            newPassword: passwordValidation.sanitized || newPassword,
            confirmPassword: confirmPassword,
            verificationToken: verificationToken?.trim()
        }
    }
}

export const validatePasswordMatch = (password, confirmPassword) => {
    const errors = []
    
    if (!confirmPassword) {
        errors.push('Please confirm your password')
    } else if (password !== confirmPassword) {
        errors.push('Passwords do not match')
    }
    
    return {
        isValid: errors.length === 0,
        errors
    }
}

/**
 * Helper function to format validation errors for display
 */
export const formatValidationErrors = (errors) => {
    const formatted = {}
    
    for (const [field, fieldErrors] of Object.entries(errors)) {
        if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
            formatted[field] = fieldErrors[0] // Show first error only
        }
    }
    
    return formatted
}

/**
 * Helper function to check if there are any validation errors
 */
export const hasValidationErrors = (errors) => {
    return Object.keys(errors).length > 0
}
