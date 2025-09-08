import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading, user } = useAuth()

    console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'loading:', loading, 'user:', user)

    if (loading) {
        console.log('ProtectedRoute - showing loading spinner')
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        console.log('ProtectedRoute - not authenticated, redirecting to login')
        return <Navigate to="/login" replace />
    }

    console.log('ProtectedRoute - authenticated, rendering children')
    return children
}

export default ProtectedRoute
