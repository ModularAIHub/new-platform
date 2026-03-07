
import { useAuth } from '../contexts/AuthContext'
import { CreditCard, Key, Settings, ExternalLink, Lock, TrendingUp, Calendar, BarChart3, Zap, Crown, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'
import { URLS } from '../config/urls'
import {
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from '../components/ui'
import UpgradePrompt from '../components/UpgradePrompt'
import usePlanAccess from '../hooks/usePlanAccess'

const DashboardPage = () => {
    const { user, initialLoad } = useAuth()
    const [prefLoading, setPrefLoading] = useState(true)
    const [preference, setPreference] = useState(null)
    const [lockUntil, setLockUntil] = useState(null)
    const [locked, setLocked] = useState(false)
    const [lockMessage, setLockMessage] = useState(null)
    const [creditTier, setCreditTier] = useState(0)
    const [showPrefModal, setShowPrefModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
    const [upgradeFeature, setUpgradeFeature] = useState(null)
    const hasFetchedPreferenceRef = useRef(false)
    const navigate = useNavigate()
    const { userPlan, hasFeatureAccess, canAddMoreAccounts } = usePlanAccess()

    const handleRestrictedFeature = (featureName, action) => {
        if (hasFeatureAccess(featureName)) {
            action();
        } else {
            setUpgradeFeature(featureName);
            setShowUpgradePrompt(true);
        }
    }

    useEffect(() => {
        if (hasFetchedPreferenceRef.current) return
        hasFetchedPreferenceRef.current = true
        fetchPreference()
    }, [])

    const fetchPreference = async () => {
        setPrefLoading(true)
        try {
            const res = await api.get('/byok/preference')
            // Always treat null/undefined as unset
            if (!res.data.api_key_preference) {
                setPreference(null)
                setCreditTier(0)
                setShowPrefModal(true)
                setLockUntil(null)
                setLocked(false)
                setLockMessage(null)
            } else {
                setPreference(res.data.api_key_preference)
                setLockUntil(res.data.byok_locked_until)
                setLocked(res.data.locked)
                setLockMessage(res.data.lockMessage)
                // Always show actual available credits as the current credit tier
                try {
                    const creditsRes = await api.get('/credits/balance');
                    setCreditTier(creditsRes.data.creditsRemaining || 0);
                } catch (err) {
                    console.error('Error fetching credits:', err?.message || err);
                    setCreditTier(0);
                }
                setShowPrefModal(false)
            }
        } catch (e) {
            const transientErrorCodes = ['ECONNABORTED', 'ERR_NETWORK', 'ENOTFOUND', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT']
            const isTransient =
                transientErrorCodes.includes(e?.code) ||
                !e?.response || // Network/transport failures without HTTP response
                e?.response?.status >= 500
            console.error('Error fetching /byok/preference:', e?.message || e);

            if (isTransient) {
                // Keep prior state, but don't hide required modal for first-time users.
                if (!preference) {
                    setShowPrefModal(true)
                }
                // Allow retry after remount when transient failure occurred.
                hasFetchedPreferenceRef.current = false
            } else {
                setPreference(null)
                setCreditTier(0)
                setShowPrefModal(true)
                setLockUntil(null)
                setLocked(false)
                setLockMessage(null)
            }
        } finally {
            setPrefLoading(false)
        }
    }

    const handleSetPreference = async (pref) => {
        setSubmitting(true)
        try {
            if (pref === 'platform') {
                const response = await api.post('/byok/preference', { preference: pref })
                setPreference(pref)
                setCreditTier(response?.data?.credits ?? 0)
                setShowPrefModal(false)
                window.location.reload() // Refresh to unlock all routes tied to selected mode
            } else if (pref === 'byok') {
                // Just redirect to API Keys page, do not update preference yet
                setShowPrefModal(false)
                navigate('/api-keys?mode=byok')
            }
        } finally {
            setSubmitting(false)
        }
    }


    const modules = [
        {
            name: 'Tweet Genie',
            description: 'X/Twitter content engine',
            url: URLS.TWEET_GENIE,
            status: 'active',
            ctaLabel: 'Open Tweet Genie',
            features: [
                'Single posts + thread chains',
                'Reliable flow automation and timezone support',
                'Cross-post routing and history'
            ]
        },
        {
            name: 'LinkedIn Genie',
            description: 'Professional LinkedIn publishing',
            url: URLS.LINKEDIN_GENIE,
            status: 'active',
            ctaLabel: 'Open LinkedIn Genie',
            features: [
                'Long-form and short-form post modes',
                'Cross-post to X/Threads',
                'Analytics sync and performance tracking'
            ]
        },
        {
            name: 'Meta Genie',
            description: 'Instagram, Threads, and YouTube',
            url: URLS.SOCIAL_GENIE,
            status: 'active',
            ctaLabel: 'Open Meta Genie',
            features: [
                'Threads-first publishing workflow',
                'Cross-post controls for X and LinkedIn',
                'Media upload and automated publishing'
            ]
        },
        {
            name: 'WordPress Genie',
            description: 'WordPress content automation',
            url: URLS.WORDPRESS_WRITER,
            status: 'coming-soon',
            ctaLabel: 'Coming Soon',
            features: [
                'AI blog drafting from strategy briefs',
                'SEO-friendly structure templates',
                'Direct publish pipeline'
            ]
        }
    ]

    if (initialLoad || prefLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-lg text-neutral-600">Loading your dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Mode Selection Modal (undismissable until choice) */}
                {showPrefModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <Card className="w-full max-w-2xl mx-4 animate-scale-in">
                            <CardHeader>
                                <CardTitle className="text-2xl text-primary-900">Choose Your AI Key Mode</CardTitle>
                                <CardDescription className="text-base">
                                    One-time setup: pick how AI requests are billed. You can manage details later in API Keys & Preferences.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => handleSetPreference('platform')}
                                        className="text-left rounded-xl border border-primary-200 bg-primary-50 p-5 hover:border-primary-400 transition-colors disabled:opacity-60"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-lg font-semibold text-primary-900">Use Platform Keys</h3>
                                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-600 text-white">
                                                Recommended Start
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-primary-800">No API key setup required.</p>
                                        <ul className="mt-3 space-y-1 text-sm text-primary-900">
                                            <li>15 credits (Free) / 100 credits (Pro)</li>
                                            <li>Fastest way to begin</li>
                                            <li>Mode gets locked for 90 days after selection</li>
                                        </ul>
                                    </button>

                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => handleSetPreference('byok')}
                                        className="text-left rounded-xl border border-success-200 bg-success-50 p-5 hover:border-success-400 transition-colors disabled:opacity-60"
                                    >
                                        <h3 className="text-lg font-semibold text-success-900">Bring Your Own Key (BYOK)</h3>
                                        <p className="mt-2 text-sm text-success-800">Use your OpenAI/Gemini/Perplexity keys.</p>
                                        <ul className="mt-3 space-y-1 text-sm text-success-900">
                                            <li>50 credits (Free) / 180 credits (Pro)</li>
                                            <li>More control over provider + spend</li>
                                            <li>90-day lock starts after your first key is added</li>
                                        </ul>
                                    </button>
                                </div>
                                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                                    Your API keys stay in your account scope. SuiteGenie does not expose raw keys in UI responses after save.
                                </div>
                            </CardContent>
                            <CardFooter>
                                <p className="text-xs text-neutral-500 w-full">
                                    This step is required once so we can apply the right credit tier and usage rules.
                                </p>
                            </CardFooter>
                        </Card>
                    </div>
                )}
                {/* Welcome Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                        Welcome back{user?.name ? `, ${user.name}` : ''}!
                    </h1>
                    <p className="text-lg text-neutral-600">
                        Here's what's happening with your AI-powered content creation.
                    </p>
                </div>

                {/* Product Modules */}
                <Card variant="elevated" className="mb-8 animate-fade-in animate-stagger-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary-600" />
                            Product Modules
                        </CardTitle>
                        <CardDescription>
                            Jump directly into each module with clear feature coverage and launch CTAs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {modules.map((module) => (
                                <ProductModuleCard key={module.name} module={module} />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* AI Key Preference Status */}
                <Card variant="default" className="mb-8 animate-fade-in animate-stagger-2">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="w-5 h-5 text-primary-600" />
                                    AI Keys & Preferences
                                </CardTitle>
                                <CardDescription>
                                    Preference controls are now managed in API Keys & Preferences.
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/api-keys')}
                            >
                                Manage API Keys & Preferences
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between text-sm mb-3">
                            <span className="text-neutral-600">Current mode</span>
                            <span className={`font-semibold ${preference === 'byok' ? 'text-success-700' : 'text-primary-700'}`}>
                                {preference === 'byok' ? 'BYOK (Your Own Keys)' : 'Platform Keys'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-600">Credit tier</span>
                            <span className="font-semibold text-neutral-900">{creditTier} credits/month</span>
                        </div>

                        {locked && (
                            <div className="flex items-center gap-2 mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg text-warning-800 text-sm">
                                <Lock className="h-4 w-4 flex-shrink-0" />
                                <span>{lockMessage}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
                {/* Quick Actions & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <Card variant="default" className="animate-fade-in animate-stagger-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-primary-600" />
                                Quick Actions
                            </CardTitle>
                            <CardDescription>
                                Get started with these common tasks
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <QuickAction
                                    label="Buy Credits"
                                    description="Top up your credit balance"
                                    icon={<CreditCard className="w-5 h-5" />}
                                    color="success"
                                    onClick={() => navigate('/credits')}
                                />
                                <QuickAction
                                    label="API Keys & Preferences"
                                    description="Manage providers and preference mode"
                                    icon={<Key className="w-5 h-5" />}
                                    color="primary"
                                    onClick={() => navigate('/api-keys')}
                                />
                                {userPlan?.type === 'pro' && (
                                    <QuickAction
                                        label="Team Collaboration"
                                        description="Manage your team members"
                                        icon={<Users className="w-5 h-5" />}
                                        color="primary"
                                        onClick={() => navigate('/team')}
                                    />
                                )}
                                <QuickAction
                                    label="Bulk Automation"
                                    description={hasFeatureAccess('bulk_scheduling') ? "Automate multiple posts at once" : "Pro feature - Automate in bulk"}
                                    icon={<Calendar className="w-5 h-5" />}
                                    color={hasFeatureAccess('bulk_scheduling') ? "primary" : "secondary"}
                                    onClick={() => handleRestrictedFeature('bulk_scheduling', () => {
                                        // TODO: Navigate to bulk automation page
                                        alert('Bulk automation feature coming soon!');
                                    })}
                                    isPro={!hasFeatureAccess('bulk_scheduling')}
                                />
                                <QuickAction
                                    label="Advanced Analytics"
                                    description={hasFeatureAccess('advanced_analytics') ? "Detailed performance insights" : "Pro feature - Deep analytics"}
                                    icon={<BarChart3 className="w-5 h-5" />}
                                    color={hasFeatureAccess('advanced_analytics') ? "success" : "secondary"}
                                    onClick={() => handleRestrictedFeature('advanced_analytics', () => {
                                        // TODO: Navigate to analytics page
                                        alert('Advanced analytics feature coming soon!');
                                    })}
                                    isPro={!hasFeatureAccess('advanced_analytics')}
                                />
                                <QuickAction
                                    label="View Settings"
                                    description="Customize your experience"
                                    icon={<Settings className="w-5 h-5" />}
                                    color="secondary"
                                    onClick={() => navigate('/settings')}
                                />
                                {userPlan?.type === 'free' && (
                                    <QuickAction
                                        label="Upgrade to Pro Plan"
                                        description="Complete secure checkout for ₹399/month (~$4.80)"
                                        icon={<Crown className="w-5 h-5" />}
                                        color="warning"
                                        onClick={() => navigate('/plans?intent=pro')}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="default" className="animate-fade-in animate-stagger-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary-600" />
                                Recent Activity
                            </CardTitle>
                            <CardDescription>
                                Your latest actions and updates
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* TODO: Replace with real activity data from backend */}
                                {Array.isArray(user?.activity) && user.activity.length > 0 ? (
                                    user.activity.map((item, idx) => (
                                        <RecentActivity
                                            key={idx}
                                            label={item.label}
                                            source={item.source}
                                            time={item.time}
                                            status={item.status}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-neutral-500">
                                        <Calendar className="h-10 w-10 mx-auto mb-2 text-primary-200" />
                                        <div className="font-semibold mb-1">No recent activity yet</div>
                                        <div className="text-sm">Your latest actions and updates will appear here.</div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {/* Why Choose SuiteGenie */}
                <Card variant="elevated" className="animate-fade-in animate-stagger-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary-600" />
                            Why Choose SuiteGenie?
                        </CardTitle>
                        <CardDescription>
                            Discover the advantages of our AI-powered content creation platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-neutral-900 mb-1">Multi-LLM Fallback</h3>
                                    <p className="text-sm text-neutral-600">99.9% uptime with intelligent AI routing across multiple providers</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-neutral-900 mb-1">Cost Control</h3>
                                    <p className="text-sm text-neutral-600">Save 2-5x with BYOK or use our optimized built-in providers</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Upgrade Prompt Modal */}
            <UpgradePrompt
                isOpen={showUpgradePrompt}
                onClose={() => setShowUpgradePrompt(false)}
                feature={upgradeFeature}
                title="Upgrade to Pro Plan"
                description="Unlock powerful features to supercharge your content creation"
            />
        </div>
    )
}
function ProductModuleCard({ module }) {
    const isActive = module.status === 'active'

    return (
        <Card variant="interactive" className="h-full border border-neutral-200">
            <CardContent className="p-5 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-lg font-semibold text-neutral-900">{module.name}</h3>
                        <p className="text-sm text-neutral-600">{module.description}</p>
                    </div>
                    <span className={isActive ? 'badge-success' : 'badge-warning'}>
                        {isActive ? 'Active' : 'Coming Soon'}
                    </span>
                </div>

                <ul className="space-y-2 mb-5">
                    {module.features.map((feature) => (
                        <li key={feature} className="text-sm text-neutral-700 flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary-500"></span>
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>

                <div className="mt-auto">
                    <Button
                        variant={isActive ? 'primary' : 'outline'}
                        size="sm"
                        fullWidth
                        disabled={!isActive}
                        icon={<ExternalLink className="w-4 h-4" />}
                        iconPosition="right"
                        onClick={() => isActive && window.open(module.url, '_blank')}
                    >
                        {module.ctaLabel}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

// Quick action card
function QuickAction({ label, description, icon, color, onClick, isPro }) {
    const colorMap = {
        success: 'bg-success-100 text-success-700',
        primary: 'bg-primary-100 text-primary-700',
        secondary: 'bg-secondary-100 text-secondary-700',
    }
    return (
        <button
            onClick={onClick}
            className={`flex items-center w-full p-4 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all duration-200 text-left group relative ${isPro ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''}`}
        >
            <div className={`rounded-lg p-2.5 ${colorMap[color]} group-hover:scale-105 transition-transform duration-200`}>
                {icon}
            </div>
            <div className="ml-4 flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-neutral-900">{label}</span>
                    {isPro && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            <Crown className="w-3 h-3 mr-1" />
                            Pro
                        </span>
                    )}
                </div>
                <div className="text-xs text-neutral-500">{description}</div>
            </div>
            <svg className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </button>
    )
}

// Recent activity card
function RecentActivity({ label, source, time, status }) {
    const statusMap = {
        published: 'badge-success',
        scheduled: 'badge-info',
        completed: 'badge-neutral',
    }
    return (
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors duration-200">
            <div className="flex-1">
                <div className="font-medium text-sm text-neutral-900 mb-1">{label}</div>
                <div className="text-xs text-neutral-500">{source} - {time}</div>
            </div>
            <span className={`${statusMap[status]} ml-3 flex-shrink-0`}>
                {status}
            </span>
        </div>
    )
}


export default DashboardPage
