import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { radius, semantic, space, type } from '@/theme';

/**
 * The one auth screen for the whole onboarding flow — TODO.md §5.5: "Place it after the value
 * is shown (post-step-4), not before step 1." Deliberately not verified end to end in this
 * environment: Apple sign-in needs a real device + Apple Developer account + the Supabase
 * project's Apple OAuth provider configured; email auth needs a live Supabase project. Both are
 * wired correctly against the real APIs (verified via the installed package's own .d.ts files,
 * not guessed), but "compiles and calls the right functions" is not the same as "confirmed
 * working" — confirm on a real device against a real project before trusting this in production.
 */
export default function Auth() {
  const insets = useSafeAreaInsets();
  const { signInWithApple, signInWithGoogle, signInWithEmail, signUpWithEmail, session } =
    useAuth();
  const { identityClass, selectedCampaigns } = useOnboardingDraft();

  const [appleAvailable, setAppleAvailable] = useState(false);
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signUp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  // Once a session exists, persist the onboarding draft and hand off to the root gate.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function finishOnboarding() {
      if (!session) return;
      const userId = session.user.id;

      if (identityClass) {
        await supabase.from('profiles').update({ identity_class: identityClass }).eq('id', userId);
      }
      if (selectedCampaigns.size > 0) {
        await supabase.from('user_campaigns').insert(
          Array.from(selectedCampaigns).map((campaign_key) => ({
            user_id: userId,
            campaign_key,
          })),
        );
      }
      await supabase
        .from('profiles')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', userId);

      // The root layout's Stack.Protected guard re-evaluates against the now-onboarded
      // profile and swaps in the (app) tabs — this replace just re-triggers that evaluation.
      if (!cancelled) router.replace('/');
    }

    void finishOnboarding();
    return () => {
      cancelled = true;
    };
  }, [session, identityClass, selectedCampaigns]);

  async function handleApple() {
    setError(null);
    const { error: err } = await signInWithApple();
    if (err) setError(err);
  }

  async function handleGoogle() {
    setError(null);
    const { error: err } = await signInWithGoogle();
    if (err) setError(err);
  }

  async function handleEmailSubmit() {
    setError(null);
    setSubmitting(true);
    const { error: err } =
      mode === 'signUp'
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);
    setSubmitting(false);
    if (err) setError(err);
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + space.xxxl, paddingBottom: insets.bottom + space.xl },
      ]}
    >
      <View>
        <Text style={styles.title}>Lock in your progress</Text>
        <Text style={styles.subtitle}>
          Create an account so your missions and XP are never lost.
        </Text>
      </View>

      <View style={styles.form}>
        {appleAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={radius.pill}
            style={styles.appleButton}
            onPress={handleApple}
          />
        ) : null}

        <Pressable
          style={styles.googleButton}
          onPress={handleGoogle}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
        >
          <Text style={styles.googleButtonLabel}>Continue with Google</Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={semantic.text.tertiary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={semantic.text.tertiary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={styles.submitButton}
          onPress={handleEmailSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel={mode === 'signUp' ? 'Create account' : 'Sign in'}
          accessibilityState={{ disabled: submitting }}
        >
          <Text style={styles.submitLabel}>
            {submitting ? 'Please wait…' : mode === 'signUp' ? 'Create Account' : 'Sign In'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode(mode === 'signUp' ? 'signIn' : 'signUp')}
          accessibilityRole="button"
          accessibilityLabel={mode === 'signUp' ? 'Switch to sign in' : 'Switch to sign up'}
        >
          <Text style={styles.switchModeLabel}>
            {mode === 'signUp'
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.bg.canvas,
    paddingHorizontal: space.xl,
    justifyContent: 'space-between',
  },
  title: {
    ...type.display,
    color: semantic.text.primary,
    marginBottom: space.xs,
  },
  subtitle: {
    ...type.body,
    color: semantic.text.secondary,
  },
  form: {
    gap: space.md,
  },
  appleButton: {
    height: 50,
  },
  googleButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: semantic.border.strong,
    backgroundColor: semantic.bg.surface,
  },
  googleButtonLabel: {
    ...type.bodyMedium,
    color: semantic.text.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: semantic.border.subtle,
  },
  dividerLabel: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
  input: {
    ...type.body,
    color: semantic.text.primary,
    backgroundColor: semantic.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  error: {
    ...type.caption,
    color: semantic.state.danger,
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.lg,
    borderRadius: radius.pill,
    backgroundColor: semantic.action.primary,
  },
  submitLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
  switchModeLabel: {
    ...type.caption,
    color: semantic.text.secondary,
    textAlign: 'center',
  },
});
