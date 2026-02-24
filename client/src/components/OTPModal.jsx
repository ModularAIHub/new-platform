import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { validateOTPRequest, validateOTPVerification, formatValidationErrors } from '../utils/validation'
import api from '../utils/api'



const OTPModal = ({ 
    isOpen, 
    onClose, 
    email: propEmail = '', 
    onSuccess, 
    title = 'Email Verification',
    purpose = 'verification' // 'verification', 'password-reset', etc.
}) => {
    const [step, setStep] = useState(1) // 1: email, 2: otp
    const [email, setEmail] = useState(propEmail)
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingResend, setLoadingResend] = useState(false)
    const [resendTimer, setResendTimer] = useState(0)
    const [validationErrors, setValidationErrors] = useState({})
    

    // Refs for stable input focus
    const emailInputRef = useRef(null)
    const otpInputRef = useRef(null)

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setStep(propEmail ? 2 : 1) // Skip to OTP if email is provided
            setEmail(propEmail)
            setOtp('')
            setResendTimer(0)
            setValidationErrors({})
        }
    }, [isOpen, propEmail])

    // Timer effect for resend countdown
    useEffect(() => {
        let interval = null
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(timer => timer - 1)
            }, 1000)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [resendTimer])

    // Stable OTP input handler
    const handleOTPChange = useCallback((e) => {
        const value = e.target.value.replace(/\D/g, '') // Only digits
        setOtp(value)
        // Clear validation errors when user types
        setValidationErrors(prev => ({ ...prev, otp: undefined }))
    }, [])

    // Send OTP to email
    const handleSendOTP = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        // Clear previous validation errors
        setValidationErrors({})
        
        // Validate OTP request
        const validation = validateOTPRequest({ email, purpose })
        if (!validation.isValid) {
            const formattedErrors = formatValidationErrors(validation.errors)
            setValidationErrors(formattedErrors)
            toast.error('Please fix the validation errors')
            return
        }

        setLoading(true)
        try {
            const response = await api.post('/auth/send-otp', {
                email: validation.sanitized.email,
                purpose: validation.sanitized.purpose 
            })
            
            toast.success(response.data?.message || 'OTP sent to your email')
            setStep(2)
            setResendTimer(30) // 30 second cooldown
        } catch (error) {
            const message = error.response?.data?.error || error.response?.data?.message || 'Failed to send OTP'
            toast.error(message)
            console.error('Send OTP error:', error)
        }
        setLoading(false)
    }

    // Verify OTP
    const handleVerifyOTP = async (e) => {
        console.log('Verify OTP clicked');
        e.preventDefault()
        e.stopPropagation()
        
        if (loading) return // Prevent double submission
        
        // Clear previous validation errors
        setValidationErrors({})
        
        // Validate OTP verification
        const validation = validateOTPVerification({ email, otp, purpose })
        if (!validation.isValid) {
            const formattedErrors = formatValidationErrors(validation.errors)
            setValidationErrors(formattedErrors)
            toast.error('Please fix the validation errors')
            return
        }
        
        setLoading(true)
        try {
            console.log('Sending OTP verification:', {
                email: validation.sanitized.email,
                otp: validation.sanitized.otp,
                purpose: validation.sanitized.purpose
            })
            
            const response = await api.post('/auth/verify-otp', {
                email: validation.sanitized.email, 
                otp: validation.sanitized.otp,
                purpose: validation.sanitized.purpose 
            })

            const data = response.data
            console.log('OTP verification response:', data)
            
            // Call success callback with verification data
            if (onSuccess) {
                onSuccess({
                    email: validation.sanitized.email,
                    otp: validation.sanitized.otp,
                    verificationToken: data.token || data.verificationToken,
                    ...data
                })
            }
            
            // Don't call handleClose here, let parent component handle it
        } catch (error) {
            const message = error.response?.data?.message || 'Invalid OTP'
            toast.error(message)
            console.error('Verify OTP error:', error)
        }
        setLoading(false)
    }

    // Resend OTP
    const handleResendOTP = async (e) => {
        console.log('Resend OTP clicked');
        if (e) e.stopPropagation()
        if (resendTimer > 0) return
        
        setLoadingResend(true)
        try {
            const response = await api.post('/auth/send-otp', {
                email,
                purpose 
            })
            
            toast.success(response.data?.message || 'OTP sent again!')
            setResendTimer(30)
        } catch (error) {
            const message = error.response?.data?.error || error.response?.data?.message || 'Failed to resend OTP'
            toast.error(message)
            console.error('Resend OTP error:', error)
        }
        setLoadingResend(false)
    }

    // Close modal and reset state
    const handleClose = () => {
        setStep(propEmail ? 2 : 1)
        setEmail(propEmail)
        setOtp('')
        setResendTimer(0)
        setLoading(false)
        setLoadingResend(false)
        onClose?.()
    }

    // Go back to email step
    const handleGoBack = () => {
        setStep(1)
        setOtp('')
        setResendTimer(0)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 relative">
                {/* Close button */}
                <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
                    disabled={loading}
                >
                    ×
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {title}
                    </h2>
                    <p className="text-gray-600">
                        {step === 1 
                            ? 'Enter your email address to receive a verification code'
                            : 'Enter the 6-digit code sent to your email'
                        }
                    </p>
                </div>

                {/* Step 1: Email Input */}
                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                ref={emailInputRef}
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    // Clear validation errors when user types
                                    setValidationErrors(prev => ({ ...prev, email: undefined }))
                                }}
                                placeholder="Enter your email"
                                required
                                disabled={loading}
                                className={`w-full px-4 py-3 border ${
                                    validationErrors.email ? 'border-red-500' : 'border-gray-300'
                                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed`}
                            />
                            {validationErrors.email && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP Input */}
                {step === 2 && (
                    <>
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Verification Code
                                </label>
                                <input
                                    ref={otpInputRef}
                                    type="text"
                                    value={otp}
                                    onChange={handleOTPChange}
                                    placeholder="Enter 6-digit code"
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                    required
                                    disabled={loading}
                                    className={`w-full px-4 py-3 border ${
                                        validationErrors.otp ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg text-center text-2xl tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed`}
                                />
                                {validationErrors.otp && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.otp}</p>
                                )}
                                <p className="text-sm text-gray-600 mt-2 text-center">
                                    Code sent to: <span className="font-medium">{email}</span>
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>

                            <div className="flex justify-between items-center text-sm">
                                {!propEmail && (
                                    <button
                                        type="button"
                                        onClick={handleGoBack}
                                        disabled={loading}
                                        className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        ← Change Email
                                    </button>
                                )}
                            </div>
                        </form>
                        {/* Render Resend OTP button outside the form */}
                        <div className="flex justify-end items-center text-sm mt-4">
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={loading || resendTimer > 0}
                                className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed ml-auto"
                            >
                                {loadingResend ? 'Sending...' : resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default OTPModal
