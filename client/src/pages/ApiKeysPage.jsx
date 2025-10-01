
import { useState, useEffect } from 'react'
import { Key, Plus, Edit, Trash2, Lock, AlertTriangle, Info } from 'lucide-react'
import api from '../utils/api'
import Loader from '../components/Loader'
import { 
    Button, 
    Input, 
    Select, 
    Card, 
    CardHeader, 
    CardTitle, 
    CardDescription, 
    CardContent, 
    CardFooter 
} from '../components/ui'

const ApiKeysPage = () => {
    const [apiKeys, setApiKeys] = useState({})
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({ provider: 'openai', keyName: '', apiKey: '' })
    const [preference, setPreference] = useState(null)
    const [lockUntil, setLockUntil] = useState(null)
    const [creditTier, setCreditTier] = useState(25)
    const [locked, setLocked] = useState(false)
    const [lockMessage, setLockMessage] = useState(null)
    const [showByokInfo, setShowByokInfo] = useState(false)
    const [prefLoading, setPrefLoading] = useState(true)
    const [showConfirm, setShowConfirm] = useState(false)
    const [pendingPref, setPendingPref] = useState(null)
    const [showByokSwitch, setShowByokSwitch] = useState(false)


    useEffect(() => {
        fetchByokKeys()
        fetchPreference()
    }, [])

    const fetchPreference = async () => {
        setPrefLoading(true)
        try {
            const res = await api.get('/byok/preference')
            setPreference(res.data.api_key_preference ?? null)
            setLockUntil(res.data.byok_locked_until)
            setCreditTier(res.data.creditTier || (res.data.api_key_preference === 'byok' ? 55 : 25))
            setLocked(res.data.locked)
            setLockMessage(res.data.lockMessage)
        } catch (e) {
            setPreference(null)
        } finally {
            setPrefLoading(false)
        }
    }


    // Fetch BYOK keys and group by provider
    const fetchByokKeys = async () => {
        try {
            const response = await api.get('/byok/keys')
            // Group keys by provider for display
            const grouped = {}
            for (const key of response.data.keys || []) {
                if (!grouped[key.provider]) grouped[key.provider] = []
                grouped[key.provider].push(key)
            }
            setApiKeys(grouped)
        } catch (error) {
            console.error('Failed to fetch BYOK keys:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!form.provider || !form.apiKey || !form.keyName) return
        // If not already BYOK, prompt confirmation to switch and lock
        if (preference !== 'byok') {
            setShowByokSwitch(true)
            return
        }
        await actuallyAddKey()
    }

    const actuallyAddKey = async () => {
        try {
            setSubmitting(true)
            await api.post('/byok/key', {
                provider: form.provider,
                apiKey: form.apiKey,
                keyName: form.keyName,
            })
            setForm({ provider: form.provider, keyName: '', apiKey: '' })
            await fetchByokKeys()
            await fetchPreference()
        } finally {
            setSubmitting(false)
        }
    }


    // Optionally remove toggle active for minimal UI
    // const handleToggleActive = async (provider, id, isActive) => {
    //     await api.put(`/api-keys/${id}`, { isActive: !isActive })
    //     await fetchByokKeys()
    // }


    const handleDelete = async (id) => {
        await api.delete('/byok/key', { data: { keyId: id } })
        await fetchByokKeys()
    }



    if (loading || prefLoading) {
        return <Loader className="h-64" size={28} />
    }

    const providers = ['openai', 'gemini', 'perplexity']


    return (
        <div className="space-y-12">
            {/* Confirm switch to BYOK modal */}
            {showByokSwitch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Switch to BYOK?</h2>
                        <p className="mb-4">Switching to BYOK will lock your preference for 90 days. Are you sure you want to continue?</p>
                        <div className="flex gap-4 justify-end">
                            <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowByokSwitch(false)}>Cancel</button>
                            <button className="px-4 py-2 rounded bg-green-600 text-white font-bold" onClick={async () => {
                                setShowByokSwitch(false)
                                await api.post('/byok/preference', { preference: 'byok' })
                                setPreference('byok')
                                await actuallyAddKey()
                                await fetchPreference()
                            }}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Confirm switch to platform modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Switch to Platform?</h2>
                        <p className="mb-4">Switching to Platform will lock your preference for 90 days. Are you sure you want to continue?</p>
                        <div className="flex gap-4 justify-end">
                            <button className="px-4 py-2 rounded bg-gray-200" onClick={() => { setShowConfirm(false); setPendingPref(null); }}>Cancel</button>
                            <button className="px-4 py-2 rounded bg-blue-600 text-white font-bold" onClick={async () => {
                                setShowConfirm(false)
                                setPendingPref(null)
                                await api.post('/byok/preference', { preference: 'platform' })
                                await fetchPreference()
                            }}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
            {/* BYOK Preference Section */}
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 shadow-xl rounded-2xl p-10 border border-gray-100 relative overflow-hidden">
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
                                <b>Tip:</b> You can manage, add, or remove your keys below. If no key is configured for a provider, you cannot use that provider's AI features.
                            </div>
                        </div>
                    </div>
                )}
                <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(circle at 20% 40%, rgba(59,130,246,0.08) 0%, transparent 70%), radial-gradient(circle at 80% 60%, rgba(16,163,127,0.08) 0%, transparent 70%)'}}></div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">API Key Preference</h1>
                            <button className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-semibold" onClick={() => setShowByokInfo(true)}>What is BYOK?</button>
                        </div>
                        <p className="text-gray-500 mt-2 text-lg">Choose your API key mode. <b>Platform</b>: 25 credits/month. <b>BYOK</b>: 55 credits/month, 90-day lock.</p>
                        <div className="flex items-center gap-6 mt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="api-key-pref" value="platform" checked={preference === 'platform'}
                                    onChange={() => {
                                        if (preference !== 'platform' && (!lockUntil || new Date(lockUntil) <= new Date()) && !locked) {
                                            setPendingPref('platform');
                                            setShowConfirm(true);
                                        }
                                    }}
                                    disabled={locked || (preference === 'byok' && lockUntil && new Date(lockUntil) > new Date())}
                                />
                                <span className="font-semibold text-blue-700">Platform Key</span>
                                <span className="text-xs text-gray-500">(25 credits/month)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="api-key-pref" value="byok" checked={preference === 'byok'}
                                    onChange={() => {
                                        // Do nothing, handled by add key flow
                                    }}
                                    disabled={locked || (preference === 'platform' && lockUntil && new Date(lockUntil) > new Date())}
                                />
                                <span className="font-semibold text-green-700">BYOK</span>
                                <span className="text-xs text-gray-500">(55 credits/month, 30-day lock)</span>
                            </label>
                            {preference !== 'byok' && (
                                <div className="mt-2 text-sm text-green-700">
                                    Enter a key below to get into BYOK mode.
                                </div>
                            )}
                        </div>
                        {locked && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                                <Lock className="h-4 w-4" />
                                {lockMessage}
                            </div>
                        )}
                        <div className="mt-4 text-base font-semibold text-blue-900">Current credit tier: <span className="text-blue-700">{creditTier} credits/month</span></div>
                        {preference === 'byok' && (
                            <div className="mt-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                                <b>BYOK is active.</b> All AI requests will use your own keys. Make sure you have added valid keys for each provider you want to use.
                            </div>
                        )}
                    </div>
                    {/* Add Key Form */}
                    <form onSubmit={handleAdd} className="flex flex-col md:flex-row items-center gap-2 bg-white/70 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-200">
                        <select
                            className="border rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-400"
                            value={form.provider}
                            onChange={(e) => setForm({ ...form, provider: e.target.value })}
                        >
                            <option value="openai">OpenAI</option>
                            <option value="gemini">Gemini</option>
                            <option value="perplexity">Perplexity</option>
                        </select>
                        <input
                            className="border rounded-lg px-4 py-2 text-sm w-32 focus:ring-2 focus:ring-purple-400"
                            placeholder="Key name"
                            value={form.keyName}
                            onChange={(e) => setForm({ ...form, keyName: e.target.value })}
                        />
                        <input
                            className="border rounded-lg px-4 py-2 text-sm w-48 focus:ring-2 focus:ring-green-400"
                            placeholder="API key"
                            value={form.apiKey}
                            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                        />
                        <button disabled={submitting} className="flex items-center gap-1 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white font-bold text-sm shadow-lg transition-all duration-200 disabled:opacity-50">
                            <Plus className="h-4 w-4" /> Add
                        </button>
                    </form>
                </div>
            </div>

            {/* BYOK Keys List removed: redundant, use provider sections below */}

            {/* API Keys by provider */}
            {providers.map((provider) => {
                // Custom SVG icons and accent colors
                let icon, accent, badge, gradient;
                if (provider === 'openai') {
                    icon = (
                        <span className="inline-block align-middle">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#10A37F"/><path d="M16 8l4 8-4 8-4-8 4-8z" fill="#fff"/></svg>
                        </span>
                    );
                    accent = 'bg-green-50 border-green-200';
                    badge = 'bg-green-600 text-white';
                    gradient = 'from-green-50 via-white to-blue-50';
                } else if (provider === 'gemini') {
                    icon = (
                        <span className="inline-block align-middle">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#4285F4"/><path d="M16 8a8 8 0 100 16 8 8 0 000-16z" fill="#fff"/></svg>
                        </span>
                    );
                    accent = 'bg-blue-50 border-blue-200';
                    badge = 'bg-blue-600 text-white';
                    gradient = 'from-blue-50 via-white to-purple-50';
                } else if (provider === 'perplexity') {
                    icon = (
                        <span className="inline-block align-middle">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#7C3AED"/><path d="M16 8a8 8 0 110 16 8 8 0 010-16z" fill="#fff"/></svg>
                        </span>
                    );
                    accent = 'bg-purple-50 border-purple-200';
                    badge = 'bg-purple-600 text-white';
                    gradient = 'from-purple-50 via-white to-green-50';
                }
                return (
                    <div key={provider} className={`rounded-2xl shadow-xl border ${accent} p-8 mb-10 transition-all duration-300 bg-gradient-to-br ${gradient} relative overflow-hidden`}> 
                        <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(circle at 20% 40%, rgba(59,130,246,0.08) 0%, transparent 70%), radial-gradient(circle at 80% 60%, rgba(16,163,127,0.08) 0%, transparent 70%)'}}></div>
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className={`rounded-full p-2 ${accent} shadow flex items-center justify-center w-12 h-12`}>{icon}</div>
                            <h2 className="text-xl font-bold text-gray-900 capitalize tracking-wide flex items-center gap-2">
                                {provider.charAt(0).toUpperCase() + provider.slice(1)}
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge}`}>{provider}</span>
                                <span className="text-xs text-gray-400 font-normal ml-2">API Keys</span>
                            </h2>
                        </div>
                        <div className="border-b border-gray-200 mb-6"></div>
                        <div className="mb-6 text-gray-500 text-sm font-medium">Add, view, and manage your API keys for {provider.charAt(0).toUpperCase() + provider.slice(1)}.</div>
                        {(!apiKeys[provider] || apiKeys[provider].length === 0) ? (
                            <div className="text-center py-8">
                                <p className="text-gray-400 text-base font-medium">No API keys configured for {provider}. <span className="text-yellow-700">You cannot use {provider.charAt(0).toUpperCase() + provider.slice(1)} AI features until you add a key.</span></p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {apiKeys[provider].map((key, idx) => (
                                    <div key={key.id} className={`flex items-center justify-between p-6 rounded-2xl shadow-xl bg-white/70 backdrop-blur-md border ${accent} hover:scale-[1.03] hover:shadow-2xl transition-all duration-300 animate-fade-in`} style={{animationDelay: `${idx * 80}ms`}}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${accent} shadow`}>{icon}</div>
                                            <div>
                                                <p className="text-lg font-semibold text-gray-900">{key.keyName}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Created {new Date(key.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${key.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {key.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            <button onClick={() => handleToggleActive(provider, key.id, key.isActive)} className="text-gray-400 hover:text-blue-600 transition">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(key.id)} className="text-gray-400 hover:text-red-600 transition">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    )
}

export default ApiKeysPage
