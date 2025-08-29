import React, { useState } from 'react';
import { authService } from '../services/auth';

interface ResetPasswordModalProps {
  open: boolean;
  username: string; // email/username used at login
  oldPassword: string; // pre-fill old password if you want
  onSuccess: () => void; // called after successful reset
  onClose: () => void;  // close modal without resetting
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ open, username, oldPassword, onSuccess, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        username: username,
        oldpassword: oldPassword,
        newpassword: newPassword,
        confirmpassword: confirmPassword,
      };
      const result = await authService.resetPassword(payload);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Password reset failed');
      }
    } catch (err) {
      setError('Unexpected error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" style={backdropStyle}>
      <div className="modal-card" style={cardStyle}>
        <div className="modal-header" style={headerStyle}>
          <h3 style={{ margin: 0 }}>Reset Password</h3>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Username</label>
            <input type="text" value={username} disabled style={inputStyle} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Old Password</label>
            <input type="password" value={oldPassword} disabled style={inputStyle} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              style={inputStyle}
              required
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={inputStyle}
              required
            />
          </div>

          {error && <div style={errorStyle}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onClose} disabled={submitting} style={secondaryBtn}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={primaryBtn}>
              {submitting ? 'Saving...' : 'Save Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Simple inline styles to keep this self-contained
const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
};

const headerStyle: React.CSSProperties = {
  padding: '16px',
  borderBottom: '1px solid #eee'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#555',
  marginBottom: 6
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 6,
  border: '1px solid #ccc',
  outline: 'none'
};

const errorStyle: React.CSSProperties = {
  margin: '8px 0 12px',
  color: '#c62828'
};

const primaryBtn: React.CSSProperties = {
  background: '#1e88e5',
  color: '#fff',
  border: 'none',
  padding: '10px 16px',
  borderRadius: 6,
  cursor: 'pointer'
};

const secondaryBtn: React.CSSProperties = {
  background: '#eee',
  color: '#333',
  border: 'none',
  padding: '10px 16px',
  borderRadius: 6,
  cursor: 'pointer'
};

export default ResetPasswordModal;