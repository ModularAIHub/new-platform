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
            const response = await api.get('/user/api-keys/all')
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
            await api.post('/user/api-keys', {
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
        await api.put(`/user/api-keys/${id}`, { isActive: !isActive })
        await fetchApiKeys()
    }

    const handleDelete = async (id) => {
        await api.delete(`/user/api-keys/${id}`)
        await fetchApiKeys()
    }

    if (loading) {
        return <Loader className="h-64" size={28} />
    }

    const providers = ['openai', 'gemini', 'perplexity']

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
                        <p className="text-gray-600 mt-2">Manage your AI provider API keys securely.</p>
                    </div>
                    <form onSubmit={handleAdd} className="flex items-center space-x-2">
                        <select
                            className="border rounded px-2 py-1 text-sm"
                            value={form.provider}
                            onChange={(e) => setForm({ ...form, provider: e.target.value })}
                        >
                            <option value="openai">openai</option>
                            <option value="gemini">gemini</option>
                            <option value="perplexity">perplexity</option>
                        </select>
                        <input
                            className="border rounded px-2 py-1 text-sm"
                            placeholder="Key name"
                            value={form.keyName}
                            onChange={(e) => setForm({ ...form, keyName: e.target.value })}
                        />
                        <input
                            className="border rounded px-2 py-1 text-sm w-64"
                            placeholder="API key"
                            value={form.apiKey}
                            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                        />
                        <button disabled={submitting} className="btn btn-primary btn-sm">
                            <Plus className="h-4 w-4 mr-1" /> Add
                        </button>
                    </form>
                </div>
            </div>

            {/* API Keys by provider */}
            {providers.map((provider) => (
                <div key={provider} className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium text-gray-900 capitalize">{provider} API Keys</h2>
                        <Key className="h-5 w-5 text-gray-400" />
                    </div>

                    {(!apiKeys[provider] || apiKeys[provider].length === 0) ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No API keys configured for {provider}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {apiKeys[provider].map((key) => (
                                <div key={key.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                                <Key className="h-4 w-4 text-primary-600" />
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-900">{key.keyName}</p>
                                            <p className="text-xs text-gray-500">
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
                                        <button onClick={() => handleToggleActive(provider, key.id, key.isActive)} className="text-gray-400 hover:text-gray-600">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(key.id)} className="text-gray-400 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default ApiKeysPage
