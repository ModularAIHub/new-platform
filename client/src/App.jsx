import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/navbar';
import AppRoutes from './routes/AppRoutes';

function App() {
    return (
        <AuthProvider>
            <Navbar />
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;
