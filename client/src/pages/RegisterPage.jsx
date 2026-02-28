import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OTPModal from '../components/OTPModal';
import { validateRegistrationData, validateOTPRequest, formatValidationErrors } from '../utils/validation';
import toast from 'react-hot-toast';
import { Button, Input, Card, CardContent } from '../components/ui';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import PublicSeo from '../components/PublicSeo';

const RegisterPage = () => {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [showOTPModal, setShowOTPModal] = useState(false);
	const [validationErrors, setValidationErrors] = useState({});
	const { register, sendOTP } = useAuth();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const planType = searchParams.get('plan');

	const handleSubmit = useCallback(async (e) => {
		e.preventDefault();
		if (loading) return;
		setValidationErrors({});
		const validation = validateRegistrationData({ name, email, password });
		if (!validation.isValid) {
			const formattedErrors = formatValidationErrors(validation.errors);
			setValidationErrors(formattedErrors);
			toast.error('Please fix the validation errors below');
			return;
		}
		const otpValidation = validateOTPRequest({
			email: validation.sanitized.email,
			purpose: 'account-verification',
		});
		if (!otpValidation.isValid) {
			const formattedErrors = formatValidationErrors(otpValidation.errors);
			setValidationErrors(formattedErrors);
			toast.error('Invalid email format');
			return;
		}
		setLoading(true);
		try {
			await sendOTP(validation.sanitized.email, 'account-verification');
			setShowOTPModal(true);

		} catch (error) {
			console.error('Send OTP error:', error);
		} finally {
			setLoading(false);
		}
	}, [email, name, password, sendOTP, loading]);

	const handleOTPSuccess = async (otpData) => {
		if (loading) return;
		setLoading(true);
		try {
			const verificationToken = otpData?.verificationToken;
			if (!verificationToken) {
				throw new Error('Verification token not received. Please try again.');
			}
			const validation = validateRegistrationData({ name, email, password });
			if (!validation.isValid) {
				const formattedErrors = formatValidationErrors(validation.errors);
				setValidationErrors(formattedErrors);
				throw new Error('Please fix the validation errors below');
			}
			const registerResult = await register(
				validation.sanitized.name,
				validation.sanitized.email,
				validation.sanitized.password,
				verificationToken
			);
			
			setShowOTPModal(false);
			
			// Check if registration was successful
			if (!registerResult?.user) {
				throw new Error('Registration failed. Please try again.');
			}
			// If user selected Pro during signup, send them to paid checkout.
			if (planType === 'pro') {
				toast.success('Account created. Complete payment to activate Pro.');
				navigate('/plans?intent=pro');
				return registerResult;
			}

			toast.success('Account created! Welcome to SuiteGenie!');
			navigate('/dashboard');
			return registerResult;
		} catch (error) {
			console.error('Register error:', error);
			throw error;
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-neutral-50 flex flex-col lg:flex-row">
			<PublicSeo
				title="Create Your SuiteGenie Account | Sign Up"
				description="Create your SuiteGenie account to start generating, scheduling, and managing AI-powered social media content across X, LinkedIn, and more."
				canonicalPath="/register"
				noIndex
			/>
			{/* Left: Registration Form */}
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
						<h1 className="text-3xl font-bold text-neutral-900 mb-2">Create your account</h1>
						<p className="text-neutral-600">Join thousands of creators using AI-powered tools</p>
					</div>
					{/* Registration Form */}
					<Card variant="elevated">
						<CardContent className="p-8">
							<form className="space-y-6" onSubmit={handleSubmit}>
								{/* Name Field */}
								<Input
									label="Full name"
									type="text"
									placeholder="Enter your full name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									error={validationErrors.name}
									leftIcon={<User className="w-4 h-4 text-neutral-400" />}
									required
								/>

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
									placeholder="Create a strong password"
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
									helperText="Must be at least 8 characters with letters and numbers"
									required
								/>

								{/* Terms and Conditions */}
								<div className="flex items-start space-x-3">
									<input 
										type="checkbox" 
										required
										className="w-4 h-4 text-primary-600 bg-white border-neutral-300 rounded focus:ring-primary-500 focus:ring-2 mt-1" 
									/>
									<span className="text-sm text-neutral-600">
										I agree to the{' '}
										<Link to="/terms" className="text-primary-600 hover:text-primary-700 underline">
											Terms of Service
										</Link>{' '}
										and{' '}
										<Link to="/privacy" className="text-primary-600 hover:text-primary-700 underline">
											Privacy Policy
										</Link>
									</span>
								</div>

								{/* Submit Button */}
								<Button
									type="submit"
									variant="primary"
									size="lg"
									fullWidth
									loading={loading}
								>
									{loading ? 'Creating Account...' : 'Create Account'}
								</Button>

								{/* Sign In Link */}
								<div className="text-center">
									<span className="text-sm text-neutral-600">
										Already have an account?{' '}
										<Link 
											to="/login" 
											className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
										>
											Sign in
										</Link>
									</span>
								</div>
					</form>
				</CardContent>
			</Card>
			
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
			
			{/* Features Panel */}
			<div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
				{/* Background Pattern */}
				<div className="absolute inset-0 opacity-10">
					<div className="absolute inset-0" style={{
						backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px)`,
						backgroundSize: '60px 60px'
					}}></div>
				</div>
				
				<div className="relative flex flex-col justify-center px-12 py-16 text-white">
					<div className="max-w-lg">
						<h2 className="text-4xl font-bold mb-6 animate-fade-in">
							What Awaits You? 🌟
						</h2>
						
						<div className="space-y-6 text-lg animate-fade-in animate-stagger-1">
							<div className="flex items-start space-x-4">
								<div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
									<span className="text-xl">🚀</span>
								</div>
								<div>
									<h3 className="font-semibold mb-1">Advanced AI Modules</h3>
									<p className="text-primary-100 text-base">
										Access cutting-edge AI tools for content creation, scheduling, and analytics.
									</p>
								</div>
							</div>
							
							<div className="flex items-start space-x-4">
								<div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
									<span className="text-xl">🤖</span>
								</div>
								<div>
									<h3 className="font-semibold mb-1">Smart Automation</h3>
									<p className="text-primary-100 text-base">
										Automated scheduling, cross-platform publishing, and intelligent analytics.
									</p>
								</div>
							</div>
							
							<div className="flex items-start space-x-4">
								<div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
									<span className="text-xl">📈</span>
								</div>
								<div>
									<h3 className="font-semibold mb-1">Flexible AI Access</h3>
									<p className="text-primary-100 text-base">
										Choose BYOK (your own keys) or use our platform keys - you're in control.
									</p>
								</div>
							</div>
							
							<div className="flex items-start space-x-4">
								<div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
									<span className="text-xl">🛡️</span>
								</div>
								<div>
									<h3 className="font-semibold mb-1">Enterprise Security</h3>
									<p className="text-primary-100 text-base">
										Bank-level security with privacy-first design and data protection.
									</p>
								</div>
							</div>
						</div>
						
						<div className="mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 animate-fade-in animate-stagger-2">
							<h4 className="font-semibold mb-2">🎯 Ready to Level Up?</h4>
							<p className="text-primary-100 text-sm">
								Join thousands of creators who've transformed their content workflow with SuiteGenie.
							</p>
						</div>
						
						<p className="mt-6 text-primary-200 italic animate-fade-in animate-stagger-3">
							Your journey to effortless content creation starts here.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RegisterPage;

