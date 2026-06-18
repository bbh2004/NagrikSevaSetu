import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ChangePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match.');
    }

    try {
      setLoading(true);
      await api.post('/users/me/change-password', { newPassword: password });
      toast.success('Password updated successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-surface">
      <div className="max-w-md w-full bg-surface-variant p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Update Password</h2>
        <p className="text-on-surface-variant mb-6 text-sm">
          Your account was recently created by an administrator. You must set a new secure password to continue.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              className="w-full p-2 rounded bg-surface border border-primary/20 text-on-surface"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full p-2 rounded bg-surface border border-primary/20 text-on-surface"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-medium py-2 px-4 rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
