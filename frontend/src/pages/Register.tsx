import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { registerUser } from '../lib/api/auth';
import { extractErrorMessage } from '../lib/errors';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await registerUser({ email, password });
      setSuccess(true);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create that account.'));
    } finally {
      setIsSubmitting(false);
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
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-signal" />
              <h1 className="text-lg font-semibold text-ink">Account created</h1>
              <p className="text-sm text-ink-soft">
                Your account for <span className="font-medium">{email}</span> is ready. Log in to continue.
              </p>
              <Button className="mt-2 w-full" onClick={() => navigate('/login')}>
                Go to login
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-ink">Create an account</h1>
              <p className="mt-1 text-sm text-ink-soft">Start analyzing your first dataset in minutes.</p>

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
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-signal"
                    autoComplete="new-password"
                  />
                </div>

                {error && <p className="text-sm text-red">{error}</p>}

                <Button type="submit" isLoading={isSubmitting} className="w-full">
                  Create account
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-ink-soft">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-signal hover:underline">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
