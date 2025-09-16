
import { useAuth } from '../contexts/AuthContext'
import { CreditCard, Key, Settings, ExternalLink, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'

const DashboardPage = () => {
    const { user } = useAuth()
    const [prefLoading, setPrefLoading] = useState(true)
    const [preference, setPreference] = useState(null)
    const [lockUntil, setLockUntil] = useState(null)
    const [locked, setLocked] = useState(false)
    const [lockMessage, setLockMessage] = useState(null)
    const [creditTier, setCreditTier] = useState(0)
    const [showPrefModal, setShowPrefModal] = useState(false)
    const [showByokInfo, setShowByokInfo] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
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
                setCreditTier(res.data.creditTier || (res.data.api_key_preference === 'byok' ? 55 : 25))
                setShowPrefModal(false)
            }
        } catch (e) {
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
                } else {
                    setSubmitting(false)
                    return;
                }
            } else if (pref === 'byok') {
                // Just redirect to API Keys page, do not update preference yet
                setShowPrefModal(false);
                navigate('/api-keys');
            }
        } finally {
            setSubmitting(false)
        }
    }

    const modules = [
        {
            name: 'Twitter Genie',
            description: 'AI-powered Twitter content generation',
            url: 'https://tweet.suitegenie.in',
            icon: ExternalLink,
            status: 'active'
        },
        {
            name: 'LinkedIn Genie',
            description: 'Professional LinkedIn content creation',
            url: '#',
            icon: ExternalLink,
            status: 'active'
        },
        {
            name: 'WordPress Genie',
            description: 'WordPress content automation',
            url: '#',
            icon: ExternalLink,
            status: 'coming-soon'
        }
    ]

    if (prefLoading) return <div className="p-8 text-lg">Loading...</div>

    return (
        <div className="space-y-8 p-8">
            {/* Mode Selection Modal (undismissable until choice) */}
            {showPrefModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative flex flex-col items-center">
                        <h2 className="text-2xl font-bold mb-4 text-blue-900">Choose Your AI Key Mode</h2>
                        <p className="mb-6 text-gray-700 text-center">Select how you want to use AI features. You can use platform keys (25 credits/month) or bring your own (BYOK, 55 credits/month, <b>3-month lock</b>). This cannot be skipped.</p>
                        <div className="flex flex-col md:flex-row gap-4 w-full">
                            <button
                                className={`flex-1 px-6 py-3 rounded-xl font-bold text-lg transition-all duration-150 bg-blue-600 text-white`}
                                disabled={submitting}
                                onClick={() => handleSetPreference('platform')}
                            >
                                Use Platform Keys
                            </button>
                            <button
                                className={`flex-1 px-6 py-3 rounded-xl font-bold text-lg transition-all duration-150 bg-green-600 text-white`}
                                disabled={submitting}
                                onClick={() => handleSetPreference('byok')}
                            >
                                Bring Your Own Key
                            </button>
                        </div>
                        <div className="mt-4 text-xs text-gray-500 text-center">You can change this later, but BYOK is locked for <b>3 months</b> after switching.</div>
                    </div>
                </div>
            )}
            {/* Inline BYOK/Platform Preference Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
                {/* BYOK Info Modal */}
                {showByokInfo && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative">
                            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setShowByokInfo(false)}>&times;</button>
                            <h2 className="text-2xl font-bold mb-2 text-blue-900">How BYOK Works</h2>
                            <ul className="list-disc pl-6 text-gray-700 text-base mb-4">
                                <li><b>BYOK</b> (Bring Your Own Key) lets you use your own API keys for OpenAI, Gemini, or Perplexity.</li>
                                <li>When you switch to BYOK, your account is <b>locked for 30 days</b> (cannot switch back to platform keys).</li>
                                <li>BYOK gives you <b>55 credits/month</b> (vs 25 for platform keys).</li>
                                <li>You must add at least one valid API key for each provider you want to use.</li>
                                <li>After 30 days, you can switch back to platform keys if you wish.</li>
                                <li>Active keys are used for all AI requests for that provider.</li>
                            </ul>
                            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-blue-800 text-sm">
                                <b>Tip:</b> You can manage, add, or remove your keys on the <a href="/api-keys" className="underline text-blue-700">API Keys page</a>. If no key is configured for a provider, you cannot use that provider's AI features.
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">AI Key Preference</h2>
                    <button className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-semibold" onClick={() => setShowByokInfo(true)}>What is BYOK?</button>
                </div>
                <p className="mb-4 text-gray-600">Select how you want to use AI features. You can use platform keys (25 credits/month) or bring your own (BYOK, 55 credits/month, <b>3-month lock</b>).</p>
                <div className="flex flex-col md:flex-row gap-4">
                    <button
                        className={`flex-1 px-6 py-3 rounded-xl font-bold text-lg transition-all duration-150 ${preference === 'platform' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                        disabled={submitting || (preference === 'byok' && locked)}
                        onClick={() => handleSetPreference('platform')}
                    >
                        Use Platform Keys (25 credits/month)
                    </button>
                    <button
                        className={`flex-1 px-6 py-3 rounded-xl font-bold text-lg transition-all duration-150 ${preference === 'byok' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                        disabled={submitting}
                        onClick={() => handleSetPreference('byok')}
                    >
                        Bring Your Own Key (55 credits/month)
                    </button>
                </div>
                <div className="mt-4 text-xs text-gray-500">You can change this later, but BYOK is locked for 30 days after switching.</div>
                <div className="mt-2 text-base font-semibold text-blue-900">Current credit tier: <span className="text-blue-700">{creditTier} credits/month</span></div>
                <div className="mt-2 text-base font-semibold text-blue-900">
                  Current mode: <span className={preference === 'byok' ? 'text-green-700' : 'text-blue-700'}>
                    {preference === 'byok' ? 'BYOK (Your Own Keys)' : 'Platform Keys'}
                  </span>
                </div>
                {locked && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                        <Lock className="h-4 w-4" />
                        {lockMessage}
                    </div>
                )}
                {preference === 'byok' && (
                    <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                        <b>BYOK is active.</b> <span>You're using your own API keys for AI features.</span> <br />
                        <span>Manage your keys on the <a href="/api-keys" className="underline text-green-800">API Keys page</a>.</span>
                    </div>
                )}
            </div>
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name}! Here's what's happening with your content.</p>
            </div>
            {/* Stats Cards
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatsCard title="Total Posts" value="42" subtitle="+12% this week" icon={<CreditCard className="h-6 w-6 text-blue-600" />} />
                <StatsCard title="Engagement Rate" value="8.2%" subtitle="+2.1% this week" icon={<Settings className="h-6 w-6 text-green-600" />} highlight />
                <StatsCard title="Scheduled Posts" value="7" subtitle="Next: 2 hours" icon={<Settings className="h-6 w-6 text-purple-600" />} />
                <StatsCard title="Plan Type" value={user?.planType || 'Free'} subtitle="Upgrade for more" icon={<Key className="h-6 w-6 text-yellow-500" />} />
            </div> */}
            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
                    <div className="space-y-4">
                        <QuickAction label="Buy Credits" description="Top up your credit balance" color="green" />
                        <QuickAction label="Manage API Keys" description="Configure your AI providers" color="blue" />
                        <QuickAction label="View Analytics" description="Track your content performance" color="purple" />
                    </div>
                </div>
                {/* <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="font-semibold text-lg mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        <RecentActivity label="AI-powered tweet generated" source="Twitter" time="2 hours ago" status="published" />
                        <RecentActivity label="Professional post created" source="LinkedIn" time="4 hours ago" status="scheduled" />
                        <RecentActivity label="Credits purchased: +50" source="System" time="1 day ago" status="completed" />
                        <RecentActivity label="API key updated" source="System" time="2 days ago" status="completed" />
                    </div>
                </div> */}
            </div>
            {/* AI Tools */}
            <div className="bg-white rounded-xl shadow p-6">
                <h2 className="font-semibold text-lg mb-4">Your AI Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AiToolCard name="Tweet Genie"  status="Active" />
                    <AiToolCard name="LinkedIn Genie" status="Active" />
                    <AiToolCard name="WordPress Writer" status="Coming Soon" />
                    <AiToolCard name="Custom LLM" status="Coming Soon" />
                </div>
            </div>
            {/* Why Choose Autoverse */}
            <div className="bg-white rounded-xl shadow p-6 mt-8">
                <h2 className="font-semibold text-lg mb-4">Why Choose Suitegenie?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-4">
                        <span className="bg-green-100 p-3 rounded-full"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#22c55e" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/></svg></span>
                        <div>
                            <div className="font-semibold">Multi-LLM Fallback</div>
                            <div className="text-xs text-gray-500">99.9% uptime with intelligent AI routing</div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="bg-blue-100 p-3 rounded-full"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#2563eb" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/></svg></span>
                        <div>
                            <div className="font-semibold">Cost Control</div>
                            <div className="text-xs text-gray-500">Save 2-5x with BYOK or built-in providers</div>
                        </div>
                    </div>
                </div>
            </div>
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
    function StatsCard({ title, value, subtitle, icon, highlight }) {
        return (
            <div className={`bg-white rounded-xl shadow p-6 flex items-center space-x-4 ${highlight ? 'border-2 border-green-200' : ''}`}>
                <div>{icon}</div>
                <div>
                    <div className="text-sm text-gray-500 font-medium">{title}</div>
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-green-600 mt-1">{subtitle}</div>
                </div>
            </div>
        )
    }

    // Quick action card
    function QuickAction({ label, description, color }) {
        const colorMap = {
            green: 'bg-green-100 text-green-700',
            blue: 'bg-blue-100 text-blue-700',
            purple: 'bg-purple-100 text-purple-700',
        }
        return (
            <div className="flex items-center justify-between p-4 rounded-lg border hover:shadow transition cursor-pointer">
                <div className={`rounded-full p-2 ${colorMap[color]}`}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor" /></svg>
                </div>
                <div className="ml-4">
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-xs text-gray-500">{description}</div>
                </div>
                <span className="ml-auto text-gray-400">→</span>
            </div>
        )
    }

    // Recent activity card
    function RecentActivity({ label, source, time, status }) {
        const statusMap = {
            published: 'bg-green-100 text-green-700',
            scheduled: 'bg-blue-100 text-blue-700',
            completed: 'bg-gray-100 text-gray-700',
        }
        return (
            <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-xs text-gray-500">{source} • {time}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusMap[status]}`}>{status}</span>
            </div>
        )
    }

    // AI tool card
    function AiToolCard({ name, status }) {
        const statusMap = {
            Active: 'bg-green-100 text-green-700',
            'Coming Soon': 'bg-yellow-100 text-yellow-700',
        };
        // Set launch URLs for each tool
        let launchUrl = '#';
        if (name === 'Tweet Genie') launchUrl = 'https://tweet.suitegenie.in';
        else if (name === 'LinkedIn Genie') launchUrl = '#';
        else if (name === 'WordPress Writer') launchUrl = '#';
        else if (name === 'Custom LLM') launchUrl = '#';
        return (
            <div className="border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">{name}</div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusMap[status]}`}>{status}</span>
                </div>
                {status === 'Active' && (
                    <a
                        href={launchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 text-center block"
                    >
                        Launch
                    </a>
                )}
            </div>
        );
    }
    

export default DashboardPage
