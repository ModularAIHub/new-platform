
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import api from '../utils/api';

const ALLOWED_WITHOUT_MODE = ['/dashboard', '/api-keys'];

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [prefLoading, setPrefLoading] = useState(true);
  const [preference, setPreference] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    setPrefLoading(true);
    api.get('/byok/preference')
      .then(res => {
        if (mounted) setPreference(res.data.api_key_preference ?? null);
      })
      .catch(() => {
        if (mounted) setPreference(null);
      })
      .finally(() => {
        if (mounted) setPrefLoading(false);
      });
    return () => { mounted = false; };
  }, [isAuthenticated]);

  if (loading || (isAuthenticated && prefLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If user has not chosen a mode, only allow dashboard and api-keys
  if (!preference && !ALLOWED_WITHOUT_MODE.includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
