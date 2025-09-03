import { useState, useEffect } from 'react'
import { CreditCard, Plus, History, Loader2, RefreshCw } from 'lucide-react'
import api from '../utils/api'
import Loader from '../components/Loader'
import { loadRazorpayScript } from '../utils/payment'

const CreditsPage = () => {
    const [balance, setBalance] = useState(0)
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [purchasing, setPurchasing] = useState(null)
    const [packages, setPackages] = useState({})
    const [refreshingHistory, setRefreshingHistory] = useState(false)

    useEffect(() => {
        fetchData()
        fetchPackages()
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

    const fetchPackages = async () => {
        try {
            const response = await api.get('/payments/packages')
            const creditPackages = {}
            response.data.creditPackages.forEach(pkg => {
                creditPackages[pkg.id] = pkg
            })
            setPackages(creditPackages)
        } catch (error) {
            console.error('Failed to fetch packages:', error)
        }
    }

    const refreshTransactionHistory = async () => {
        try {
            setRefreshingHistory(true)
            const historyRes = await api.get('/credits/history')
            setTransactions(historyRes.data.transactions || [])
        } catch (error) {
            console.error('Failed to refresh transaction history:', error)
        } finally {
            setRefreshingHistory(false)
        }
    }

    const handlePurchase = async (packageId) => {
        try {
            setPurchasing(packageId)
            
            // Load Razorpay script
            const isScriptLoaded = await loadRazorpayScript()
            if (!isScriptLoaded) {
                alert('Failed to load payment gateway. Please try again.')
                return
            }

            // Create order
            const orderResponse = await api.post('/payments/create-order', {
                type: 'credits',
                package: packageId
            })

            const { orderId, amount, currency, description, demo } = orderResponse.data

            // Handle demo mode
            if (demo) {
                const confirmDemo = confirm(`DEMO MODE: This is a simulated payment.\n\nWould you like to proceed with the demo transaction?\n\nThis will add credits to your account for testing purposes.`);
                
                if (!confirmDemo) {
                    return;
                }

                // Simulate demo payment verification
                try {
                    const verifyResponse = await api.post('/payments/verify', {
                        razorpayOrderId: orderId,
                        razorpayPaymentId: 'demo_payment_id',
                        razorpaySignature: 'demo_signature'
                    })

                    alert(`Demo Payment Successful!\n\n${verifyResponse.data.creditsAdded} credits added to your account.\n\nTotal Credits: ${verifyResponse.data.creditsRemaining}`)
                    
                    // Refresh data
                    await fetchData()
                    return
                } catch (error) {
                    console.error('Demo payment verification failed:', error)
                    alert('Demo payment verification failed. Please try again.')
                    return
                }
            }

            // Initialize Razorpay
            const options = {
                key: 'rzp_test_RARXaiHMUK2Zrq', // Using the test key from .env
                amount: amount,
                currency: currency,
                name: 'New Platform',
                description: description,
                order_id: orderId,
                handler: async (response) => {
                    try {
                        // Verify payment
                        const verifyResponse = await api.post('/payments/verify', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        })

                        alert(`Payment successful! ${verifyResponse.data.creditsAdded} credits added to your account.`)
                        
                        // Refresh data
                        await fetchData()
                    } catch (error) {
                        console.error('Payment verification failed:', error)
                        alert('Payment verification failed. Please contact support.')
                    }
                },
                prefill: {
                    name: 'User',
                    email: 'user@example.com'
                },
                theme: {
                    color: '#2563eb'
                }
            }

            const razorpay = new window.Razorpay(options)
            razorpay.open()

        } catch (error) {
            console.error('Purchase failed:', error)
            alert('Purchase failed. Please try again.')
        } finally {
            setPurchasing(null)
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
                        <div className="text-4xl font-bold text-primary-600 mb-1">{packages['25']?.credits || 25}</div>
                        <div className="text-gray-500 mb-2">credits</div>
                        <div className="text-2xl font-bold mb-4">₹{packages['25']?.price || 45}</div>
                        <ul className="mb-6 space-y-1 text-sm text-gray-600 text-left">
                            <li>✔ Perfect for testing</li>
                            <li>✔ No commitment</li>
                            <li>✔ Instant delivery</li>
                        </ul>
                        <button 
                            onClick={() => handlePurchase('25')}
                            disabled={purchasing === '25'}
                            className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold flex items-center justify-center"
                        >
                            {purchasing === '25' ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Plus className="h-5 w-5 mr-2" /> Buy Now
                                </>
                            )}
                        </button>
                    </div>
                    {/* Creator Pack */}
                    <div className="relative bg-white border rounded-xl p-6 flex flex-col items-center shadow hover:shadow-lg transition">
                        <div className="absolute top-4 right-4 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Save ₹15</div>
                        <h3 className="text-lg font-semibold mb-2">Creator Pack</h3>
                        <div className="text-4xl font-bold text-primary-600 mb-1">{packages['50']?.credits || 50}</div>
                        <div className="text-gray-500 mb-2">credits</div>
                        <div className="text-2xl font-bold mb-4">₹{packages['50']?.price || 75}</div>
                        <ul className="mb-6 space-y-1 text-sm text-gray-600 text-left">
                            <li>✔ Most popular choice</li>
                            <li>✔ Better value</li>
                            <li>✔ Priority support</li>
                        </ul>
                        <button 
                            onClick={() => handlePurchase('50')}
                            disabled={purchasing === '50'}
                            className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold flex items-center justify-center"
                        >
                            {purchasing === '50' ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Plus className="h-5 w-5 mr-2" /> Buy Now
                                </>
                            )}
                        </button>
                    </div>
                    {/* Pro Pack */}
                    <div className="relative bg-blue-50 border-2 border-blue-600 rounded-xl p-6 flex flex-col items-center shadow-lg">
                        <div className="absolute top-4 right-4 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Save ₹40</div>
                        <div className="absolute top-4 left-4 text-xs bg-blue-600 text-white px-2 py-1 rounded">Most Popular</div>
                        <h3 className="text-lg font-semibold mb-2">Pro Pack</h3>
                        <div className="text-4xl font-bold text-blue-700 mb-1">{packages['80']?.credits || 80}</div>
                        <div className="text-gray-500 mb-2">credits</div>
                        <div className="text-2xl font-bold mb-4">₹{packages['80']?.price || 100}</div>
                        <ul className="mb-6 space-y-1 text-sm text-gray-600 text-left">
                            <li>✔ Best value</li>
                            <li>✔ Bulk discount</li>
                            <li>✔ Team features</li>
                        </ul>
                        <button 
                            onClick={() => handlePurchase('80')}
                            disabled={purchasing === '80'}
                            className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold flex items-center justify-center"
                        >
                            {purchasing === '80' ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Plus className="h-5 w-5 mr-2" /> Buy Now
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction history */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
                    <button
                        onClick={refreshTransactionHistory}
                        disabled={refreshingHistory}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                        title="Refresh transaction history"
                    >
                        {refreshingHistory ? (
                            <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
                        ) : (
                            <RefreshCw className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                    </button>
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
