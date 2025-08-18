import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowRight, Sparkles, Zap, Shield } from 'lucide-react'

const LandingPage = () => {
    const { isAuthenticated } = useAuth()

    return (
        <div className="bg-white">
            {/* Header */}
            <header className="absolute inset-x-0 top-0 z-50">
                <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
                    <div className="flex lg:flex-1">
                        <Link to="/" className="-m-1.5 p-1.5">
                            <span className="text-xl font-bold text-gray-900">Autoverse Hub</span>
                        </Link>
                    </div>
                    <div className="flex gap-x-12">
                        <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900">
                            Log in
                        </Link>
                        <Link to="/register" className="text-sm font-semibold leading-6 text-gray-900">
                            Sign up
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero section */}
            <div className="relative isolate pt-14">
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
                </div>

                <div className="py-24 sm:py-32 lg:pb-40">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                                Central Hub for Your{' '}
                                <span className="text-primary-600">AI Tools</span>
                            </h1>
                            <p className="mt-6 text-lg leading-8 text-gray-600">
                                Manage your AI tools, credits, and subscriptions in one place. Connect Twitter Genie, LinkedIn Genie, and more with seamless authentication and credit management.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                {isAuthenticated ? (
                                    <Link
                                        to="/dashboard"
                                        className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                                    >
                                        Go to Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            to="/register"
                                            className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                                        >
                                            Get started
                                        </Link>
                                        <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900">
                                            Learn more <ArrowRight className="inline h-4 w-4 ml-1" />
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features section */}
            <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-primary-600">Everything you need</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Powerful features for AI tool management
                    </p>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        From credit management to API key storage, we provide everything you need to manage your AI tools efficiently.
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
                        <div className="relative pl-9">
                            <dt className="inline font-semibold text-gray-900">
                                <Sparkles className="absolute left-1 top-1 h-5 w-5 text-primary-600" />
                                Credit Management
                            </dt>
                            <dd className="inline"> — Real-time credit tracking with Redis-powered performance and automatic sync to PostgreSQL for reliability.</dd>
                        </div>
                        <div className="relative pl-9">
                            <dt className="inline font-semibold text-gray-900">
                                <Zap className="absolute left-1 top-1 h-5 w-5 text-primary-600" />
                                Fast Authentication
                            </dt>
                            <dd className="inline"> — JWT-based authentication with secure httpOnly cookies for cross-subdomain support.</dd>
                        </div>
                        <div className="relative pl-9">
                            <dt className="inline font-semibold text-gray-900">
                                <Shield className="absolute left-1 top-1 h-5 w-5 text-primary-600" />
                                Secure API Keys
                            </dt>
                            <dd className="inline"> — Encrypted storage for your AI provider API keys with easy management interface.</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    )
}

export default LandingPage
