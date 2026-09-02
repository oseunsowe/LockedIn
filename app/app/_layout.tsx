import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
import {
  Outfit_400Regular,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/state/auth';
import { semantic, space, type } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden or unsupported on this platform — safe to ignore.
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: semantic.bg.canvas }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthProvider>
          <AppGate fontsReady={fontsLoaded || !!fontError} />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Coordinates the two async readiness signals that gate the first real paint — fonts (local,
 * near-instant) and the initial Supabase session read (also local-storage-first, but still a
 * promise). Waiting for both before hiding the splash screen avoids a flash of the wrong screen
 * (TODO.md §3's "Splash → auth-state → route gate. No flash of the wrong screen.").
 */
function AppGate({ fontsReady }: { fontsReady: boolean }) {
  const { session, profile } = useAuth();
  // `session !== undefined` once the initial getSession() resolves. If a session exists, also
  // wait for its profile row to load — deciding the onboarding gate on a momentarily-null
  // profile would flash into onboarding and immediately back out once it arrives.
  const authReady =
    session === null || (session !== null && session !== undefined && profile !== null);
  const ready = fontsReady && authReady;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) return null;

  return <RootNavigator hasOnboarded={!!profile?.onboarding_completed_at} />;
}

/**
 * Root gate between the onboarding stack and the app tabs. `Stack.Protected` is SDK 57's
 * replacement for a manual `<Redirect>`-based auth gate — see node_modules/expo-router/build/
 * views/Protected.d.ts.
 */
function RootNavigator({ hasOnboarded }: { hasOnboarded: boolean }) {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: semantic.bg.canvas },
      }}
    >
      <Stack.Protected guard={!hasOnboarded}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={hasOnboarded}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
      <Stack.Screen name="design-preview" />
    </Stack>
  );
}

/** Route-level error boundary — see node_modules/expo-router/build/views/Try.d.ts for the contract. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <Pressable style={styles.retryButton} onPress={retry}>
        <Text style={styles.retryLabel}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: semantic.bg.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.md,
  },
  errorTitle: {
    ...type.title,
    color: semantic.text.primary,
  },
  errorMessage: {
    ...type.body,
    color: semantic.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    borderRadius: 999,
    backgroundColor: semantic.action.primary,
  },
  retryLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
});
