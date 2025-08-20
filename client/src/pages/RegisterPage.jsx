import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import OTPModal from '../components/OTPModal'
import { validateRegistrationData, validateOTPRequest, formatValidationErrors } from '../utils/validation'
import toast from 'react-hot-toast'

const RegisterPage = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const { register, sendOTP } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (loading) return
    setValidationErrors({})

    // Validate form data
    const validation = validateRegistrationData({ name, email, password })
    if (!validation.isValid) {
      const formattedErrors = formatValidationErrors(validation.errors)
      setValidationErrors(formattedErrors)
      toast.error('Please fix the validation errors below')
      return
    }

    // Validate OTP request
    const otpValidation = validateOTPRequest({
      email: validation.sanitized.email,
      purpose: 'account-verification',
    })
    if (!otpValidation.isValid) {
      const formattedErrors = formatValidationErrors(otpValidation.errors)
      setValidationErrors(formattedErrors)
      toast.error('Invalid email format')
      return
    }

    setLoading(true)
    try {
      // Send OTP for account verification
      await sendOTP(validation.sanitized.email, 'account-verification')
      setShowOTPModal(true)
      toast.success('OTP sent to your email')
    } catch (error) {
      console.error('Send OTP error:', error)
      toast.error(error?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPSuccess = async (otpData) => {
    if (loading) return
    setLoading(true)
    try {
      const verificationToken = otpData?.verificationToken
      if (!verificationToken) {
        toast.error('Verification token not received. Please try again.')
        return
      }

      // Re-validate before final register (optional but safer)
      const validation = validateRegistrationData({ name, email, password })
      if (!validation.isValid) {
        const formattedErrors = formatValidationErrors(validation.errors)
        setValidationErrors(formattedErrors)
        toast.error('Please fix the validation errors below')
        return
      }

      // Complete registration using verification token
      await register(
        validation.sanitized.name,
        validation.sanitized.email,
        validation.sanitized.password,
        verificationToken
      )

      toast.success('Account created successfully')
      setShowOTPModal(false)
      navigate('/dashboard') // or wherever you want to redirect
    } catch (error) {
      console.error('Register error:', error)
      toast.error(error?.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Signup Form */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white px-8 py-12">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-100 rounded-full p-3 mb-4">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="#2563eb" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/></svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
            <p className="text-gray-600">Gain access to the best modules for content creation and management.</p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className={`appearance-none block w-full px-4 py-3 border ${validationErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {validationErrors.name && <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>}
            </div>
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
                  autoComplete="new-password"
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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Sending OTP...' : 'Create Account'} <span className="ml-2">→</span>
            </button>
            <div className="text-center text-sm text-gray-500">
              Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
            </div>
          </form>
          <OTPModal
            isOpen={showOTPModal}
            onClose={() => setShowOTPModal(false)}
            email={email}
            onSuccess={handleOTPSuccess}
            title="Verify Your Email"
            purpose="account-verification"
          />
        </div>
      </div>

  {/* Right: Features Panel */}
  <div className="hidden md:flex flex-1 flex-col justify-center items-center bg-blue-600 text-white px-8 py-12">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold mb-4">Welcome to Autoverse</h2>
          <p className="mb-6 text-xl font-semibold text-blue-100 bg-blue-700 rounded-lg px-4 py-3 shadow-lg">Gain access to the best modules for content creation and management.</p>
          <ul className="mb-8 space-y-3">
            <li className="flex items-center">
              <span className="mr-2">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="12" fill="#2563eb" />
                  <path d="M17 9l-5 5-3-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Access to all AI modules
            </li>
            <li className="flex items-center">
              <span className="mr-2">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="12" fill="#2563eb" />
                  <path d="M17 9l-5 5-3-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Unified dashboard
            </li>
            <li className="flex items-center">
              <span className="mr-2">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="12" fill="#2563eb" />
                  <path d="M17 9l-5 5-3-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Cross-platform workflow
            </li>
            <li className="flex items-center">
              <span className="mr-2">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="12" fill="#2563eb" />
                  <path d="M17 9l-5 5-3-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Priority support
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
