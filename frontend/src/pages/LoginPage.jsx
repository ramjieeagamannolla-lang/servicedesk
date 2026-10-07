import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wrench, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO_ACCOUNTS = [
  { role: 'System Admin', email: 'admin@demo.com', password: 'Admin@123' },
  { role: 'IT Manager', email: 'manager@demo.com', password: 'Manager@123' },
  { role: 'Technician', email: 'technician@demo.com', password: 'Tech@123' },
  { role: 'Employee', email: 'employee@demo.com', password: 'Employee@123' },
  { role: 'Asset Manager', email: 'asset@demo.com', password: 'Asset@123' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setError(res.message);
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-canvas">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="h-9 w-9 rounded-lg bg-brand-500 flex items-center justify-center">
              <Wrench size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-ink leading-tight">ServiceDesk Pro</p>
              <p className="text-xs text-ink-faint leading-tight">AI-Powered IT Helpdesk</p>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-ink mb-1">Welcome back</h1>
          <p className="text-sm text-ink-faint mb-6">Sign in to manage tickets, assets, and more.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-sm text-status-critical bg-status-criticalBg rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs font-medium text-ink-faint mb-2.5">Quick demo access</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => fillDemo(acc)}
                  type="button"
                  className="text-left px-3 py-2 rounded-lg border border-border hover:border-brand-400 hover:bg-brand-50 transition-colors"
                >
                  <span className="block text-xs font-medium text-ink">{acc.role}</span>
                  <span className="block text-[11px] text-ink-faint truncate">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-sidebar items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="relative max-w-md text-center">
          <p className="text-white text-2xl font-semibold leading-snug mb-3">
            One platform for tickets, assets, and IT operations.
          </p>
          <p className="text-sidebar-inkMuted text-sm leading-relaxed">
            AI-assisted triage, real SLA tracking, and an enterprise-grade asset lifecycle — built for support teams
            that move fast.
          </p>
        </div>
      </div>
    </div>
  );
}
