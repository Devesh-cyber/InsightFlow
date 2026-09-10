import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AUTH_EXPIRED_EVENT } from '../lib/api/client';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  userEmail: string | null;
  setSession: (accessToken: string, refreshToken: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'insightflow_access_token';
const EMAIL_KEY = 'insightflow_user_email';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem(TOKEN_KEY));
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem(EMAIL_KEY));
  const [isLoading, setIsLoading] = useState(true);

  const applySession = (accessToken: string, email: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(EMAIL_KEY, email);
    setIsAuthenticated(true);
    setUserEmail(email);
  };

  // Hydrates the Supabase SDK's own session (not just our local token copy)
  // so it can transparently refresh the access token in the background,
  // including for the email/password flow which goes through our backend
  // rather than calling the Supabase client directly.
  const setSession = async (accessToken: string, refreshToken: string, email: string) => {
    if (refreshToken) {
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    }
    applySession(accessToken, email);
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      clearSession();
    }
  };

  useEffect(() => {
    // Mirror Supabase's own session state (covers the Google OAuth
    // redirect flow, and keeps us in sync if the Supabase SDK silently
    // refreshes a token in the background).
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (session?.access_token && session.user?.email) {
        applySession(session.access_token, session.user.email);
      }
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearSession();
        return;
      }
      if (session?.access_token && session.user?.email) {
        applySession(session.access_token, session.user.email);
      }
    });

    const handleExpired = () => {
      clearSession();
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userEmail, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
