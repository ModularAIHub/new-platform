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
        <div className="space-y-6">
            {/* Welcome section */}
            <div className="bg-white shadow rounded-lg p-6">
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
                <p className="text-gray-600 mt-2">Manage your AI tools and credits from your central hub.</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CreditCard className="h-8 w-8 text-primary-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Credits Remaining</p>
                            <p className="text-2xl font-semibold text-gray-900">{user?.creditsRemaining || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Key className="h-8 w-8 text-primary-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Plan Type</p>
                            <p className="text-2xl font-semibold text-gray-900 capitalize">{user?.planType || 'Free'}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Settings className="h-8 w-8 text-primary-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Account Status</p>
                            <p className="text-2xl font-semibold text-green-600">Active</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modules section */}
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Your AI Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.map((module) => {
                        const Icon = module.icon
                        return (
                            <div key={module.name} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">{module.name}</h3>
                                        <p className="text-xs text-gray-500 mt-1">{module.description}</p>
                                    </div>
                                    <Icon className="h-5 w-5 text-gray-400" />
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${module.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {module.status === 'active' ? 'Active' : 'Coming Soon'}
                                    </span>
                                    {module.status === 'active' && (
                                        <a
                                            href={module.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary-600 hover:text-primary-500"
                                        >
                                            Launch →
                                        </a>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default DashboardPage
