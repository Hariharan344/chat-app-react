import React, { useState } from 'react';
import { authService } from '../services/auth';
import { apiService } from '../services/api';
import { httpClient } from '../services/httpClient';

const AuthTest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const loginResult = await authService.login(email, password);
      
      if (loginResult.success) {
        setResult(`✅ Login successful!\nUser: ${loginResult.user?.name}\nID: ${loginResult.user?.id}`);
      } else {
        setResult(`❌ Login failed: ${loginResult.error}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestAPI = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const users = await apiService.getUsers();
      setResult(`✅ API call successful!\nLoaded ${users.length} users:\n${users.map(u => `- ${u.name} (${u.id})`).join('\n')}`);
    } catch (error) {
      setResult(`❌ API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setResult('✅ Logged out successfully');
    setEmail('');
    setPassword('');
  };

  const handleCheckAuth = () => {
    const isLoggedIn = authService.isLoggedIn();
    const currentUser = authService.getCurrentUser();
    const authData = authService.getAuthData();
    
    if (isLoggedIn && currentUser && authData) {
      setResult(`✅ User is authenticated:
Name: ${currentUser.name}
ID: ${currentUser.id}
Role: ${authData.role}
Token: ${authData.accesstoken.substring(0, 20)}...`);
    } else {
      setResult('❌ User is not authenticated');
    }
  };

  const isAuthenticated = authService.isLoggedIn();

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Authentication Test Component</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Current Status</h3>
        <p>Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
        {isAuthenticated && (
          <p>User: {authService.getCurrentUserName()} (ID: {authService.getCurrentUserId()})</p>
        )}
      </div>

      {!isAuthenticated ? (
        <div style={{ marginBottom: '20px' }}>
          <h3>Login</h3>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginRight: '10px', padding: '8px' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginRight: '10px', padding: '8px' }}
            />
            <button 
              onClick={handleLogin} 
              disabled={loading || !email || !password}
              style={{ padding: '8px 16px' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <h3>Actions</h3>
          <button 
            onClick={handleTestAPI} 
            disabled={loading}
            style={{ marginRight: '10px', padding: '8px 16px' }}
          >
            {loading ? 'Testing...' : 'Test API Call'}
          </button>
          <button 
            onClick={handleCheckAuth}
            style={{ marginRight: '10px', padding: '8px 16px' }}
          >
            Check Auth Status
          </button>
          <button 
            onClick={handleLogout}
            style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white' }}
          >
            Logout
          </button>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Result</h3>
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            fontSize: '14px'
          }}>
            {result}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <h4>How to use:</h4>
        <ol>
          <li>Enter your backend email and password</li>
          <li>Click "Login" to authenticate with the backend</li>
          <li>Once logged in, click "Test API Call" to test authenticated requests</li>
          <li>Check browser's localStorage to see stored tokens</li>
          <li>All API calls will automatically include the Authorization header</li>
        </ol>
      </div>
    </div>
  );
};

export default AuthTest;