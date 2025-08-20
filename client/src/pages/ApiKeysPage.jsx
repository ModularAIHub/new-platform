import { useState, useEffect } from 'react'
import { Key, Plus, Edit, Trash2 } from 'lucide-react'
import api from '../utils/api'
import Loader from '../components/Loader'

const ApiKeysPage = () => {
    const [apiKeys, setApiKeys] = useState({})
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({ provider: 'openai', keyName: '', apiKey: '' })

    useEffect(() => {
        fetchApiKeys()
    }, [])

    const fetchApiKeys = async () => {
        try {
            const response = await api.get('/api-keys/all')
            setApiKeys(response.data.apiKeys || {})
        } catch (error) {
            console.error('Failed to fetch API keys:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!form.provider || !form.apiKey || !form.keyName) return
        try {
            setSubmitting(true)
            await api.post('/api-keys', {
                provider: form.provider,
                apiKey: form.apiKey,
                keyName: form.keyName,
            })
            setForm({ provider: form.provider, keyName: '', apiKey: '' })
            await fetchApiKeys()
        } finally {
            setSubmitting(false)
        }
    }

    const handleToggleActive = async (provider, id, isActive) => {
    await api.put(`/api-keys/${id}`, { isActive: !isActive })
        await fetchApiKeys()
    }

    const handleDelete = async (id) => {
    await api.delete(`/api-keys/${id}`)
        await fetchApiKeys()
    }

    if (loading) {
        return <Loader className="h-64" size={28} />
    }

    const providers = ['openai', 'gemini', 'perplexity']

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 shadow-xl rounded-2xl p-10 border border-gray-100 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(circle at 20% 40%, rgba(59,130,246,0.08) 0%, transparent 70%), radial-gradient(circle at 80% 60%, rgba(16,163,127,0.08) 0%, transparent 70%)'}}></div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">API Keys</h1>
                        <p className="text-gray-500 mt-2 text-lg">Manage your AI provider API keys securely and easily.</p>
                    </div>
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
                                <p className="text-gray-400 text-base font-medium">No API keys configured for {provider}</p>
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
