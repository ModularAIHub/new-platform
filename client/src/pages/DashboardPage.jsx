
import { useAuth } from '../contexts/AuthContext'
import { CreditCard, Key, Settings, ExternalLink, Lock, TrendingUp, Calendar, BarChart3, Zap, Crown, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'
import { URLS, TOOLS, getToolUrl } from '../config/urls'
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
    const { user, loading: authLoading, initialLoad } = useAuth()
    const [prefLoading, setPrefLoading] = useState(true)
    const [preference, setPreference] = useState(null)
    const [lockUntil, setLockUntil] = useState(null)
    const [locked, setLocked] = useState(false)
    const [lockMessage, setLockMessage] = useState(null)
    const [creditTier, setCreditTier] = useState(0)
    const [showPrefModal, setShowPrefModal] = useState(false)
    const [showByokInfo, setShowByokInfo] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [dashboardStats, setDashboardStats] = useState({
        creditsAvailable: 0,
        activeTools: 0,
        contentGenerated: 0,
        planType: 'free'
    })
    const [statsLoading, setStatsLoading] = useState(true)
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
    const [upgradeFeature, setUpgradeFeature] = useState(null)
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

    // Test function to upgrade to Pro plan
    const handleTestUpgrade = async () => {
        if (userPlan?.type === 'pro') {
            alert('You are already on Pro plan!');
            return;
        }
        
        try {
            setSubmitting(true);
            const response = await api.post('/plans/upgrade', { planType: 'pro' });
            if (response.data) {
                alert(`Successfully upgraded to ${response.data.newPlan.name} plan! You now have ${response.data.newPlan.creditsRemaining} credits.`);
                // Refresh the page to show updated plan
                window.location.reload();
            }
        } catch (error) {
            console.error('Upgrade error:', error);
            alert('Upgrade failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setSubmitting(false);
        }
    }

    useEffect(() => {
        fetchPreference()
    }, [])

    // Update dashboard stats when creditTier changes
    useEffect(() => {
        if (!prefLoading) {
            fetchDashboardStats()
        }
    }, [creditTier, prefLoading])

    const fetchDashboardStats = async () => {
        setStatsLoading(true);
        try {
            // Fetch actual credits from backend
            const res = await api.get('/credits/balance');
            const creditsAvailable = res.data.creditsRemaining || 0;
            setDashboardStats({
                creditsAvailable,
                activeTools: 2, // Twitter Genie and LinkedIn Genie are active
                contentGenerated: 0, // Removed from UI, placeholder
                planType: user?.planType || 'free'
            });
        } catch (e) {
            setDashboardStats(prev => ({ ...prev, creditsAvailable: 0 }));
        } finally {
            setStatsLoading(false);
        }
    }

    const fetchPreference = async () => {
        setPrefLoading(true)
        try {
            const res = await api.get('/byok/preference')
            console.log('[DEBUG] /byok/preference response:', res.data);
            // Always treat null/undefined as unset
            if (!res.data.api_key_preference) {
                console.warn('[DEBUG] No api_key_preference found for user:', res.data);
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
                    console.log('[DEBUG] /credits/balance response:', creditsRes.data);
                    setCreditTier(creditsRes.data.creditsRemaining || 0);
                } catch (err) {
                    console.error('[DEBUG] Error fetching credits:', err);
                    setCreditTier(0);
                }
                setShowPrefModal(false)
            }
        } catch (e) {
            console.error('[DEBUG] Error fetching /byok/preference:', e);
            setPreference(null)
            setCreditTier(0)
            setShowPrefModal(true)
            setLockUntil(null)
            setLocked(false)
            setLockMessage(null)
        } finally {
            setPrefLoading(false)
        }
    }

    const handleSetPreference = async (pref) => {
        setSubmitting(true)
        try {
            if (pref === 'platform') {
                if (window.confirm('Are you sure you want to use Platform Keys? This choice will be locked for 3 months.')) {
                    await api.post('/byok/preference', { preference: pref })
                    setPreference(pref)
                    setCreditTier(25)
                    setShowPrefModal(false)
                    window.location.reload(); // Force reload to reflect mode and unlock navigation
                } else {
                    setSubmitting(false)
                    return;
                }
            } else if (pref === 'byok') {
                // Just redirect to API Keys page, do not update preference yet
                setShowPrefModal(false);
                navigate('/api-keys?mode=byok');
            }
        } finally {
            setSubmitting(false)
        }
    }


    const modules = [
        {
            name: 'Twitter Genie',
            description: 'AI-powered Twitter content generation',
            url: URLS.TWEET_GENIE,
            icon: ExternalLink,
            status: 'active'
        },
        {
            name: 'LinkedIn Genie',
            description: 'Professional LinkedIn content creation',
            url: URLS.LINKEDIN_GENIE,
            icon: ExternalLink,
            status: 'active'
        },
        {
            name: 'WordPress Genie',
            description: 'WordPress content automation',
            url: URLS.WORDPRESS_WRITER,
            icon: ExternalLink,
            status: 'coming-soon'
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
                        <Card className="max-w-md w-full mx-4 animate-scale-in">
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl text-primary-900">Choose Your AI Key Mode</CardTitle>
                                <CardDescription className="text-base">
                                    Select how you want to use AI features. You can use platform keys (50 Free / 150 Pro) or bring your own (BYOK with 2x credits: 100 Free / 300 Pro, <strong>3-month lock</strong>). This cannot be skipped.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-900 text-sm text-left">
                                    <strong>Note:</strong> Image generation is currently more reliable with BYOK (OpenAI or Gemini). Using platform keys may result in rate limits or errors for image generation. We’re working to improve this soon!
                                </div>
                                <div className="space-y-3">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        fullWidth
                                        loading={submitting}
                                        onClick={() => handleSetPreference('platform')}
                                    >
                                        Use Platform Keys
                                    </Button>
                                    <Button
                                        variant="success"
                                        size="lg"
                                        fullWidth
                                        loading={submitting}
                                        onClick={() => handleSetPreference('byok')}
                                    >
                                        Bring Your Own Key
                                    </Button>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <p className="text-xs text-neutral-500 text-center w-full">
                                    You can change this later, but BYOK is locked for <strong>3 months</strong> after switching.
                                </p>
                            </CardFooter>
                        </Card>
                    </div>
                )}
                {/* BYOK Info Modal */}
                {showByokInfo && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <Card className="max-w-lg w-full mx-4 animate-scale-in">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-2xl text-primary-900">How BYOK Works</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowByokInfo(false)}
                                        className="text-neutral-400 hover:text-neutral-700"
                                    >
                                        ×
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-4">
                                    <li><strong>BYOK</strong> (Bring Your Own Key) lets you use your own API keys for OpenAI, Gemini, or Perplexity.</li>
                                    <li>When you switch to BYOK, your account is <strong>locked for 30 days</strong> (cannot switch back to platform keys).</li>
                                    <li>BYOK gives you <strong>2x credits</strong> (Free: 100, Pro: 300 vs Platform's Free: 50, Pro: 150).</li>
                                    <li>You must add at least one valid API key for each provider you want to use.</li>
                                    <li>After 30 days, you can switch back to platform keys if you wish.</li>
                                    <li>Active keys are used for all AI requests for that provider.</li>
                                </ul>
                                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-primary-800 text-sm">
                                    <strong>Tip:</strong> You can manage, add, or remove your keys on the <a href="/api-keys" className="underline text-primary-700 hover:text-primary-900">API Keys page</a>. If no key is configured for a provider, you cannot use that provider's AI features.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* AI Key Preference Section */}
                <Card variant="elevated" className="mb-8 animate-fade-in">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="w-5 h-5 text-primary-600" />
                                    AI Key Preference
                                </CardTitle>
                                <CardDescription>
                                    Select how you want to use AI features. You can use platform keys (50 Free / 150 Pro) or bring your own (BYOK with 2x: 100 Free / 300 Pro, <strong>3-month lock</strong>).
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowByokInfo(true)}
                            >
                                What is BYOK?
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <Button
                                variant={preference === 'platform' ? 'primary' : 'outline'}
                                size="lg"
                                fullWidth
                                loading={submitting}
                                disabled={locked}
                                onClick={() => handleSetPreference('platform')}
                            >
                                Use Platform Keys (50 Free / 150 Pro)
                            </Button>
                            <Button
                                variant={preference === 'byok' ? 'success' : 'outline'}
                                size="lg"
                                fullWidth
                                loading={submitting}
                                disabled={locked}
                                onClick={() => handleSetPreference('byok')}
                            >
                                Bring Your Own Key (100 Free / 300 Pro)
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-neutral-600">Current mode:</span>
                                <span className={`font-semibold ${preference === 'byok' ? 'text-success-700' : 'text-primary-700'}`}>
                                    {preference === 'byok' ? 'BYOK (Your Own Keys)' : 'Platform Keys'}
                                </span>
                            </div>
                        </div>

                        {locked && (
                            <div className="flex items-center gap-2 mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg text-warning-800 text-sm">
                                <Lock className="h-4 w-4 flex-shrink-0" />
                                <span>{lockMessage}</span>
                            </div>
                        )}

                        {preference === 'byok' && (
                            <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg text-success-800 text-sm">
                                <strong>BYOK is active.</strong> You're using your own API keys for AI features.<br />
                                <span>Manage your keys on the <a href="/api-keys" className="underline text-success-700 hover:text-success-900">API Keys page</a>.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
                {/* Welcome Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                        Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
                    </h1>
                    <p className="text-lg text-neutral-600">
                        Here's what's happening with your AI-powered content creation.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                </div>
                {/* Stats Cards
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatsCard title="Total Posts" value="42" subtitle="+12% this week" icon={<CreditCard className="h-6 w-6 text-blue-600" />} />
                <StatsCard title="Engagement Rate" value="8.2%" subtitle="+2.1% this week" icon={<Settings className="h-6 w-6 text-green-600" />} highlight />
                <StatsCard title="Scheduled Posts" value="7" subtitle="Next: 2 hours" icon={<Settings className="h-6 w-6 text-purple-600" />} />
                <StatsCard 
                    title="Plan Type" 
                    value={userPlan?.name || 'Free'} 
                    subtitle={userPlan?.type === 'free' ? "Upgrade to Pro" : "Active"} 
                    icon={userPlan?.type === 'free' ? <Crown className="h-6 w-6 text-yellow-500" /> : <Key className="h-6 w-6 text-green-500" />}
                    onClick={userPlan?.type === 'free' ? () => {
                        setUpgradeFeature('Pro Plan Access');
                        setShowUpgradePrompt(true);
                    } : null}
                    isClickable={userPlan?.type === 'free'}
                />
            </div> */}
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
                                    label="Manage API Keys"
                                    description="Configure your AI providers"
                                    icon={<Key className="w-5 h-5" />}
                                    color="primary"
                                    onClick={() => navigate('/api-keys')}
                                />
                                {userPlan?.type === 'pro' && (
                                    <QuickAction
                                        label="👥 Team Collaboration"
                                        description="Manage your team members"
                                        icon={<Users className="w-5 h-5" />}
                                        color="primary"
                                        onClick={() => navigate('/team')}
                                    />
                                )}
                                <QuickAction
                                    label="Bulk Scheduling"
                                    description={hasFeatureAccess('bulk_scheduling') ? "Schedule multiple posts at once" : "Pro feature - Schedule in bulk"}
                                    icon={<Calendar className="w-5 h-5" />}
                                    color={hasFeatureAccess('bulk_scheduling') ? "primary" : "secondary"}
                                    onClick={() => handleRestrictedFeature('bulk_scheduling', () => {
                                        // TODO: Navigate to bulk scheduling page
                                        alert('Bulk scheduling feature coming soon!');
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
                                        label="🚀 Test Upgrade to Pro"
                                        description="Instantly upgrade to Pro plan (for testing)"
                                        icon={<Crown className="w-5 h-5" />}
                                        color="warning"
                                        onClick={handleTestUpgrade}
                                        disabled={submitting}
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
                                <RecentActivity
                                    label="AI-powered tweet generated"
                                    source="Twitter Genie"
                                    time="2 hours ago"
                                    status="published"
                                />
                                <RecentActivity
                                    label="Professional post created"
                                    source="LinkedIn Genie"
                                    time="4 hours ago"
                                    status="scheduled"
                                />
                                <RecentActivity
                                    label="Credits purchased: +50"
                                    source="System"
                                    time="1 day ago"
                                    status="completed"
                                />
                                <RecentActivity
                                    label="API key updated"
                                    source="System"
                                    time="2 days ago"
                                    status="completed"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {/* AI Tools */}
                <Card variant="default" className="mb-8 animate-fade-in animate-stagger-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary-600" />
                            Your AI Tools
                        </CardTitle>
                        <CardDescription>
                            Access your AI-powered content creation tools
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <AiToolCard name="Tweet Genie" status="Active" />
                            <AiToolCard name="LinkedIn Genie" status="Active" />
                            <AiToolCard name="WordPress Writer" status="Coming Soon" />
                            <AiToolCard name="Custom LLM" status="Coming Soon" />
                        </div>
                    </CardContent>
                </Card>
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
// Sidebar item component
function SidebarItem({ label, icon, active, badge }) {
    return (
        <div className={`flex items-center px-3 py-2 rounded-lg cursor-pointer ${active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}>
            {icon}
            <span className="ml-3">{label}</span>
            {badge && <span className="ml-2 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">{badge}</span>}
        </div>
    )
}

// Stats card component
function StatsCard({ title, value, subtitle, icon, trend, highlight, onClick, isClickable }) {
    const CardComponent = isClickable ? 'button' : 'div';
    
    return (
        <Card
            variant={highlight ? 'elevated' : 'default'}
            className={`hover-lift animate-fade-in ${highlight ? 'ring-2 ring-success-200' : ''} ${isClickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
            onClick={onClick}
        >
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-600 mb-1">{title}</p>
                        <p className="text-3xl font-bold text-neutral-900 mb-1">{value}</p>
                        <p className={`text-xs ${isClickable ? 'text-blue-600 font-medium' : 'text-neutral-500'}`}>{subtitle}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                        {icon}
                    </div>
                </div>
                {trend && (
                    <div className="mt-3 pt-3 border-t border-neutral-100">
                        <p className="text-xs text-success-600 font-medium">{trend}</p>
                    </div>
                )}
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
                <div className="text-xs text-neutral-500">{source} • {time}</div>
            </div>
            <span className={`${statusMap[status]} ml-3 flex-shrink-0`}>
                {status}
            </span>
        </div>
    )
}

// AI tool card
function AiToolCard({ name, status }) {
    const statusMap = {
        Active: 'badge-success',
        'Coming Soon': 'badge-warning',
    };

    // Set launch URLs for each tool using centralized configuration
    const launchUrl = getToolUrl(name);

    return (
        <Card variant="interactive" className="h-full">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-neutral-900">{name}</h3>
                    <span className={statusMap[status]}>{status}</span>
                </div>

                <div className="flex items-center justify-center h-16 mb-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
                    <Zap className="w-8 h-8 text-primary-600" />
                </div>

                {status === 'Active' ? (
                    <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        icon={<ExternalLink className="w-4 h-4" />}
                        iconPosition="right"
                        onClick={() => window.open(launchUrl, '_blank')}
                        title={name === 'Tweet Genie' ? 'Open Tweet Genie in a new tab' : 'Launch this tool'}
                    >
                        {name === 'Tweet Genie' ? 'Open Tweet Genie' : 'Launch Tool'}
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        disabled
                    >
                        Coming Soon
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}


export default DashboardPage
