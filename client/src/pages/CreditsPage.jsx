import { useState, useEffect } from 'react'
import { CreditCard, Plus, History } from 'lucide-react'
import api from '../utils/api'
import Loader from '../components/Loader'

const CreditsPage = () => {
    const [balance, setBalance] = useState(0)
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [balanceRes, historyRes] = await Promise.all([
                api.get('/credits/balance'),
                api.get('/credits/history')
            ])

            setBalance(balanceRes.data.creditsRemaining)
            setTransactions(historyRes.data.transactions || [])
        } catch (error) {
            console.error('Failed to fetch credit data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <Loader className="h-64" size={28} />
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white shadow rounded-lg p-6">
                <h1 className="text-2xl font-bold text-gray-900">Credits</h1>
                <p className="text-gray-600 mt-2">Manage your credit balance and purchase additional credits when needed.</p>
            </div>

            {/* Credit balance */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <CreditCard className="h-8 w-8 text-primary-600" />
                        <div className="ml-4">
                            <h2 className="text-lg font-medium text-gray-900">Current Balance</h2>
                            <p className="text-3xl font-bold text-primary-600">{balance} credits</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Buy Credits Section */}
            <div className="bg-white shadow rounded-lg p-8">
                <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Buy Credits</h2>
                <p className="text-gray-600 text-center mb-8">No commitment. Buy when you need them.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Starter Pack */}
                    <div className="relative bg-white border rounded-xl p-6 flex flex-col items-center shadow hover:shadow-lg transition">
                        <div className="absolute top-4 right-4 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Save ₹0</div>
                        <h3 className="text-lg font-semibold mb-2">Starter Pack</h3>
                        <div className="text-4xl font-bold text-primary-600 mb-1">25</div>
                        <div className="text-gray-500 mb-2">credits</div>
                        <div className="text-2xl font-bold mb-4">₹45</div>
                        <ul className="mb-6 space-y-1 text-sm text-gray-600 text-left">
                            <li>✔ Perfect for testing</li>
                            <li>✔ No commitment</li>
                            <li>✔ Instant delivery</li>
                        </ul>
                        <button className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center">
                            <Plus className="h-5 w-5 mr-2" /> Buy Now
                        </button>
                    </div>
                    {/* Creator Pack */}
                    <div className="relative bg-white border rounded-xl p-6 flex flex-col items-center shadow hover:shadow-lg transition">
                        <div className="absolute top-4 right-4 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Save ₹15</div>
                        <h3 className="text-lg font-semibold mb-2">Creator Pack</h3>
                        <div className="text-4xl font-bold text-primary-600 mb-1">50</div>
                        <div className="text-gray-500 mb-2">credits</div>
                        <div className="text-2xl font-bold mb-4">₹75</div>
                        <ul className="mb-6 space-y-1 text-sm text-gray-600 text-left">
                            <li>✔ Most popular choice</li>
                            <li>✔ Better value</li>
                            <li>✔ Priority support</li>
                        </ul>
                        <button className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center">
                            <Plus className="h-5 w-5 mr-2" /> Buy Now
                        </button>
                    </div>
                    {/* Pro Pack */}
                    <div className="relative bg-blue-50 border-2 border-blue-600 rounded-xl p-6 flex flex-col items-center shadow-lg">
                        <div className="absolute top-4 right-4 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Save ₹40</div>
                        <div className="absolute top-4 left-4 text-xs bg-blue-600 text-white px-2 py-1 rounded">Most Popular</div>
                        <h3 className="text-lg font-semibold mb-2">Pro Pack</h3>
                        <div className="text-4xl font-bold text-blue-700 mb-1">80</div>
                        <div className="text-gray-500 mb-2">credits</div>
                        <div className="text-2xl font-bold mb-4">₹100</div>
                        <ul className="mb-6 space-y-1 text-sm text-gray-600 text-left">
                            <li>✔ Best value</li>
                            <li>✔ Bulk discount</li>
                            <li>✔ Team features</li>
                        </ul>
                        <button className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center">
                            <Plus className="h-5 w-5 mr-2" /> Buy Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction history */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
                    <History className="h-5 w-5 text-gray-400" />
                </div>

                {transactions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No transactions yet.</p>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(transaction.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-medium ${transaction.type === 'purchase' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {transaction.type === 'purchase' ? '+' : '-'}{transaction.creditsAmount} credits
                                    </p>
                                    {transaction.costInRupees && (
                                        <p className="text-xs text-gray-500">₹{transaction.costInRupees}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CreditsPage
