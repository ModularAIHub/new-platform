import { AuthProvider } from './contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import Navbar from './components/navbar';
import AppRoutes from './routes/AppRoutes';

function App() {
  const location = useLocation();
  const isAgencyWorkspaceRoute = location.pathname.startsWith('/agency/workspaces/');
  const isAgencyPublicApprovalRoute = location.pathname.startsWith('/agency/approve/');

  return (
    <AuthProvider>
      {!isAgencyWorkspaceRoute && !isAgencyPublicApprovalRoute && <Navbar />}
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
