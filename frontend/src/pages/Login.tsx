import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LineChart } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../lib/api/auth';
import { supabase } from '../lib/supabaseClient';
import { extractErrorMessage } from '../lib/errors';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/upload';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await loginUser({ email, password });
      await setSession(res.access_token, res.refresh_token, email);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not log in with those credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/upload` },
      });
      if (oauthError) throw oauthError;
      // Browser will redirect to Google; nothing more to do here.
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not start Google sign-in.'));
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <LineChart className="h-6 w-6 text-signal" />
          <span className="text-lg font-semibold tracking-tight text-ink">InsightFlow</span>
        </div>

        <div className="rounded-md border border-line bg-surface p-6">
          <h1 className="text-lg font-semibold text-ink">Log in</h1>
          <p className="mt-1 text-sm text-ink-soft">Understand and clean your datasets with confidence.</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-xs font-medium text-ink-soft">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-signal"
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-xs font-medium text-ink-soft">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-signal"
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-sm text-red">{error}</p>}

            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Log in
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-ink-faint">or</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => void handleGoogleLogin()}
            isLoading={isGoogleLoading}
          >
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-ink-soft">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-signal hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
