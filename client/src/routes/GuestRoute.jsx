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

  // If user is logged in, handle redirect
  if (isAuthenticated) {
    // Check if there's a redirect parameter
    const urlParams = new URLSearchParams(location.search);
    const redirectUrl = urlParams.get('redirect');
    
    if (redirectUrl) {
      // If there's a redirect URL, go there instead of dashboard
      window.location.href = redirectUrl;
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    // Otherwise, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // If not logged in, render the children (login/register forms)
  return children;
};

export default GuestRoute;
