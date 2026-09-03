import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Panel } from '../components/layout/Panel';
import { registerUser } from '../api/auth';
import axios from 'axios';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await registerUser({ email, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        const detail = err.response.data.detail;
        setError(typeof detail === 'string' ? detail : 'Registration failed.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during registration.');
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
            <h2 className="text-lg font-medium text-[var(--color-text-primary)]">Create Account</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Sign up to start managing datasets securely.</p>
          </div>

          {success ? (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded flex items-center gap-3 text-green-500">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p className="text-xs font-medium">Registration successful! Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
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
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Register
              </button>

              <p className="text-xs text-center text-[var(--color-text-secondary)] mt-4">
                Already have an account? <Link to="/login" className="text-[var(--color-brand-blue)] hover:underline font-medium">Sign in</Link>
              </p>
            </form>
          )}
        </Panel>
      </div>
    </div>
  );
}