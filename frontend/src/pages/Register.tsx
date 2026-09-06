import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Panel } from '../components/layout/Panel';
import { registerUser } from '../api/auth';
import { supabase } from '../api/client';
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

  const handleGoogleLogin = async () => {
      setError(null);
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/upload`,
          },
        });
        if (error) setError(error.message);
      } catch (err: unknown) {
        setError('An unexpected error occurred with Google Sign-In.');
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

              <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 w-full py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] hover:bg-[var(--color-border-strong)] text-[var(--color-text-primary)] rounded font-medium text-sm transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.25 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.8 0 12s.43 3.9 1.19 5.42l4.09-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.25 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              Continue with Google
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