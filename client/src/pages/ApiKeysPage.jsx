import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Key, Plus, Trash2, Lock } from 'lucide-react'
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
    CardContent
} from '../components/ui'

const providerMeta = {
    openai: {
        label: 'OpenAI',
        tone: 'border-green-200 bg-green-50 text-green-800'
    },
    gemini: {
        label: 'Gemini',
        tone: 'border-blue-200 bg-blue-50 text-blue-800'
    },
    perplexity: {
        label: 'Perplexity',
        tone: 'border-purple-200 bg-purple-50 text-purple-800'
    }
}

const ApiKeysPage = () => {
    const [searchParams] = useSearchParams()
    const byokSectionRef = useRef(null)
    const [highlightByok, setHighlightByok] = useState(false)
    const [apiKeys, setApiKeys] = useState({})
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({ provider: 'openai', keyName: '', apiKey: '' })
    const [preference, setPreference] = useState(null)
    const [creditTier, setCreditTier] = useState(0)
    const [locked, setLocked] = useState(false)
    const [lockMessage, setLockMessage] = useState(null)
    const [showByokInfo, setShowByokInfo] = useState(false)
    const [prefLoading, setPrefLoading] = useState(true)
    const [showConfirm, setShowConfirm] = useState(false)
    const [showByokSwitch, setShowByokSwitch] = useState(false)
    const [byokSelected, setByokSelected] = useState(false)

    useEffect(() => {
        fetchByokKeys()
        fetchPreference()

        if (searchParams.get('mode') === 'byok') {
            setByokSelected(true)
            setTimeout(() => {
                byokSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                setHighlightByok(true)
                setTimeout(() => setHighlightByok(false), 2500)
            }, 500)
        }
    }, [])

    const fetchPreference = async () => {
        setPrefLoading(true)
        try {
            const res = await api.get('/byok/preference')
            setPreference(res.data.api_key_preference ?? null)
            const fallbackTier = res.data.api_key_preference === 'byok' ? 50 : 15
            setCreditTier(res.data.creditTier ?? fallbackTier)
            setLocked(res.data.locked)
            setLockMessage(res.data.lockMessage)
        } catch (e) {
            setPreference(null)
        } finally {
            setPrefLoading(false)
        }
    }

    const fetchByokKeys = async () => {
        try {
            const response = await api.get('/byok/keys')
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

    const focusByokStep = () => {
        setByokSelected(true)
        setTimeout(() => {
            byokSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            setHighlightByok(true)
            setTimeout(() => setHighlightByok(false), 2500)
        }, 120)
    }

    const handleModeSelect = (mode) => {
        if (locked) return
        if (mode === 'platform') {
            if (preference === 'platform') return
            setShowConfirm(true)
            return
        }

        if (mode === 'byok') {
            if (preference === 'byok') return
            focusByokStep()
        }
    }

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!form.provider || !form.apiKey || !form.keyName) return
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
                keyName: form.keyName
            })
            setForm({ provider: form.provider, keyName: '', apiKey: '' })
            await fetchByokKeys()
            await fetchPreference()
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        await api.delete('/byok/key', { data: { keyId: id } })
        await fetchByokKeys()
    }

    if (loading || prefLoading) {
        return <Loader className="h-64" size={28} />
    }

    const providers = ['openai', 'gemini', 'perplexity']
    const isByokActive = preference === 'byok'
    const shouldShowByokSetup = isByokActive || byokSelected || searchParams.get('mode') === 'byok'

    return (
        <div className="space-y-8">
            {showByokSwitch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-3">Switch to BYOK?</h2>
                        <p className="mb-5 text-sm text-neutral-700">
                            BYOK mode starts a 90-day preference lock after your first key is saved.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setShowByokSwitch(false)}>Cancel</Button>
                            <Button
                                variant="success"
                                loading={submitting}
                                onClick={async () => {
                                    setShowByokSwitch(false)
                                    await api.post('/byok/preference', { preference: 'byok' })
                                    setPreference('byok')
                                    await actuallyAddKey()
                                    await fetchPreference()
                                }}
                            >
                                Confirm & Continue
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-3">Switch to Platform Keys?</h2>
                        <p className="mb-5 text-sm text-neutral-700">
                            Platform mode also applies the 90-day preference lock immediately.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
                            <Button
                                variant="primary"
                                onClick={async () => {
                                    setShowConfirm(false)
                                    await api.post('/byok/preference', { preference: 'platform' })
                                    setByokSelected(false)
                                    await fetchPreference()
                                }}
                            >
                                Confirm Switch
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showByokInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full relative">
                        <button
                            type="button"
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                            onClick={() => setShowByokInfo(false)}
                        >
                            &times;
                        </button>
                        <h2 className="text-xl font-bold mb-2 text-neutral-900">BYOK in plain terms</h2>
                        <ul className="list-disc pl-5 text-sm text-neutral-700 space-y-1">
                            <li>BYOK means you use your own provider key for AI requests.</li>
                            <li>Switching preference triggers a 90-day lock.</li>
                            <li>Platform mode is easiest. BYOK offers more control and higher credit tier.</li>
                            <li>You can delete and rotate BYOK keys anytime.</li>
                        </ul>
                    </div>
                </div>
            )}

            <Card variant="elevated" className="border border-neutral-200">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="w-5 h-5 text-primary-600" />
                                API Keys & Preferences
                            </CardTitle>
                            <CardDescription>
                                Pick your mode first, then add keys only if you choose BYOK.
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowByokInfo(true)}>
                            What is BYOK?
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => handleModeSelect('platform')}
                            disabled={locked}
                            className={`rounded-xl border p-4 text-left transition-colors ${
                                preference === 'platform'
                                    ? 'border-primary-400 bg-primary-50'
                                    : 'border-neutral-200 hover:border-primary-300'
                            } ${locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-neutral-900">Platform Keys</p>
                                {preference === 'platform' && (
                                    <span className="text-xs font-semibold text-primary-700">Active</span>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-neutral-600">No setup needed. Best for quick onboarding.</p>
                            <p className="mt-2 text-xs text-neutral-500">15 credits (Free) / 100 (Pro)</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleModeSelect('byok')}
                            disabled={locked}
                            className={`rounded-xl border p-4 text-left transition-colors ${
                                isByokActive || byokSelected
                                    ? 'border-success-400 bg-success-50'
                                    : 'border-neutral-200 hover:border-success-300'
                            } ${locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-neutral-900">Bring Your Own Key (BYOK)</p>
                                {isByokActive && (
                                    <span className="text-xs font-semibold text-success-700">Active</span>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-neutral-600">Use OpenAI, Gemini, or Perplexity keys.</p>
                            <p className="mt-2 text-xs text-neutral-500">50 credits (Free) / 180 (Pro)</p>
                        </button>
                    </div>

                    {locked && (
                        <div className="flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-800">
                            <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{lockMessage}</span>
                        </div>
                    )}

                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-neutral-500">Current mode</p>
                            <p className="font-semibold text-neutral-900">
                                {isByokActive ? 'BYOK (Your Keys)' : 'Platform Keys'}
                            </p>
                        </div>
                        <div>
                            <p className="text-neutral-500">Current credit tier</p>
                            <p className="font-semibold text-neutral-900">{creditTier} credits/month</p>
                        </div>
                    </div>

                    {shouldShowByokSetup && (
                        <div
                            ref={byokSectionRef}
                            className={`rounded-xl border p-4 transition-all ${
                                highlightByok ? 'border-success-400 ring-2 ring-success-200' : 'border-neutral-200'
                            }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                <h3 className="text-base font-semibold text-neutral-900">Step 2: Add BYOK key</h3>
                                <span className="text-xs text-neutral-500">Required once to activate BYOK safely</span>
                            </div>
                            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                <Select
                                    label="Provider"
                                    value={form.provider}
                                    placeholder={null}
                                    options={[
                                        { value: 'openai', label: 'OpenAI' },
                                        { value: 'gemini', label: 'Gemini' },
                                        { value: 'perplexity', label: 'Perplexity' }
                                    ]}
                                    onChange={(e) => setForm({ ...form, provider: e.target.value })}
                                />
                                <Input
                                    label="Key name"
                                    value={form.keyName}
                                    placeholder="Primary key"
                                    onChange={(e) => setForm({ ...form, keyName: e.target.value })}
                                />
                                <Input
                                    label="API key"
                                    type="password"
                                    value={form.apiKey}
                                    placeholder="Paste key"
                                    onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                                />
                                <Button
                                    type="submit"
                                    variant="success"
                                    loading={submitting}
                                    icon={<Plus className="h-4 w-4" />}
                                >
                                    Add Key
                                </Button>
                            </form>
                            <p className="text-xs text-neutral-500 mt-3">
                                The 90-day lock starts when your first BYOK key is saved.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-5">
                {providers.map((provider) => {
                    const meta = providerMeta[provider]
                    const keys = apiKeys[provider] || []
                    return (
                        <Card key={provider} className="border border-neutral-200">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-lg">{meta.label} Keys</CardTitle>
                                        <CardDescription>Manage active key entries for {meta.label}.</CardDescription>
                                    </div>
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.tone}`}>
                                        {keys.length} key{keys.length === 1 ? '' : 's'}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {keys.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-600">
                                        No {meta.label} key added yet.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {keys.map((key) => (
                                            <div
                                                key={key.id}
                                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-neutral-200 p-3"
                                            >
                                                <div>
                                                    <p className="font-medium text-neutral-900">{key.keyName}</p>
                                                    <p className="text-xs text-neutral-500">
                                                        Created {new Date(key.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-success-100 text-success-700">
                                                        Active
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(key.id)}
                                                        className="inline-flex items-center justify-center rounded-md border border-neutral-200 p-2 text-neutral-600 hover:text-error-600 hover:border-error-300"
                                                        title={`Delete ${key.keyName}`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

export default ApiKeysPage
