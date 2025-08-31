import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
    const [searchParams] = useSearchParams()
    const { login } = useAuth()

    const redirectUrl = searchParams.get('redirect')

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
            await login(validation.sanitized.email, validation.sanitized.password, redirectUrl)
        } catch (error) {
            console.error('Login error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left: Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center bg-white px-8 py-12">
                <div className="w-full max-w-md">
                    <div className="flex flex-col items-center mb-8">
                        <div className="bg-blue-100 rounded-full p-3 mb-4">
                            <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="#2563eb" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/></svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
                        <p className="text-gray-600">Sign in to your Autoverse account</p>
                    </div>
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                            <div className="mt-1 relative">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className={`appearance-none block w-full px-4 py-3 border ${validationErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="#2563eb" d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 0v.01L12 13l8-6.99V6H4zm16 2.236l-8 7-8-7V18h16V8.236z"/></svg>
                                </span>
                            </div>
                            {validationErrors.email && <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>}
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <div className="mt-1 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className={`appearance-none block w-full px-4 py-3 border ${validationErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="#2563eb" d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-7V7a6 6 0 10-12 0v3a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2zm-2 0H8V7a4 4 0 118 0v3z"/></svg>
                                </span>
                            </div>
                            {validationErrors.password && <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>}
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" />
                                <span className="ml-2 text-sm text-gray-600">Remember me</span>
                            </label>
                            <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-blue-600 hover:underline">Forgot password?</button>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign in'} <span className="ml-2">→</span>
                        </button>
                        <div className="text-center text-sm text-gray-500">
                            Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Sign up for free</Link>
                        </div>
                        <div className="mt-6">
                            <div className="flex items-center justify-center space-x-2">
                                <span className="h-px w-16 bg-gray-300" />
                                <span className="text-gray-400 text-sm">Or continue with</span>
                                <span className="h-px w-16 bg-gray-300" />
                            </div>
                            <div className="mt-4 flex">
                                <button type="button" className="flex-1 flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 shadow-sm text-gray-700 font-medium">
                                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" className="mr-2"><path d="M21.35 11.1h-9.17v2.98h5.24c-.22 1.18-1.32 3.47-5.24 3.47-3.15 0-5.73-2.61-5.73-5.83s2.58-5.83 5.73-5.83c1.8 0 3.01.77 3.7 1.43l2.52-2.45C16.13 3.9 14.29 3 12.18 3 6.73 3 2.5 7.23 2.5 12.5S6.73 22 12.18 22c5.06 0 8.4-3.56 8.4-8.56 0-.57-.06-1.13-.15-1.64z" /></svg>
                                    Google
                                </button>
                            </div>
                        </div>
                    </form>
                    <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
                </div>
            </div>
            {/* Right: Features Panel */}
            <div className="hidden md:flex flex-1 flex-col justify-center items-center bg-gradient-to-br from-blue-600 to-blue-500 text-white px-8 py-12">
                <div className="max-w-md">
                    <h2 className="text-3xl font-bold mb-4">Welcome back</h2>
                    <p className="mb-6 text-xl font-semibold text-blue-100 bg-blue-700 rounded-lg px-4 py-3 shadow-lg">Your modules are waiting.</p>
                    <p className="text-lg mt-4 text-blue-200 italic">Unleash your creativity and manage your content like a pro.</p>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
