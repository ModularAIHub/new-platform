import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const authCheckedRef = useRef(false)
    const navigate = useNavigate()

    // Check if user is authenticated on mount - ONLY ONCE
    useEffect(() => {
        // Prevent multiple auth checks in React.StrictMode
        if (authCheckedRef.current) {
            console.log('Auth already checked, skipping...')
            return
        }

        console.log('Running auth check...')

        const checkAuth = async () => {
            try {
                const response = await api.get('/auth/verify-token')
                if (response.data.valid) {
                    setUser(response.data.user)
                }
            } catch (error) {
                console.log('User not authenticated')
            } finally {
                setLoading(false)
                authCheckedRef.current = true
                console.log('Auth check completed')
            }
        }

        // Run auth check only once on mount
        checkAuth()
    }, []) // Empty dependency array - only run on mount

    const login = async (email, password, redirectUrl = null) => {
        try {
            let response;
            
            if (redirectUrl) {
                // Use loginWithRedirect endpoint for external redirects
                response = await api.post('/auth/login-redirect', { email, password, redirectUrl })
                
                if (response.data.redirectUrl) {
                    // External redirect with access token
                    window.location.href = response.data.redirectUrl;
                    return response.data;
                }
            } else {
                // Regular login
                response = await api.post('/auth/login', { email, password })
            }
            
            setUser(response.data.user)
            console.log('User set after login:', response.data.user)
            toast.success('Login successful!')
            
            // Internal navigation
            if (redirectUrl && !response.data.redirectUrl) {
                console.log('Navigating to:', redirectUrl)
                navigate(redirectUrl)
            } else {
                console.log('Navigating to: /test-dashboard')
                navigate('/test-dashboard')
            }
            
            return response.data
        } catch (error) {
            let message
            if (error.response?.status === 429) {
                message = 'Too many requests. Please wait a few minutes before trying again.'
            } else {
                message = error.response?.data?.error || 'Unable to login right now. Please try again later.'
            }
            toast.error(message)
            throw error
        }
    }

    const register = async (name, email, password, verificationToken) => {
        try {
            const response = await api.post('/auth/register', { name, email, password, verificationToken })
            return response.data
        } catch (error) {
            let message
            if (error.response?.status === 429) {
                message = 'Too many requests. Please wait a few minutes before trying again.'
            } else {
                message = error.response?.data?.error || 'Unable to register right now. Please try again later.'
            }
            toast.error(message)
            throw error
        }
    }

    const sendOTP = async (email, purpose = 'verification') => {
        try {
            const response = await api.post('/auth/send-otp', { email, purpose })
            toast.success('OTP sent to your email!')
            return response.data
        } catch (error) {
            let message
            if (error.response?.status === 429) {
                message = 'Too many OTP requests. Please wait 15 minutes before trying again.'
            } else {
                message = error.response?.data?.error || 'Failed to send OTP. Please try again.'
            }
            toast.error(message)
            throw error
        }
    }

    const verifyOTP = async (email, otp, purpose = 'verification') => {
        try {
            const response = await api.post('/auth/verify-otp', { email, otp, purpose })
            return response.data
        } catch (error) {
            let message = error.response?.data?.error || 'OTP verification failed. Please try again.'
            toast.error(message)
            throw error
        }
    }

    const changePassword = async (newPassword, verificationToken) => {
        try {
            const response = await api.post('/auth/change-password', { newPassword, verificationToken })
            toast.success('Password changed successfully!')
            return response.data
        } catch (error) {
            let message = error.response?.data?.error || 'Failed to change password.'
            toast.error(message)
            throw error
        }
    }

    const resetPassword = async (newPassword, verificationToken) => {
        try {
            const response = await api.post('/auth/reset-password', { newPassword, verificationToken })
            toast.success('Password reset successfully!')
            return response.data
        } catch (error) {
            let message = error.response?.data?.error || 'Failed to reset password.'
            toast.error(message)
            throw error
        }
    }

    const updateNotifications = async (emailEnabled) => {
        try {
            const response = await api.post('/auth/notifications', { emailEnabled })
            toast.success('Notification preferences updated!')
            return response.data
        } catch (error) {
            let message = error.response?.data?.error || 'Failed to update notification preferences.'
            toast.error(message)
            throw error
        }
    }

    const toggleTwoFactor = async (enabled) => {
        try {
            const response = await api.post('/auth/two-factor', { enabled })
            toast.success(`Two-factor authentication ${enabled ? 'enabled' : 'disabled'}!`)
            return response.data
        } catch (error) {
            let message = error.response?.data?.error || 'Failed to update two-factor authentication.'
            toast.error(message)
            throw error
        }
    }

    const logout = async () => {
        try {
            await api.post('/auth/logout')
            setUser(null)
            toast.success('Logged out successfully')
            navigate('/')
        } catch (error) {
            console.error('Logout error:', error)
            // Still clear user state even if API call fails
            setUser(null)
            navigate('/')
        }
    }

    const refreshUser = async () => {
        // Only refresh if not already loading
        if (loading) return

        try {
            const response = await api.get('/auth/verify-token')
            if (response.data.valid) {
                setUser(response.data.user)
            }
        } catch (error) {
            console.error('Failed to refresh user:', error)
        }
    }

    const clearUser = () => {
        setUser(null)
    }

    const value = {
        user,
        loading,
        login,
        register,
        sendOTP,
        verifyOTP,
        changePassword,
        resetPassword,
        updateNotifications,
        toggleTwoFactor,
        logout,
        refreshUser,
        clearUser,
        isAuthenticated: !!user
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
