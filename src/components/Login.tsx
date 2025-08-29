import { useState } from 'react';
import { authService } from '../services/auth';
import type { User } from '../types/chat';
import ResetPasswordModal from './ResetPasswordModal';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mustChangePwd, setMustChangePwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authService.login(email, password);
      
      if (result.success && result.user) {
        if (result.mustChangePassword) {
          // Block app navigation and force password reset
          setMustChangePwd(true);
        } else {
          onLogin(result.user);
        }
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSuccess = async () => {
    setMustChangePwd(false);
    // After password reset, user tokens are set; attempt to get current user
    const user = authService.getCurrentUser();
    if (user) {
      onLogin(user);
      return;
    }
    // If not set, re-try login with new password (user will type again next time)
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Chat App</h1>
          <p>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>

      <ResetPasswordModal
        open={mustChangePwd}
        username={email}
        oldPassword={password}
        onSuccess={handleResetSuccess}
        onClose={() => setMustChangePwd(false)}
      />
    </div>
  );
};

export default Login;