import { AuthProvider } from './contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import Navbar from './components/navbar';
import AppRoutes from './routes/AppRoutes';

function App() {
  const location = useLocation();
  const isAgencyWorkspaceRoute = location.pathname.startsWith('/agency/workspaces/');

  return (
    <AuthProvider>
      {!isAgencyWorkspaceRoute && <Navbar />}
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
