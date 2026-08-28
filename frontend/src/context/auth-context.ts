import { createContext } from 'react';
import type { Session, User, AuthResponse, OAuthResponse } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AuthResponse['data']>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResponse['data']>;
  signInWithGoogle: () => Promise<OAuthResponse['data']>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
