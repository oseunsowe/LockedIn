import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSeedDemoData } from '@/hooks/useSeedDemoData';
import { useUpdateDisplayName } from '@/hooks/useUpdateDisplayName';
import { useAuth } from '@/state/auth';
import { Icon, radius, semantic, space, type } from '@/theme';

/**
 * Account/Profile (distinct from Progress Profile — TODO.md §11's "Progress" tab covers level/XP/
 * achievements/stats; this tab is account identity and settings). Subscription status (Phase 12)
 * and notification preferences (Phase 13) aren't built yet, so this stays intentionally small
 * rather than padding it out with "Coming soon" rows that don't do anything — what's here (display
 * name, sign out) is real.
 */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session, profile, signOut, refreshProfile } = useAuth();
  const updateDisplayName = useUpdateDisplayName(session?.user.id);
  const seedDemoData = useSeedDemoData(session?.user.id);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  if (!profile) return null;

  const displayName = profile.display_name ?? session?.user.email?.split('@')[0] ?? 'there';

  function startEditingName() {
    setNameDraft(profile?.display_name ?? displayName);
    setIsEditingName(true);
  }

  async function saveName() {
    try {
      await updateDisplayName.mutateAsync(nameDraft);
      await refreshProfile();
      setIsEditingName(false);
    } catch {
      // updateDisplayName.isError renders inline below — nothing else to do here.
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xxxl },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Icon name="profile" size={36} color={semantic.text.secondary} />
        </View>

        {isEditingName ? (
          <View style={styles.editNameRow}>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your name"
              placeholderTextColor={semantic.text.tertiary}
              style={styles.nameInput}
              autoFocus
              maxLength={40}
            />
            <Pressable
              style={styles.nameActionButton}
              onPress={() => void saveName()}
              disabled={updateDisplayName.isPending}
            >
              {updateDisplayName.isPending ? (
                <ActivityIndicator color={semantic.text.onAccent} size="small" />
              ) : (
                <Text style={styles.nameActionLabel}>Save</Text>
              )}
            </Pressable>
            <Pressable style={styles.nameCancelButton} onPress={() => setIsEditingName(false)}>
              <Icon name="close" size={16} color={semantic.text.secondary} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.nameRow} onPress={startEditingName}>
            <Text style={styles.name}>{displayName}</Text>
            <Icon name="edit" size={16} color={semantic.text.tertiary} />
          </Pressable>
        )}
        {updateDisplayName.isError ? (
          <Text style={styles.nameError}>Couldn&rsquo;t save that name. Try again.</Text>
        ) : null}

        <Text style={styles.email}>{session?.user.email ?? 'Signed in with Apple'}</Text>
        <Text style={styles.meta}>
          {profile.identity_class ?? 'no class set'} · Level {profile.level}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TESTING</Text>
        <Pressable
          style={[styles.seedButton, seedDemoData.isPending ? styles.seedButtonDisabled : null]}
          onPress={() => seedDemoData.mutate()}
          disabled={seedDemoData.isPending}
        >
          {seedDemoData.isPending ? (
            <ActivityIndicator color={semantic.text.onAccent} />
          ) : (
            <Text style={styles.seedLabel}>Seed Demo Missions</Text>
          )}
        </Pressable>
        {seedDemoData.isSuccess ? (
          <Text style={styles.seedStatus}>
            {seedDemoData.data.inserted > 0
              ? `Added ${seedDemoData.data.inserted} new demo mission${seedDemoData.data.inserted === 1 ? '' : 's'} — check Dashboard/Missions/Progress/Insights.`
              : 'Already seeded — no new demo missions to add.'}
          </Text>
        ) : null}
        {seedDemoData.isError ? (
          <Text style={styles.seedStatusError}>Couldn&rsquo;t seed demo data. Try again.</Text>
        ) : null}
        <Text style={styles.seedNote}>
          Inserts real rows into your Supabase project under your own account. Remove before
          shipping.
        </Text>
      </View>

      <Pressable style={styles.signOutButton} onPress={() => void signOut()}>
        <Text style={styles.signOutLabel}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.bg.canvas,
  },
  content: {
    paddingHorizontal: space.xl,
    alignItems: 'center',
    gap: space.xxl,
  },
  header: {
    alignItems: 'center',
    gap: space.xs,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: semantic.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  name: {
    ...type.title,
    color: semantic.text.primary,
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    width: '100%',
  },
  nameInput: {
    ...type.bodyMedium,
    flex: 1,
    color: semantic.text.primary,
    backgroundColor: semantic.bg.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  nameActionButton: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: semantic.action.primary,
  },
  nameActionLabel: {
    ...type.bodyMedium,
    fontSize: 14,
    color: semantic.text.onAccent,
  },
  nameCancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semantic.bg.surface,
  },
  nameError: {
    ...type.caption,
    color: semantic.state.danger,
  },
  email: {
    ...type.bodyMedium,
    color: semantic.text.secondary,
    marginTop: space.sm,
  },
  meta: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
  section: {
    width: '100%',
    gap: space.sm,
    alignItems: 'center',
  },
  sectionLabel: {
    ...type.data,
    color: semantic.text.tertiary,
    alignSelf: 'flex-start',
  },
  seedButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: semantic.action.primary,
    width: '100%',
  },
  seedButtonDisabled: {
    opacity: 0.6,
  },
  seedLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
  seedStatus: {
    ...type.caption,
    color: semantic.state.success,
    textAlign: 'center',
  },
  seedStatusError: {
    ...type.caption,
    color: semantic.state.danger,
    textAlign: 'center',
  },
  seedNote: {
    ...type.caption,
    fontSize: 11,
    color: semantic.text.tertiary,
    textAlign: 'center',
  },
  signOutButton: {
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  signOutLabel: {
    ...type.bodyMedium,
    color: semantic.state.danger,
  },
});
