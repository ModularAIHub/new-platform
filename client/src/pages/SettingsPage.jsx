import { useState, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Settings, User, Shield, Bell, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { validatePassword, validatePasswordMatch } from '../utils/validation'
import api from '../utils/api'

const SettingsPage = () => {
    const { user, refreshUser, sendOTP, changePassword, updateNotifications, toggleTwoFactor } = useAuth()
    const [loading, setLoading] = useState(false)
    
    // Change Password Flow States
    const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)
    const [showOTPDialog, setShowOTPDialog] = useState(false)
    const [showNewPasswordDialog, setShowNewPasswordDialog] = useState(false)
    const [otp, setOtp] = useState('')
    const [verificationToken, setVerificationToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordErrors, setPasswordErrors] = useState({})
    
    // Delete Account States
    const [showDeleteAccount, setShowDeleteAccount] = useState(false)
    const [deleteConfirmation, setDeleteConfirmation] = useState('')
    
    // Other Settings States
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor_enabled ?? false)
    const [emailNotifications, setEmailNotifications] = useState(user?.notification_email_enabled ?? true)
    const [creditAlerts, setCreditAlerts] = useState(user?.credit_alerts_enabled ?? false)

    // Refs for input focus
    const deleteInputRef = useRef(null)
    const newPasswordRef = useRef(null)
    const confirmPasswordRef = useRef(null)
    const otpRef = useRef(null)

    // Stable input handlers using useCallback to prevent re-renders
    const handleDeleteConfirmationChange = useCallback((e) => {
        setDeleteConfirmation(e.target.value);
    }, []);

    const handleNewPasswordChange = useCallback((e) => {
        setNewPassword(e.target.value);
        setPasswordErrors(prev => ({ ...prev, newPassword: undefined }));
    }, []);

    const handleConfirmPasswordChange = useCallback((e) => {
        setConfirmPassword(e.target.value);
        setPasswordErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }, []);

    const handleOtpChange = useCallback((e) => {
        setOtp(e.target.value);
    }, []);

    // Step 1: Show initial change password dialog
    const handleChangePasswordClick = () => {
        setShowChangePasswordDialog(true)
    }

    // Step 2: Send OTP for password change
    const handleSendOTP = async () => {
        setLoading(true)
        try {
            await sendOTP(user.email, 'verification')
            setShowChangePasswordDialog(false)
            setShowOTPDialog(true)
            toast.success('OTP sent to your email!')
        } catch (error) {
            // Error handled by auth context
        } finally {
            setLoading(false)
        }
    }

    // Step 3: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault()
        
        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP')
            return
        }

        setLoading(true)
        try {
            const response = await api.post('/auth/verify-otp', {
                email: user.email,
                otp: otp,
                purpose: 'verification'
            })

            setVerificationToken(response.data.token || response.data.verificationToken)
            setShowOTPDialog(false)
            setShowNewPasswordDialog(true)
            setOtp('')
            toast.success('OTP verified! Now set your new password.')
        } catch (error) {
            const message = error.response?.data?.error || 'OTP verification failed'
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    // Step 4: Set new password
    const handleSetNewPassword = async (e) => {
        e.preventDefault()
        
        // Clear previous validation errors
        setPasswordErrors({})
        
        // Validate new password
        const passwordValidation = validatePassword(newPassword)
        if (!passwordValidation.isValid) {
            setPasswordErrors(prev => ({ ...prev, newPassword: passwordValidation.errors[0] }))
        }

        // Validate password match
        const matchValidation = validatePasswordMatch(newPassword, confirmPassword)
        if (!matchValidation.isValid) {
            setPasswordErrors(prev => ({ ...prev, confirmPassword: matchValidation.errors[0] }))
        }

        if (!passwordValidation.isValid || !matchValidation.isValid) {
            toast.error('Please fix the validation errors below')
            return
        }
        
        setLoading(true)
        try {
            await changePassword(newPassword, verificationToken)
            // Reset all states
            setShowNewPasswordDialog(false)
            setVerificationToken('')
            setNewPassword('')
            setConfirmPassword('')
            setPasswordErrors({})
            toast.success('Password changed successfully!')
        } catch (error) {
            // Error handled by auth context
        } finally {
            setLoading(false)
        }
    }

    // Close all password change dialogs
    const handleClosePasswordDialogs = () => {
        setShowChangePasswordDialog(false)
        setShowOTPDialog(false)
        setShowNewPasswordDialog(false)
        setOtp('')
        setVerificationToken('')
        setNewPassword('')
        setConfirmPassword('')
        setPasswordErrors({})
    }

    // Handle notification settings
    const handleEmailNotificationToggle = async () => {
        setLoading(true)
        try {
            const newValue = !emailNotifications
            await updateNotifications(newValue)
            setEmailNotifications(newValue)
        } catch (error) {
            // Error handled by auth context
        } finally {
            setLoading(false)
        }
    }

    // Handle two-factor authentication toggle
    const handleTwoFactorToggle = async () => {
        setLoading(true)
        try {
            const newValue = !twoFactorEnabled
            await toggleTwoFactor(newValue)
            setTwoFactorEnabled(newValue)
        } catch (error) {
            // Error handled by auth context
        } finally {
            setLoading(false)
        }
    }
    // Delete Account Flow
    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'DELETE') {
            toast.error('Please type DELETE in capital letters to confirm')
            return
        }

        if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
            return
        }

        setLoading(true)
        try {
            await api.delete('/auth/delete-account')
            toast.success('Account deleted successfully')
            // Redirect to home page
            window.location.href = '/'
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete account')
        } finally {
            setLoading(false)
        }
    }

    // Modal Components
    const DeleteAccountModal = () => {
        return (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-red-600">Delete Account</h3>
                        <button
                            onClick={() => setShowDeleteAccount(false)}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="mb-6">
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        This action cannot be undone!
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Your account will be permanently deleted</li>
                                            <li>All your data will be removed from our servers</li>
                                            <li>You will lose access to all your API keys</li>
                                            <li>Any remaining credits will be forfeited</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">
                            To confirm account deletion, please type <strong className="font-semibold text-gray-900">DELETE</strong> in the field below.
                        </p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type "DELETE" to confirm
                        </label>
                        <input
                            ref={deleteInputRef}
                            type="text"
                            value={deleteConfirmation}
                            onChange={handleDeleteConfirmationChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                            placeholder="DELETE"
                            autoComplete="off"
                            autoFocus
                        />
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowDeleteAccount(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteAccount}
                            disabled={loading || deleteConfirmation !== 'DELETE'}
                            className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Deleting...' : 'Delete Account'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white shadow rounded-lg p-6">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-2">Manage your account settings and preferences.</p>
            </div>

            {/* Account Information */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                    <User className="h-6 w-6 text-primary-600 mr-3" />
                    <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="mt-1 text-sm text-gray-900">{user?.name}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Plan Type</label>
                        <p className="mt-1 text-sm text-gray-900 capitalize">{user?.planType || 'Free'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Member Since</label>
                        <p className="mt-1 text-sm text-gray-900">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                    <Shield className="h-6 w-6 text-primary-600 mr-3" />
                    <h2 className="text-lg font-medium text-gray-900">Security</h2>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleChangePasswordClick}
                        className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Change Password</h3>
                                <p className="text-xs text-gray-500">Update your account password with OTP verification</p>
                            </div>
                            <span className="text-gray-400">→</span>
                        </div>
                    </button>

                    <button
                        onClick={handleTwoFactorToggle}
                        disabled={loading}
                        className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                                <p className="text-xs text-gray-500">Add an extra layer of security</p>
                            </div>
                            <div className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${twoFactorEnabled ? 'bg-primary-600' : 'bg-gray-200'}`}>
                                <span className={`${twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'} inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                    <Bell className="h-6 w-6 text-primary-600 mr-3" />
                    <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                            <p className="text-xs text-gray-500">Receive updates about your account</p>
                        </div>
                        <button
                            onClick={handleEmailNotificationToggle}
                            disabled={loading}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${emailNotifications ? 'bg-primary-600' : 'bg-gray-200'} disabled:opacity-50`}
                        >
                            <span className={`${emailNotifications ? 'translate-x-5' : 'translate-x-0'} inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">Credit Alerts</h3>
                            <p className="text-xs text-gray-500">Get notified when credits are low</p>
                        </div>
                        <button
                            onClick={() => setCreditAlerts(!creditAlerts)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${creditAlerts ? 'bg-primary-600' : 'bg-gray-200'}`}
                        >
                            <span className={`${creditAlerts ? 'translate-x-5' : 'translate-x-0'} inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white shadow rounded-lg p-6 border border-red-200">
                <div className="flex items-center mb-4">
                    <Settings className="h-6 w-6 text-red-600 mr-3" />
                    <h2 className="text-lg font-medium text-red-900">Danger Zone</h2>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => setShowDeleteAccount(true)}
                        className="w-full text-left p-4 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-red-900">Delete Account</h3>
                                <p className="text-xs text-red-600">Permanently delete your account and all data</p>
                            </div>
                            <span className="text-red-400">→</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* New Change Password Dialogs */}
            
            {/* Step 1: Initial Change Password Dialog */}
            {showChangePasswordDialog && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                            <button
                                onClick={handleClosePasswordDialogs}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">
                            We'll send you an OTP to verify your email before changing your password.
                        </p>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                            />
                        </div>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={handleClosePasswordDialogs}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendOTP}
                                disabled={loading}
                                className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Step 2: OTP Verification Dialog */}
            {showOTPDialog && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Verify OTP</h3>
                            <button
                                onClick={handleClosePasswordDialogs}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">
                            Enter the 6-digit OTP sent to {user?.email}
                        </p>
                        
                        <form onSubmit={handleVerifyOTP}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">OTP</label>
                                <input
                                    ref={otpRef}
                                    type="text"
                                    value={otp}
                                    onChange={handleOtpChange}
                                    maxLength={6}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Enter 6-digit OTP"
                                    autoFocus
                                />
                            </div>
                            
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={handleClosePasswordDialogs}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !otp || otp.length !== 6}
                                    className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {loading ? 'Verifying...' : 'Verify OTP'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Step 3: New Password Dialog */}
            {showNewPasswordDialog && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Set New Password</h3>
                            <button
                                onClick={handleClosePasswordDialogs}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSetNewPassword}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                <input
                                    ref={newPasswordRef}
                                    type="password"
                                    value={newPassword}
                                    onChange={handleNewPasswordChange}
                                    className={`w-full px-3 py-2 border ${
                                        passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                                    } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                                    placeholder="Enter new password"
                                    autoFocus
                                />
                                {passwordErrors.newPassword && (
                                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                                )}
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                <input
                                    ref={confirmPasswordRef}
                                    type="password"
                                    value={confirmPassword}
                                    onChange={handleConfirmPasswordChange}
                                    className={`w-full px-3 py-2 border ${
                                        passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                                    placeholder="Confirm new password"
                                />
                                {passwordErrors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                                )}
                            </div>
                            
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={handleClosePasswordDialogs}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !newPassword || !confirmPassword}
                                    className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Delete Account Modal */}
            {showDeleteAccount && <DeleteAccountModal />}
        </div>
    )
}

export default SettingsPage
