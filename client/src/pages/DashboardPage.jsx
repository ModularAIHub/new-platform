import { useAuth } from '../contexts/AuthContext'
import { CreditCard, Key, Settings, ExternalLink } from 'lucide-react'

const DashboardPage = () => {
    const { user } = useAuth()

    const modules = [
        {
            name: 'Twitter Genie',
            description: 'AI-powered Twitter content generation',
            url: 'https://twitter.autoverse.com',
            icon: ExternalLink,
            status: 'active'
        },
        {
            name: 'LinkedIn Genie',
            description: 'Professional LinkedIn content creation',
            url: 'https://linkedin.autoverse.com',
            icon: ExternalLink,
            status: 'active'
        },
        {
            name: 'WordPress Genie',
            description: 'WordPress content automation',
            url: 'https://wordpress.autoverse.com',
            icon: ExternalLink,
            status: 'coming-soon'
        }
    ]

    return (
        <div className="space-y-8 p-8">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name}! Here's what's happening with your content.</p>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatsCard title="Total Posts" value="42" subtitle="+12% this week" icon={<CreditCard className="h-6 w-6 text-blue-600" />} />
                <StatsCard title="Engagement Rate" value="8.2%" subtitle="+2.1% this week" icon={<Settings className="h-6 w-6 text-green-600" />} highlight />
                <StatsCard title="Scheduled Posts" value="7" subtitle="Next: 2 hours" icon={<Settings className="h-6 w-6 text-purple-600" />} />
                <StatsCard title="Plan Type" value={user?.planType || 'Free'} subtitle="Upgrade for more" icon={<Key className="h-6 w-6 text-yellow-500" />} />
            </div>
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
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="font-semibold text-lg mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        <RecentActivity label="AI-powered tweet generated" source="Twitter" time="2 hours ago" status="published" />
                        <RecentActivity label="Professional post created" source="LinkedIn" time="4 hours ago" status="scheduled" />
                        <RecentActivity label="Credits purchased: +50" source="System" time="1 day ago" status="completed" />
                        <RecentActivity label="API key updated" source="System" time="2 days ago" status="completed" />
                    </div>
                </div>
            </div>
            {/* AI Tools */}
            <div className="bg-white rounded-xl shadow p-6">
                <h2 className="font-semibold text-lg mb-4">Your AI Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AiToolCard name="Tweet Genie" posts="24" engagement="+12%" status="Active" />
                    <AiToolCard name="LinkedIn Genie" posts="18" engagement="+8%" status="Active" />
                    <AiToolCard name="WordPress Writer" posts="-" engagement="-" status="Coming Soon" />
                    <AiToolCard name="Custom LLM" posts="-" engagement="-" status="Coming Soon" />
                </div>
            </div>
            {/* Why Choose Autoverse */}
            <div className="bg-white rounded-xl shadow p-6 mt-8">
                <h2 className="font-semibold text-lg mb-4">Why Choose Autoverse?</h2>
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
    function AiToolCard({ name, posts, engagement, status }) {
        const statusMap = {
            Active: 'bg-green-100 text-green-700',
            'Coming Soon': 'bg-yellow-100 text-yellow-700',
        }
        return (
            <div className="border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">{name}</div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusMap[status]}`}>{status}</span>
                </div>
                <div className="text-xs text-gray-500 mb-1">{posts !== '-' ? `${posts} posts` : ''}</div>
                <div className="text-xs text-gray-500">{engagement !== '-' ? `${engagement} engagement` : ''}</div>
                {status === 'Active' && <button className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100">Launch</button>}
            </div>
        )
    }
    

export default DashboardPage
