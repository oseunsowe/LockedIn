// Side-effect imports — order matters, both must run before createClient().
// react-native-url-polyfill: RN's JS engine lacks a full URL implementation supabase-js needs.
import 'react-native-url-polyfill/auto';
// expo-sqlite/localStorage/install: installs a global `localStorage` backed by SQLite on native
// (no-op on web, where the browser's own localStorage is used). This is the current official
// Expo guidance (docs.expo.dev/guides/using-supabase), and deliberately NOT expo-secure-store —
// SecureStore is backed by the iOS Keychain, whose items are practically capped around 2KB,
// smaller than a Supabase session (JWT + refresh token + metadata). SQLite has no such limit and
// avoids needing a custom chunked-encryption storage adapter to work around it.
import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy app/.env.example ' +
      'to app/.env.local and fill in a real Supabase project (Project Settings → API → Publishable key — ' +
      'not the legacy anon key; see TODO.md §4.1). Nothing in this app can talk to the backend until then.',
  );
}

/**
 * The publishable key (`sb_publishable_...`) replaces the legacy anon key — same low privilege
 * level, same RLS behavior, safe to ship in the client bundle. Legacy anon/service_role keys are
 * being retired industry-wide in late 2026; a new project should use the new key types from day
 * one rather than adopting something already being phased out.
 */
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No page URL to parse on native — the app never receives a session via a URL fragment.
    detectSessionInUrl: false,
  },
});

// Ties token refresh to the app's foreground/background state instead of refreshing while
// backgrounded (wasted work) or letting the token silently expire while foregrounded.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
