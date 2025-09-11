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
                console.log('Checking authentication with /auth/me endpoint...');
                
                // Since we're using httpOnly cookies, just try to call the protected endpoint
                // The cookies will be sent automatically with the request
                const response = await api.get('/auth/me')
                console.log('Auth API response:', response.data);
                
                if (response.data.success && response.data.user) {
                    setUser(response.data.user)
                    console.log('User authenticated successfully:', response.data.user)
                } else {
                    console.log('Authentication failed - no user data');
                    setUser(null);
                }
            } catch (error) {
                console.log('Auth check error:', error.response?.status, error.response?.data)
                console.log('Error details:', error);
                // Clear user state on auth failure
                setUser(null)
            } finally {
                setLoading(false)
                authCheckedRef.current = true
                console.log('Auth check completed, user set:', !!user)
            }
        }

        // Run auth check only once on mount
        checkAuth()
    }, []) // Empty dependency array - only run on mount

    const login = async (email, password, redirectUrl = null) => {
        try {
            // Always use regular login
            const response = await api.post('/auth/login', { email, password });
            
            setUser(response.data.user)
            toast.success('Login successful!')
            
            // Handle redirect after successful login
            if (redirectUrl) {
                // For external redirects (Tweet Genie), use secure form POST method
                if (redirectUrl.includes('localhost:5174') || redirectUrl.includes('tweet.suitegenie.in')) {
                    // Generate secure session and submit via form POST (no tokens in URL)
                    try {
                        const secureResponse = await api.post('/auth/generate-secure-session', { 
                            redirectUrl 
                        });
                        
                        if (secureResponse.data.success) {
                            // Create and submit a form to POST the session securely
                            const form = document.createElement('form');
                            form.method = 'POST';
                            form.action = secureResponse.data.postUrl;
                            
                            const sessionInput = document.createElement('input');
                            sessionInput.type = 'hidden';
                            sessionInput.name = 'sessionId';
                            sessionInput.value = secureResponse.data.sessionId;
                            form.appendChild(sessionInput);
                            
                            const redirectInput = document.createElement('input');
                            redirectInput.type = 'hidden';
                            redirectInput.name = 'redirect';
                            redirectInput.value = new URL(redirectUrl).pathname;
                            form.appendChild(redirectInput);
                            
                            document.body.appendChild(form);
                            form.submit();
                            return response.data;
                        }
                    } catch (autoLoginError) {
                        console.error('Secure session generation failed:', autoLoginError);
                        // Fallback to direct redirect
                        window.location.href = redirectUrl;
                    }
                } else {
                    // Internal redirect
                    window.location.href = redirectUrl;
                }
            } else {
                navigate('/dashboard');
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
