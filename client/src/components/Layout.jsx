import { useEffect, useState, Suspense } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api, { syncAgencyWorkspaceContext } from '../utils/api'
import {
    Home,
    CreditCard,
    Key,
    Building2,
    Settings,
    LayoutDashboard,
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
        syncAgencyWorkspaceContext(location.pathname, location.search)

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
        const onVisibilityChange = () => {
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                fetchCredits()
            }
        }
        window.addEventListener('focus', onFocus)
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', onVisibilityChange)
        }
        return () => {
            cancelled = true
            window.removeEventListener('focus', onFocus)
            if (typeof document !== 'undefined') {
                document.removeEventListener('visibilitychange', onVisibilityChange)
            }
        }
    }, [user?.id, location.pathname, location.search])

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
    const currentSection =
        navigation.find((item) => isActive(item.href)) ||
        (location.pathname.startsWith('/agency/workspaces/')
            ? { name: 'Agency Workspace', href: '/agency', icon: Building2 }
            : null)
    const marketingLinks = [
        { name: 'About', href: '/about' },
        { name: 'Blog', href: '/blogs' },
        { name: 'Contact', href: '/contact' },
    ]
    const currentAppTitle = currentSection?.name || 'Dashboard'

    useEffect(() => {
        if (typeof document === 'undefined') return
        document.title = `${currentAppTitle} | SuiteGenie`
    }, [currentAppTitle])

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
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
                <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
                    <div className="h-[41px] border-b border-slate-100 bg-slate-950" />
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
                <div className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
                    <div className="border-b border-slate-100 bg-slate-950 text-white">
                        <div className="flex items-center justify-between px-4 py-2 text-xs sm:px-6 lg:px-8">
                            <p className="font-medium text-slate-200">Built for Indian creators, operators, and agencies.</p>
                            <p className="hidden text-slate-300 xl:block">BYOK multi-LLM, client approvals, and workspace-aware publishing.</p>
                        </div>
                    </div>
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex min-h-[72px] items-center gap-4 py-3">
                            <button
                                type="button"
                                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:hidden"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <div className="min-w-0 flex flex-1 items-center justify-between gap-4">
                                <Link to="/dashboard" className="group flex min-w-0 items-center gap-3 text-slate-950">
                                    <img src="/suitegenie-logo-icon.png" alt="SuiteGenie Logo" className="h-11 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.03]" />
                                    <div className="min-w-0">
                                        <p className="truncate text-lg font-semibold tracking-tight text-slate-950">SuiteGenie</p>
                                        <p className="truncate text-xs text-slate-500">AI social media operating system</p>
                                    </div>
                                </Link>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div className="hidden text-left sm:block">
                                            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="max-w-[220px] truncate text-xs text-slate-500">{user?.email}</span>
                                                {(user?.planType === 'pro' || user?.planType === 'agency') && (
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                        user?.planType === 'agency'
                                                            ? 'bg-slate-950 text-white'
                                                            : 'bg-blue-600 text-white'
                                                    }`}>
                                                        {user?.planType === 'agency' ? 'AGENCY' : 'PRO'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 py-3">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900">{currentAppTitle}</p>
                                <p className="text-xs text-slate-500">Authenticated workspace and billing controls</p>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                <div className="hidden items-center gap-1 lg:flex">
                                    {marketingLinks.map((item) => (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                                <Link
                                    to={currentSection?.href || '/dashboard'}
                                    className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 lg:inline-flex"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    {currentAppTitle}
                                </Link>
                                <span>
                                    {creditScopeLabel}: <span className="font-medium text-slate-900">{creditBalance !== null ? creditBalance : (user?.creditsRemaining || 0)}</span>
                                </span>
                                {(user?.planType === 'pro' || user?.planType === 'agency') && (
                                    <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
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
