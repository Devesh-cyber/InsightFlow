import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { PageContainer } from '../components/layout/PageContainer';
import { Panel } from '../components/layout/Panel';
import { Loader2, LogIn, UserPlus, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    setError(null);
    if (!email.trim()) {
      setError('Email is required.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setError('Password is required.');
      return false;
    }
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      navigate('/overview');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Authentication failed. Please try again.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate('/overview');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Google authentication failed.');
      } else {
        setError('Google authentication failed.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-center min-h-[80vh]">
        <Panel className="w-full max-w-md p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              {isLogin 
                ? 'Sign in to access your InsightFlow workspace' 
                : 'Sign up to start analyzing your datasets'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-[var(--color-brand-red)]/10 border border-[var(--color-brand-red)]/20 rounded flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--color-brand-red)] shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--color-brand-red)] font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-[var(--color-text-muted)]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] text-[var(--color-text-primary)] rounded pl-10 pr-4 py-2 focus:outline-none focus:border-[var(--color-brand-blue)] transition-colors disabled:opacity-50"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-[var(--color-text-muted)]" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] text-[var(--color-text-primary)] rounded pl-10 pr-4 py-2 focus:outline-none focus:border-[var(--color-brand-blue)] transition-colors disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-[var(--color-text-muted)]" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] text-[var(--color-text-primary)] rounded pl-10 pr-4 py-2 focus:outline-none focus:border-[var(--color-brand-blue)] transition-colors disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-brand-blue)] hover:bg-blue-700 text-white rounded font-medium text-sm transition-colors disabled:opacity-50 disabled:hover:bg-[var(--color-brand-blue)] mt-6"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isLogin ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {isSubmitting 
                ? 'Processing...' 
                : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-[var(--color-border-strong)]"></div>
            <span className="px-3 text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Or</span>
            <div className="flex-1 border-t border-[var(--color-border-strong)]"></div>
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={isSubmitting}
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-bg-surface-hover)] hover:bg-[var(--color-border-strong)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] rounded font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
              disabled={isSubmitting}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-brand-blue)] transition-colors cursor-pointer"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </Panel>
      </div>
    </PageContainer>
  );
}
