import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthResult = { error: string | null };

type AuthState = {
  /** `undefined` while the initial session is still being resolved from storage. */
  session: Session | null | undefined;
  /** The signed-in user's profile row. `null` until loaded, even if `session` is set. */
  profile: Profile | null;
  signInWithApple: () => Promise<AuthResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
      // The on_auth_user_created trigger (supabase/migrations) should have already created this
      // row — a missing profile here means the trigger didn't run, not a normal "not found".
      console.error('Failed to load profile:', error.message);
      return;
    }
    setProfile(data);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) void loadProfile(data.session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        void loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      async signInWithApple() {
        // expo-apple-authentication only works on physical iOS (13+) — guard with
        // AppleAuthentication.isAvailableAsync() at the call site before showing this option.
        // Not verified end to end in this environment: no Apple Developer account, no device,
        // and the Supabase project's Apple OAuth provider isn't configured yet (TODO.md §4.1).
        const AppleAuthentication = await import('expo-apple-authentication');
        try {
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });
          if (!credential.identityToken) {
            return { error: 'Apple did not return an identity token.' };
          }
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'apple',
            token: credential.identityToken,
          });
          return { error: error?.message ?? null };
        } catch (err) {
          if (
            err &&
            typeof err === 'object' &&
            'code' in err &&
            err.code === 'ERR_REQUEST_CANCELED'
          ) {
            return { error: null }; // user dismissed the sheet — not a real error
          }
          return { error: err instanceof Error ? err.message : 'Apple sign-in failed.' };
        }
      },
      async signInWithEmail(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      async signUpWithEmail(email, password) {
        const { error } = await supabase.auth.signUp({ email, password });
        return { error: error?.message ?? null };
      },
      async signOut() {
        await supabase.auth.signOut();
      },
      async refreshProfile() {
        if (session) await loadProfile(session.user.id);
      },
    }),
    [session, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
