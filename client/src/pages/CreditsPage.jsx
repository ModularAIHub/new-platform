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
                <p className="text-gray-600 mt-2">Manage your credit balance and view transaction history.</p>
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
                    <button className="btn btn-primary btn-lg">
                        <Plus className="h-5 w-5 mr-2" />
                        Buy Credits
                    </button>
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
