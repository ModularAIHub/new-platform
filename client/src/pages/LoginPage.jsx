import { useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ForgotPasswordModal from '../components/ForgotPasswordModal'
import { validateLoginData, formatValidationErrors } from '../utils/validation'
import toast from 'react-hot-toast'
import { Button, Input, Card, CardContent } from '../components/ui'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import PublicSeo from '../components/PublicSeo'

const LoginPage = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [validationErrors, setValidationErrors] = useState({})
    const [searchParams] = useSearchParams()
    const { login } = useAuth()

    const redirectUrl = searchParams.get('redirect')

    const handleSubmit = useCallback(async (e) => {
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
    }, [email, password, login, redirectUrl])

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col lg:flex-row">
            <PublicSeo
                title="Login | SuiteGenie"
                description="Sign in to SuiteGenie to manage your social media automation workflows, account settings, AI tools, and publishing dashboards."
                canonicalPath="/login"
                noIndex
            />
            {/* Left: Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
                <div className="w-full max-w-md">
                    {/* Logo and Header */}
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-flex items-center mb-6 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center mr-3 group-hover:shadow-lg transition-shadow duration-200">
                                <span className="text-white font-bold text-lg">S</span>
                            </div>
                            <span className="text-2xl font-bold text-neutral-900">SuiteGenie</span>
                        </Link>
                        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Welcome back</h1>
                        <p className="text-neutral-600">Sign in to your account to continue</p>
                    </div>
                    {/* Login Form */}
                    <Card variant="elevated">
                        <CardContent className="p-8">
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {/* Email Field */}
                                <Input
                                    label="Email address"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    error={validationErrors.email}
                                    leftIcon={<Mail className="w-4 h-4 text-neutral-400" />}
                                    required
                                />

                                {/* Password Field */}
                                <Input
                                    label="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    error={validationErrors.password}
                                    leftIcon={<Lock className="w-4 h-4 text-neutral-400" />}
                                    rightIcon={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-neutral-400 hover:text-neutral-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    }
                                    required
                                />

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 text-primary-600 bg-white border-neutral-300 rounded focus:ring-primary-500 focus:ring-2" 
                                        />
                                        <span className="ml-2 text-sm text-neutral-600">Remember me</span>
                                    </label>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowForgotPassword(true)} 
                                        className="text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                                    >
                                        Forgot password?
                                    </button>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    loading={loading}
                                >
                                    {loading ? 'Signing in...' : 'Sign in'}
                                </Button>

                                {/* Sign Up Link */}
                                <div className="text-center">
                                    <span className="text-sm text-neutral-600">
                                        Don't have an account?{' '}
                                        <Link 
                                            to="/register" 
                                            className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                                        >
                                            Sign up for free
                                        </Link>
                                    </span>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                    <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
                </div>
            </div>
            {/* Features Panel */}
            <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 bg-white/5"></div>
                
                <div className="relative flex flex-col justify-center px-12 py-16 text-white">
                    <div className="max-w-lg">
                        <h2 className="text-4xl font-bold mb-6">
                            Welcome back to SuiteGenie! 🚀
                        </h2>
                        
                        <div className="space-y-6 text-lg">
                            <div className="flex items-start space-x-4">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-xl">🧭</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Choose Your AI Method</h3>
                                    <p className="text-primary-100 text-base">
                                        Select BYOK to use your own API keys, or Platform Keys for our managed service.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-4">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-xl">📝</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Start Creating</h3>
                                    <p className="text-primary-100 text-base">
                                        Use our intuitive tools to generate, schedule, and analyze your content.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-4">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-xl">📊</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Track Progress</h3>
                                    <p className="text-primary-100 text-base">
                                        View real-time stats and insights for all your content in one place.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8 p-6 bg-white/10 rounded-xl border border-white/20">
                            <h4 className="font-semibold mb-2">🎯 Next Steps</h4>
                            <ul className="space-y-1 text-primary-100 text-sm">
                                <li>• Explore your dashboard for quick actions</li>
                                <li>• Choose your preferred AI tools</li>
                                <li>• Start creating amazing content</li>
                            </ul>
                        </div>
                        
                        <p className="mt-6 text-primary-200 italic">
                            Your creative journey continues. Manage, create, and grow, all in one place.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
