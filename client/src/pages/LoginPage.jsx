import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ForgotPasswordModal from '../components/ForgotPasswordModal'
import { validateLoginData, formatValidationErrors } from '../utils/validation'
import toast from 'react-hot-toast'

const LoginPage = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [validationErrors, setValidationErrors] = useState({})
    const { login } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        // Clear previous validation errors
        setValidationErrors({})
        
        // Validate form data
        const validation = validateLoginData({ email, password })
        if (!validation.isValid) {
            const formattedErrors = formatValidationErrors(validation.errors)
            setValidationErrors(formattedErrors)
            toast.error('Please fix the validation errors below')
            return
        }

        setLoading(true)
        try {
            await login(validation.sanitized.email, validation.sanitized.password)
        } catch (error) {
            console.error('Login error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                            create a new account
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                                    validationErrors.email ? 'border-red-500' : 'border-gray-300'
                                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {validationErrors.email && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                                    validationErrors.password ? 'border-red-500' : 'border-gray-300'
                                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {validationErrors.password && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-sm text-primary-600 hover:text-primary-500"
                        >
                            Forgot your password?
                        </button>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>

                <ForgotPasswordModal 
                    isOpen={showForgotPassword} 
                    onClose={() => setShowForgotPassword(false)} 
                />
            </div>
        </div>
    )
}

export default LoginPage
