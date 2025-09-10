import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthDebug = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [cookies, setCookies] = useState('');
  const [apiTest, setApiTest] = useState(null);

  useEffect(() => {
    // Check cookies (though they won't show httpOnly cookies)
    setCookies(document.cookie || 'No accessible cookies (httpOnly)');
    
    // Test API call directly to /auth/me
    fetch('/api/auth/me', {
      credentials: 'include'
    })
    .then(async response => {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        setApiTest({ success: response.ok, status: response.status, data });
      } catch (e) {
        setApiTest({ success: false, status: response.status, error: `Invalid JSON: ${text.substring(0, 100)}...` });
      }
    })
    .catch(error => setApiTest({ success: false, error: error.message }));
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      background: 'black', 
      color: 'white', 
      padding: '10px', 
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <h4>Auth Debug</h4>
      <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
      <p><strong>IsAuthenticated:</strong> {isAuthenticated ? 'true' : 'false'}</p>
      <p><strong>User:</strong> {user ? user.email : 'null'}</p>
      <p><strong>Cookies:</strong> {cookies}</p>
      <p><strong>API Test:</strong> {apiTest ? JSON.stringify(apiTest, null, 2) : 'loading...'}</p>
    </div>
  );
};

export default AuthDebug;
