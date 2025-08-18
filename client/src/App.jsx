import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CreditsPage from './pages/CreditsPage'
import ApiKeysPage from './pages/ApiKeysPage'
import SettingsPage from './pages/SettingsPage'

function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Layout>
                            <DashboardPage />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/credits" element={
                    <ProtectedRoute>
                        <Layout>
                            <CreditsPage />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/api-keys" element={
                    <ProtectedRoute>
                        <Layout>
                            <ApiKeysPage />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/settings" element={
                    <ProtectedRoute>
                        <Layout>
                            <SettingsPage />
                        </Layout>
                    </ProtectedRoute>
                } />
            </Routes>
        </AuthProvider>
    )
}

export default App
