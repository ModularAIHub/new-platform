import { AuthProvider } from './contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import Navbar from './components/navbar';
import AppRoutes from './routes/AppRoutes';

function App() {
  const location = useLocation();
  const isAgencyWorkspaceRoute = location.pathname.startsWith('/agency/workspaces/');
  const isAgencyPublicApprovalRoute = location.pathname.startsWith('/agency/approve/');
  const isAppShellRoute =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/credits') ||
    location.pathname.startsWith('/api-keys') ||
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/team') ||
    location.pathname.startsWith('/agency');

  return (
    <AuthProvider>
      {!isAgencyWorkspaceRoute && !isAgencyPublicApprovalRoute && !isAppShellRoute && <Navbar />}
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
