import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { Panel } from '../components/layout/Panel';
import { loginUser } from '../api/auth';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await loginUser({ email, password });
      navigate('/upload');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        const detail = err.response.data.detail;
        setError(typeof detail === 'string' ? detail : 'Invalid email or password.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-sans font-bold text-2xl text-[var(--color-text-primary)] tracking-tight mb-2">
            Insight<span className="text-[var(--color-brand-blue)]">Flow</span>
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] font-mono">Secure EDA & Cleaning Platform</p>
        </div>

        <Panel className="border border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] p-6 rounded-lg shadow-xl">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-[var(--color-text-primary)]">Sign In</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Access your secure analytical sessions and datasets.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">Email Address</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] rounded text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-brand-blue)] transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">Password</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] rounded text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-brand-blue)] transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-[var(--color-brand-red)]/10 border border-[var(--color-brand-red)]/20 rounded flex items-center gap-2 text-xs text-[var(--color-brand-red)]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-[var(--color-brand-blue)] hover:bg-blue-700 text-white rounded font-medium text-sm transition-colors disabled:opacity-70 shadow-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Sign In
            </button>

            <p className="text-xs text-center text-[var(--color-text-secondary)] mt-4">
              Don't have an account? <Link to="/register" className="text-[var(--color-brand-blue)] hover:underline font-medium">Register here</Link>
            </p>
          </form>
        </Panel>
      </div>
    </div>
  );
}