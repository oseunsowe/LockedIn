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
  signInWithGoogle: () => Promise<AuthResult>;
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

    // Keeps the streak day-boundary timezone-correct (TODO.md §9's "timezone-correct day
    // boundary") without a dedicated settings screen — synced opportunistically on every profile
    // load, skipping the round trip once it's already current, which is the common case.
    let deviceTimezone = 'UTC';
    try {
      deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      // Hermes without full ICU data, or an unexpected platform — fall back to UTC rather than
      // let a timezone lookup failure break profile loading.
    }
    if (data.timezone !== deviceTimezone) {
      const { error: tzError } = await supabase
        .from('profiles')
        .update({ timezone: deviceTimezone })
        .eq('id', userId);
      if (!tzError) {
        setProfile((prev) => (prev ? { ...prev, timezone: deviceTimezone } : prev));
      }
    }
  }

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        if (data.session) void loadProfile(data.session.user.id);
      })
      .catch((err) => {
        // No .catch() here previously meant a rejected getSession() (network hiccup, a storage
        // read failure from the localStorage polyfill on first cold start, anything) left
        // `session` stuck at its initial `undefined` forever — which the root layout's AppGate
        // reads as "still resolving," so the splash screen never hides. Infinite hang, no error
        // shown. Degrade to signed-out instead of hanging: the user can always try signing in
        // again, which is a far better failure mode than staring at a stuck splash screen.
        console.error('getSession() failed, treating as signed out:', err);
        setSession(null);
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
      async signInWithGoogle() {
        // @react-native-google-signin/google-signin is a native module — no Expo Go support,
        // needs a dev-client build (TODO.md §17.1). Dynamic import matches signInWithApple's own
        // pattern above. Not verified end to end in this environment: no dev-client build exists
        // yet, and EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID isn't set to a real Google Cloud OAuth client
        // (see .env.example's note on registering both a web client and an Android client with
        // this app's SHA-1 fingerprint under the same project).
        const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
        if (!webClientId) {
          return { error: 'Google sign-in is not configured yet.' };
        }
        const { GoogleSignin, isSuccessResponse } =
          await import('@react-native-google-signin/google-signin');
        try {
          GoogleSignin.configure({ webClientId });
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
          const response = await GoogleSignin.signIn();
          if (!isSuccessResponse(response)) {
            return { error: null }; // user dismissed the sheet — not a real error
          }
          const idToken = response.data.idToken;
          if (!idToken) {
            return { error: 'Google did not return an identity token.' };
          }
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
          });
          return { error: error?.message ?? null };
        } catch (err) {
          return { error: err instanceof Error ? err.message : 'Google sign-in failed.' };
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
