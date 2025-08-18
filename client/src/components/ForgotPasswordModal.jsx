import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import OTPModal from './OTPModal'
import { validatePasswordChange, formatValidationErrors } from '../utils/validation'

// Client-side password validation
const validatePassword = (password) => {
    const errors = {}
    if (password.length < 8) errors.length = 'Password must be at least 8 characters long'
    if (!/(?=.*[a-z])/.test(password)) errors.lowercase = 'Password must contain at least one lowercase letter'
    if (!/(?=.*[A-Z])/.test(password)) errors.uppercase = 'Password must contain at least one uppercase letter'
    if (!/(?=.*\d)/.test(password)) errors.number = 'Password must contain at least one number'
    if (!/(?=.*[@$!%*?&])/.test(password)) errors.special = 'Password must contain at least one special character (@$!%*?&)'
    return errors
}

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const { resetPassword } = useAuth()
    const [step, setStep] = useState(1) // 1: OTP verification, 2: set new password
    const [email, setEmail] = useState('')
    const [verificationToken, setVerificationToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordErrors, setPasswordErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [showOTPModal, setShowOTPModal] = useState(false)

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1)
            setEmail('')
            setVerificationToken('')
            setNewPassword('')
            setConfirmPassword('')
            setPasswordErrors({})
            setShowOTPModal(true)
        } else {
            setShowOTPModal(false)
        }
    }, [isOpen])

    // Handle successful OTP verification
    const handleOTPSuccess = (data) => {
        setEmail(data.email)
        setVerificationToken(data.verificationToken)
        setShowOTPModal(false)
        setStep(2) // Move to password reset step
        toast.success('Email verified! Now set your new password.')
    }

    // Handle OTP modal close
    const handleOTPModalClose = () => {
        setShowOTPModal(false)
        onClose?.() // Close the main modal if OTP modal is closed
    }

    const handleSetNewPassword = async (e) => {
        e.preventDefault()
        
        // Clear previous validation errors
        setPasswordErrors({})
        
        // Validate password change data
        const validation = validatePasswordChange({ 
            newPassword, 
            confirmPassword, 
            verificationToken 
        })
        
        if (!validation.isValid) {
            const formattedErrors = formatValidationErrors(validation.errors)
            setPasswordErrors(formattedErrors)
            toast.error('Please fix the validation errors below')
            return
        }
        
        setLoading(true)
        try {
            // Use the verification token to reset password
            await resetPassword(validation.sanitized.newPassword, validation.sanitized.verificationToken)
            
            // Reset all state
            setStep(1)
            setEmail('')
            setVerificationToken('')
            setNewPassword('')
            setConfirmPassword('')
            setPasswordErrors({})
            onClose?.()
        } catch (error) {
            toast.error('Failed to change password. Please try again.')
        }
        setLoading(false)
    }

    if (!isOpen) return null

    return (
        <>
            {/* OTP Modal for email verification */}
            <OTPModal
                isOpen={showOTPModal}
                onClose={handleOTPModalClose}
                title="Reset Password"
                purpose="password-reset"
                onSuccess={handleOTPSuccess}
            />

            {/* Password Reset Modal - only shown after OTP verification */}
            {step === 2 && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
                        <button 
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" 
                            onClick={onClose}
                        >
                            &times;
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-center">Set New Password</h2>
                        <p className="text-sm text-gray-600 mb-4 text-center">
                            Email verified: <span className="font-medium">{email}</span>
                        </p>
                        
                        <form onSubmit={handleSetNewPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">New Password</label>
                                <input 
                                    type="password" 
                                    value={newPassword} 
                                    onChange={e => {
                                        setNewPassword(e.target.value)
                                        // Clear validation errors when user types
                                        setPasswordErrors(prev => ({ ...prev, newPassword: undefined }))
                                    }} 
                                    required 
                                    className={`mt-1 block w-full px-3 py-2 border ${
                                        passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                                    } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`} 
                                    placeholder="Enter new password"
                                />
                                {passwordErrors.newPassword && (
                                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                                <input 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={e => {
                                        setConfirmPassword(e.target.value)
                                        // Clear validation errors when user types
                                        setPasswordErrors(prev => ({ ...prev, confirmPassword: undefined }))
                                    }} 
                                    required 
                                    className={`mt-1 block w-full px-3 py-2 border ${
                                        passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`} 
                                    placeholder="Confirm new password"
                                />
                                {passwordErrors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                                )}
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full py-2 px-4 bg-primary-600 text-white rounded-md disabled:opacity-50 hover:bg-primary-700"
                            >
                                {loading ? 'Saving...' : 'Set New Password'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

export default ForgotPasswordModal
