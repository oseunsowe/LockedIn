import Constants from 'expo-constants';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useUpdateDisplayName } from '@/hooks/useUpdateDisplayName';
import { useAuth } from '@/state/auth';
import { Icon, radius, semantic, space, type } from '@/theme';

// Hash-routed tabs on the same hosted legal doc (Privacy Policy default, Terms via #terms) — see
// TODO.md §16's "Privacy policy + terms (hosted, linked in-app)."
const LEGAL_URL = 'https://claude.ai/code/artifact/9c10254e-de96-4f53-9e13-30086553c71f';

/**
 * Account/Profile (distinct from Progress Profile — TODO.md §11's "Progress" tab covers level/XP/
 * achievements/stats; this tab is account identity and settings). Subscription status (Phase 12)
 * and notification preferences (Phase 13) aren't built yet, so this stays intentionally small
 * rather than padding it out with "Coming soon" rows that don't do anything — what's here (display
 * name, legal links, account deletion, sign out) is real. The "Seed Demo Missions" testing button
 * that used to live here is gone for good — see `useSeedDemoData`'s own doc comment, which called
 * for exactly this removal before shipping.
 */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session, profile, signOut, refreshProfile } = useAuth();
  const updateDisplayName = useUpdateDisplayName(session?.user.id);
  const deleteAccount = useDeleteAccount();

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

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete Account?',
      'This permanently deletes your account, missions, proof history, and XP. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => deleteAccount.mutate(),
        },
      ],
    );
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
              accessibilityRole="button"
              accessibilityLabel="Save name"
              accessibilityState={{ disabled: updateDisplayName.isPending }}
            >
              {updateDisplayName.isPending ? (
                <ActivityIndicator color={semantic.text.onAccent} size="small" />
              ) : (
                <Text style={styles.nameActionLabel}>Save</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.nameCancelButton}
              onPress={() => setIsEditingName(false)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Cancel editing name"
            >
              <Icon name="close" size={16} color={semantic.text.secondary} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.nameRow}
            onPress={startEditingName}
            accessibilityRole="button"
            accessibilityLabel="Edit name"
          >
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
        <Text style={styles.sectionLabel}>LEGAL</Text>
        <View style={styles.linkList}>
          <Pressable
            style={styles.linkRow}
            onPress={() => void Linking.openURL(`${LEGAL_URL}#privacy`)}
            accessibilityRole="link"
            accessibilityLabel="Open Privacy Policy"
          >
            <Text style={styles.linkLabel}>Privacy Policy</Text>
            <Icon name="link" size={16} color={semantic.text.tertiary} />
          </Pressable>
          <Pressable
            style={styles.linkRow}
            onPress={() => void Linking.openURL(`${LEGAL_URL}#terms`)}
            accessibilityRole="link"
            accessibilityLabel="Open Terms of Service"
          >
            <Text style={styles.linkLabel}>Terms of Service</Text>
            <Icon name="link" size={16} color={semantic.text.tertiary} />
          </Pressable>
        </View>
      </View>

      <Pressable
        style={styles.signOutButton}
        onPress={() => void signOut()}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Text style={styles.signOutLabel}>Sign Out</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DANGER ZONE</Text>
        <Pressable
          style={[
            styles.deleteButton,
            deleteAccount.isPending ? styles.deleteButtonDisabled : null,
          ]}
          onPress={confirmDeleteAccount}
          disabled={deleteAccount.isPending}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
          accessibilityState={{ disabled: deleteAccount.isPending }}
        >
          {deleteAccount.isPending ? (
            <ActivityIndicator color={semantic.state.danger} />
          ) : (
            <Text style={styles.deleteLabel}>Delete Account</Text>
          )}
        </Pressable>
        {deleteAccount.isError ? (
          <Text style={styles.deleteError}>Couldn&rsquo;t delete your account. Try again.</Text>
        ) : null}
        <Text style={styles.deleteNote}>
          Permanently removes your account, missions, proof history, and XP. This can&rsquo;t be
          undone.
        </Text>
      </View>

      <Text style={styles.versionText}>LockedIn {Constants.expoConfig?.version ?? ''}</Text>
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
  linkList: {
    width: '100%',
    gap: space.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.tile,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  linkLabel: {
    ...type.bodyMedium,
    color: semantic.text.primary,
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
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: semantic.state.danger,
    width: '100%',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteLabel: {
    ...type.bodyMedium,
    color: semantic.state.danger,
  },
  deleteError: {
    ...type.caption,
    color: semantic.state.danger,
    textAlign: 'center',
  },
  deleteNote: {
    ...type.caption,
    fontSize: 11,
    color: semantic.text.tertiary,
    textAlign: 'center',
  },
  versionText: {
    ...type.data,
    fontSize: 11,
    color: semantic.text.tertiary,
  },
});
