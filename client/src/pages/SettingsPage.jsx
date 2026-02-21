import { useState, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, Shield, X, Lock, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { validatePassword, validatePasswordMatch } from '../utils/validation'
import api from '../utils/api'
import {
    Button,
    Input,
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from '../components/ui'

const SettingsPage = () => {
    const { user, sendOTP, changePassword } = useAuth()
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

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">Settings</h1>
                    <p className="text-lg text-neutral-600">Manage your account settings and preferences</p>
                </div>

                <div className="space-y-8">
                    {/* Account Information */}
                    <Card variant="elevated" className="animate-fade-in animate-stagger-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary-600" />
                                </div>
                                Account Information
                            </CardTitle>
                            <CardDescription>
                                Your basic account details and membership information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-neutral-700">Full Name</label>
                                    <p className="text-sm text-neutral-900 font-medium">{user?.name || 'Not provided'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-neutral-700">Email Address</label>
                                    <p className="text-sm text-neutral-900 font-medium">{user?.email || 'Not provided'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-neutral-700">Current Plan</label>
                                    <div className="flex items-center space-x-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
                                            {user?.planType || 'Free'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-neutral-700">Member Since</label>
                                    <p className="text-sm text-neutral-900 font-medium">
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'Not available'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Settings */}
                    <Card variant="elevated" className="animate-fade-in animate-stagger-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                                    <Shield className="h-5 w-5 text-success-600" />
                                </div>
                                Security Settings
                            </CardTitle>
                            <CardDescription>
                                Manage your account security and authentication preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Change Password */}
                                <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                            <Lock className="h-4 w-4 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-neutral-900">Change Password</h3>
                                            <p className="text-xs text-neutral-500">Update your account password with OTP verification</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleChangePasswordClick}
                                    >
                                        Change
                                    </Button>
                                </div>

                            </div>
                        </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    <Card variant="elevated" className="border-error-200 animate-fade-in animate-stagger-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-error-900">
                                <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center">
                                    <AlertTriangle className="h-5 w-5 text-error-600" />
                                </div>
                                Danger Zone
                            </CardTitle>
                            <CardDescription className="text-error-600">
                                Irreversible and destructive actions for your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 border border-error-200 rounded-lg bg-error-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-error-100 rounded-lg flex items-center justify-center">
                                            <X className="h-4 w-4 text-error-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-error-900">Delete Account</h3>
                                            <p className="text-xs text-error-600">Permanently delete your account and all associated data</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="error"
                                        size="sm"
                                        onClick={() => setShowDeleteAccount(true)}
                                    >
                                        Delete Account
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Modals */}
                {/* Step 1: Initial Change Password Dialog */}
                {showChangePasswordDialog && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-md animate-scale-in">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Change Password</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClosePasswordDialogs}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <CardDescription>
                                    We'll send you an OTP to verify your email before changing your password.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Input
                                    label="Email"
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                />
                                <div className="flex space-x-3 mt-6">
                                    <Button
                                        variant="outline"
                                        onClick={handleClosePasswordDialogs}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleSendOTP}
                                        loading={loading}
                                        className="flex-1"
                                    >
                                        Send OTP
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 2: OTP Verification Dialog */}
                {showOTPDialog && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-md animate-scale-in">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Verify OTP</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClosePasswordDialogs}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <CardDescription>
                                    Enter the 6-digit OTP sent to {user?.email}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleVerifyOTP}>
                                    <Input
                                        label="OTP"
                                        type="text"
                                        value={otp}
                                        onChange={handleOtpChange}
                                        maxLength={6}
                                        placeholder="Enter 6-digit OTP"
                                        autoFocus
                                    />
                                    <div className="flex space-x-3 mt-6">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleClosePasswordDialogs}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            loading={loading}
                                            disabled={!otp || otp.length !== 6}
                                            className="flex-1"
                                        >
                                            Verify OTP
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 3: New Password Dialog */}
                {showNewPasswordDialog && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-md animate-scale-in">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Set New Password</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClosePasswordDialogs}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSetNewPassword} className="space-y-4">
                                    <Input
                                        label="New Password"
                                        type="password"
                                        value={newPassword}
                                        onChange={handleNewPasswordChange}
                                        error={passwordErrors.newPassword}
                                        placeholder="Enter new password"
                                        autoFocus
                                    />
                                    <Input
                                        label="Confirm New Password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={handleConfirmPasswordChange}
                                        error={passwordErrors.confirmPassword}
                                        placeholder="Confirm new password"
                                    />
                                    <div className="flex space-x-3 mt-6">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleClosePasswordDialogs}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            loading={loading}
                                            disabled={!newPassword || !confirmPassword}
                                            className="flex-1"
                                        >
                                            Update Password
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Delete Account Modal */}
                {showDeleteAccount && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-md animate-scale-in border-error-200">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-error-900">Delete Account</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowDeleteAccount(false)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-6">
                                    <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-4">
                                        <div className="flex">
                                            <AlertTriangle className="h-5 w-5 text-error-400 flex-shrink-0" />
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-error-800">
                                                    This action cannot be undone!
                                                </h3>
                                                <div className="mt-2 text-sm text-error-700">
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

                                    <Input
                                        label='Type "DELETE" to confirm'
                                        type="text"
                                        value={deleteConfirmation}
                                        onChange={handleDeleteConfirmationChange}
                                        placeholder="DELETE"
                                        helperText="Type DELETE in capital letters to confirm"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex space-x-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowDeleteAccount(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="error"
                                        onClick={handleDeleteAccount}
                                        loading={loading}
                                        disabled={deleteConfirmation !== 'DELETE'}
                                        className="flex-1"
                                    >
                                        Delete Account
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SettingsPage
