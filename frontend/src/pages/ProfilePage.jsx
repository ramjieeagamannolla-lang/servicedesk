import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ROLE_LABELS } from '../utils/roles.js';
import { initials } from '../utils/format.js';
import api, { getErrorMessage } from '../api/axios.js';

export default function ProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      showToast('Password updated.', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-lg font-semibold text-ink">My Profile</h1>

      <div className="card p-5 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-brand-100 text-brand-700 font-semibold flex items-center justify-center text-lg shrink-0">
          {initials(user?.name)}
        </div>
        <div>
          <p className="font-medium text-ink">{user?.name}</p>
          <p className="text-sm text-ink-faint">{user?.email}</p>
          <p className="text-xs text-ink-faint mt-0.5">{ROLE_LABELS[user?.role]}</p>
        </div>
      </div>

      <form onSubmit={handleChangePassword} className="card p-5 space-y-3.5">
        <h3 className="font-semibold text-sm text-ink">Change Password</h3>
        <div>
          <label className="label">Current password</label>
          <input type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </div>
        <div>
          <label className="label">New password</label>
          <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
