import { Pressable, StyleSheet, Text } from 'react-native';

import { StubScreen } from '@/components/StubScreen';
import { useAuth } from '@/state/auth';
import { semantic, space, type } from '@/theme';

export default function ProfileStub() {
  const { session, profile, signOut } = useAuth();

  return (
    <StubScreen
      icon="profile"
      title="Profile"
      phase="PHASE 11 — NOT BUILT"
      description="Account, subscription status, settings — not built. Sign out below is real."
    >
      <Text style={styles.email}>{session?.user.email ?? 'Signed in with Apple'}</Text>
      <Text style={styles.meta}>
        {profile?.identity_class ?? 'no class set'} · Level {profile?.level ?? 1}
      </Text>
      <Pressable style={styles.signOutButton} onPress={() => void signOut()}>
        <Text style={styles.signOutLabel}>Sign Out</Text>
      </Pressable>
    </StubScreen>
  );
}

const styles = StyleSheet.create({
  email: {
    ...type.bodyMedium,
    color: semantic.text.primary,
    marginTop: space.lg,
  },
  meta: {
    ...type.caption,
    color: semantic.text.tertiary,
    marginTop: space.xs,
    marginBottom: space.lg,
  },
  signOutButton: {
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    borderRadius: 999,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  signOutLabel: {
    ...type.bodyMedium,
    color: semantic.state.danger,
  },
});
