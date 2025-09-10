import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user is coming from logout
  const isLogout = new URLSearchParams(location.search).get('logout') === 'true';

  // If user is logged in and NOT coming from logout, redirect to dashboard
  if (isAuthenticated && !isLogout) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not logged in OR coming from logout, render the children (login/register forms)
  return children;
};

export default GuestRoute;
