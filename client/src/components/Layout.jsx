import { useEffect, useState, Suspense } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import {
    Home,
    CreditCard,
    Key,
    Building2,
    Settings,
    Menu,
    X,
    LogOut,
    User
} from 'lucide-react'

const Layout = ({ children }) => {
    const { user, logout } = useAuth()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [creditBalance, setCreditBalance] = useState(null)
    const [creditScope, setCreditScope] = useState('personal')

    useEffect(() => {
        if (!user) {
            setCreditBalance(null)
            setCreditScope('personal')
            return
        }

        let cancelled = false
        const fetchCredits = async () => {
            try {
                const response = await api.get('/credits/balance')
                if (cancelled) return
                const balance = Number.parseFloat(
                    response?.data?.balance ?? response?.data?.creditsRemaining ?? '0'
                )
                setCreditBalance(Number.isFinite(balance) ? balance : 0)
                setCreditScope(response?.data?.scope || response?.data?.source || 'personal')
            } catch {
                if (!cancelled) {
                    setCreditBalance(null)
                    setCreditScope('personal')
                }
            }
        }

        fetchCredits()
        const onFocus = () => fetchCredits()
        window.addEventListener('focus', onFocus)
        return () => {
            cancelled = true
            window.removeEventListener('focus', onFocus)
        }
    }, [user?.id])

    const creditScopeLabel =
        creditScope === 'agency'
            ? 'Agency'
            : creditScope === 'team'
                ? 'Team'
                : 'Credits'

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Credits', href: '/credits', icon: CreditCard },
        { name: 'API Keys & Preferences', href: '/api-keys', icon: Key },
        { name: 'Agency Hub', href: '/agency', icon: Building2 },
        // { name: 'Analytics', href: '/analytics', icon: Settings, badge: 'New' },
        // { name: 'Automate', href: '/automate', icon: Settings },
        // { name: 'Activity', href: '/activity', icon: Settings },
        { name: 'Settings', href: '/settings', icon: Settings },
    ]

    const isActive = (path) => location.pathname === path

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar */}
            <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
                    <div className="flex h-16 items-center justify-between px-4">
                        <img src="/suitegenie-logo-icon.png" alt="SuiteGenie Logo" className="h-12 w-auto object-contain" />
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <nav className="flex-1 space-y-1 px-2 py-4">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive(item.href)
                                        ? 'bg-primary-100 text-primary-900'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                    <div className="border-t border-gray-200 p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <User className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="ml-3">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                                    {(user?.planType === 'pro' || user?.planType === 'agency') && (
                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full">
                                            {user?.planType === 'agency' ? 'AGENCY' : 'PRO'}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="mt-3 flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
                    <div className="flex h-16 items-center px-4">
                        <img src="/suitegenie-logo-icon.png" alt="SuiteGenie Logo" className="h-12 w-auto object-contain" />
                    </div>
                    <nav className="flex-1 space-y-1 px-2 py-4">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive(item.href)
                                        ? 'bg-primary-100 text-primary-900'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                    <div className="border-t border-gray-200 p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <User className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="ml-3">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                                    {(user?.planType === 'pro' || user?.planType === 'agency') && (
                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full">
                                            {user?.planType === 'agency' ? 'AGENCY' : 'PRO'}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="mt-3 flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        <div className="flex flex-1"></div>
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            <div className="text-sm text-gray-500 flex items-center gap-3">
                                <span>
                                    {creditScopeLabel}: <span className="font-medium text-gray-900">{creditBalance !== null ? creditBalance : (user?.creditsRemaining || 0)}</span>
                                </span>
                                {(user?.planType === 'pro' || user?.planType === 'agency') && (
                                    <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full">
                                        {user?.planType === 'agency' ? 'AGENCY' : 'PRO'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Suspense fallback={<div>Loading...</div>}>
                            {children}
                        </Suspense>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Layout
