import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Switch,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { XpBar } from '@/components/XpBar';
import { useAchievements } from '@/hooks/useAchievements';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useSubscription } from '@/hooks/useSubscription';
import { useRemoveAvatar, useUploadAvatar } from '@/hooks/useUploadAvatar';
import { useUpdateDisplayName } from '@/hooks/useUpdateDisplayName';
import {
  DEMO_MODE_AVAILABLE,
  reshuffleDemoData,
  setDemoEnabled,
  useDemoMode,
} from '@/lib/demoMode';
import { rankForLevel } from '@/lib/leveling';
import { updateNotificationPrefs, useNotificationPrefs } from '@/lib/notificationPrefsStore';
import { getNotificationPermission, requestNotificationPermission } from '@/lib/notifications';
import { LEGAL_URL } from '@/lib/legal';
import { useAuth } from '@/state/auth';
import { fireHaptic, Icon, palette, radius, semantic, space, type, withAlpha } from '@/theme';

const tierLabel: Record<string, string> = { free: 'Free', pro: 'Pro', elite: 'Elite' };

function formatHour(hour: number): string {
  return `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
}

/** Compact +/- control for a whole-hour value, wrapping around the clock. */
function HourStepper({
  label,
  hour,
  onChange,
}: {
  label: string;
  hour: number;
  onChange: (hour: number) => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          style={styles.stepperButton}
          onPress={() => onChange((hour + 23) % 24)}
          accessibilityRole="button"
          accessibilityLabel={`Earlier ${label}`}
        >
          <Text style={styles.stepperGlyph}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue} accessibilityLabel={`${label} ${formatHour(hour)}`}>
          {formatHour(hour)}
        </Text>
        <Pressable
          style={styles.stepperButton}
          onPress={() => onChange((hour + 1) % 24)}
          accessibilityRole="button"
          accessibilityLabel={`Later ${label}`}
        >
          <Text style={styles.stepperGlyph}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Account/Profile (distinct from Progress Profile — TODO.md §11's "Progress" tab covers level/XP/
 * achievements/stats; this tab is account identity and settings). Notification preferences
 * (Phase 13) aren't built yet, so this stays intentionally small rather than padding it out with
 * "Coming soon" rows that don't do anything. Plan status (Phase 12) is real as far as it goes —
 * every account genuinely has a `tier` in `subscriptions`, and it genuinely gates AI verification/
 * screenshot-scan volume server-side — the Subscribe button on the Paywall it links to is the
 * part still disabled, pending a RevenueCat account and App Store Connect products. The "Seed Demo
 * Missions" testing button that used to live here is gone for good — see `useSeedDemoData`'s own
 * doc comment, which called for exactly this removal before shipping.
 */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session, profile, signOut, refreshProfile } = useAuth();
  const updateDisplayName = useUpdateDisplayName(session?.user.id);
  const deleteAccount = useDeleteAccount();
  const subscriptionQuery = useSubscription(session?.user.id);
  const achievementsQuery = useAchievements(session?.user.id);
  const uploadAvatar = useUploadAvatar(session?.user.id);
  const removeAvatar = useRemoveAvatar(session?.user.id);
  const demo = useDemoMode();
  const notificationPrefs = useNotificationPrefs();

  const [notificationsAllowed, setNotificationsAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    void getNotificationPermission().then(setNotificationsAllowed);
  }, []);

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

  const isAvatarBusy = uploadAvatar.isPending || removeAvatar.isPending;
  const achievements = achievementsQuery.data ?? [];
  const unlocked = achievements.filter((a) => a.unlocked);
  const recentUnlocks = unlocked.slice(0, 4);

  async function changeAvatar(source: 'library' | 'camera') {
    try {
      const url = await uploadAvatar.mutateAsync(source);
      if (url) {
        await refreshProfile();
        fireHaptic('missionComplete');
      }
    } catch {
      // uploadAvatar.isError renders inline below.
    }
  }

  async function clearAvatar() {
    try {
      await removeAvatar.mutateAsync();
      await refreshProfile();
    } catch {
      // removeAvatar.isError renders inline below.
    }
  }

  function openAvatarMenu() {
    fireHaptic('selectionTick');
    Alert.alert('Profile picture', undefined, [
      { text: 'Choose from library', onPress: () => void changeAvatar('library') },
      { text: 'Take a photo', onPress: () => void changeAvatar('camera') },
      ...(profile?.avatar_url
        ? [
            {
              text: 'Remove picture',
              style: 'destructive' as const,
              onPress: () => void clearAvatar(),
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }

  async function enableNotifications() {
    const granted = await requestNotificationPermission();
    setNotificationsAllowed(granted);
    if (granted) {
      fireHaptic('missionComplete');
    } else {
      Alert.alert(
        'Notifications are off',
        'Turn on notifications for LockedIn in your phone’s Settings to get reminders.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ],
      );
    }
  }

  /** Turning any reminder on is the moment to ask the OS for permission — never at launch. */
  async function toggleReminder(
    key: 'morningBrief' | 'deadlines' | 'streakAtRisk',
    value: boolean,
  ) {
    if (value && !(await getNotificationPermission())) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notifications are off',
          'Turn on notifications for LockedIn in your phone’s Settings to get reminders.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => void Linking.openSettings() },
          ],
        );
        return;
      }
    }
    fireHaptic('selectionTick');
    updateNotificationPrefs({ [key]: value });
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
        <Pressable
          onPress={openAvatarMenu}
          disabled={isAvatarBusy}
          style={styles.avatarPressable}
          accessibilityRole="button"
          accessibilityLabel="Change profile picture"
          accessibilityState={{ disabled: isAvatarBusy }}
        >
          <Avatar uri={profile.avatar_url} name={displayName} size={104} />
          <View style={styles.cameraBadge}>
            {isAvatarBusy ? (
              <ActivityIndicator size="small" color={semantic.text.onAccent} />
            ) : (
              <Icon name="camera" size={16} color={semantic.text.onAccent} />
            )}
          </View>
        </Pressable>
        {uploadAvatar.isError || removeAvatar.isError ? (
          <Text style={styles.nameError}>
            Couldn&rsquo;t update your picture
            {(uploadAvatar.error ?? removeAvatar.error)?.message
              ? `: ${(uploadAvatar.error ?? removeAvatar.error)?.message}`
              : '.'}
          </Text>
        ) : null}

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
        <View style={styles.rankChip}>
          <Icon name="streak" size={13} color={palette.gold} />
          <Text style={styles.rankChipLabel}>
            {rankForLevel(profile.level).toUpperCase()}
            {profile.identity_class ? ` · ${profile.identity_class.toUpperCase()}` : ''}
          </Text>
        </View>
        <View style={styles.xpBarWrap}>
          <XpBar totalXp={profile.xp_total} />
        </View>
      </View>

      <View style={styles.quickStats}>
        {[
          { label: 'Level', value: String(profile.level), icon: 'xp' as const },
          { label: 'Day streak', value: String(profile.streak_count), icon: 'streak' as const },
          {
            label: 'Total XP',
            value: profile.xp_total.toLocaleString(),
            icon: 'trending-up' as const,
          },
        ].map((stat) => (
          <Pressable
            key={stat.label}
            style={styles.quickStat}
            onPress={() => {
              fireHaptic('selectionTick');
              router.push('/(app)/progress');
            }}
            accessibilityRole="button"
            accessibilityLabel={`${stat.label} ${stat.value}. Open progress`}
          >
            <Icon name={stat.icon} size={16} color={palette.iris} />
            <Text style={styles.quickStatValue}>{stat.value}</Text>
            <Text style={styles.quickStatLabel}>{stat.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACHIEVEMENTS</Text>
        <Pressable
          style={styles.achievementsCard}
          onPress={() => router.push('/(app)/progress')}
          accessibilityRole="button"
          accessibilityLabel={`${unlocked.length} of ${achievements.length} achievements unlocked. Open progress`}
        >
          <View style={styles.achievementIcons}>
            {recentUnlocks.length === 0 ? (
              <Text style={styles.planRowSub}>Complete a mission to unlock your first badge.</Text>
            ) : (
              recentUnlocks.map((a) => (
                <View key={a.key} style={styles.achievementBubble}>
                  <Icon name={a.icon} size={20} color={palette.gold} />
                </View>
              ))
            )}
          </View>
          <Text style={styles.achievementCount}>
            {unlocked.length}/{achievements.length}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PLAN</Text>
        <Pressable
          style={styles.linkRow}
          onPress={() => router.push('/(modals)/paywall')}
          accessibilityRole="button"
          accessibilityLabel={`View plans — currently on ${tierLabel[subscriptionQuery.data?.tier ?? 'free']}`}
        >
          <View style={styles.planRowText}>
            <Text style={styles.linkLabel}>
              {tierLabel[subscriptionQuery.data?.tier ?? 'free']} Plan
            </Text>
            <Text style={styles.planRowSub}>See daily limits &amp; upgrade options</Text>
          </View>
          <Icon name="link" size={16} color={semantic.text.tertiary} />
        </Pressable>
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

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.demoCard}>
          {notificationsAllowed === false ? (
            <Pressable
              style={styles.shuffleButton}
              onPress={() => void enableNotifications()}
              accessibilityRole="button"
              accessibilityLabel="Enable notifications"
            >
              <Icon name="ai" size={16} color={palette.electric} />
              <Text style={styles.shuffleLabel}>Enable notifications</Text>
            </Pressable>
          ) : null}
          {(
            [
              {
                key: 'morningBrief',
                title: 'Morning brief',
                sub: 'Your missions for the day',
              },
              {
                key: 'deadlines',
                title: 'Deadline reminders',
                sub: 'An hour before a mission is due',
              },
              {
                key: 'streakAtRisk',
                title: 'Streak at risk',
                sub: 'Tonight, if today isn’t verified yet',
              },
            ] as const
          ).map((row) => (
            <View key={row.key} style={styles.demoRow}>
              <View style={styles.planRowText}>
                <Text style={styles.linkLabel}>{row.title}</Text>
                <Text style={styles.planRowSub}>{row.sub}</Text>
              </View>
              <Switch
                value={notificationPrefs[row.key]}
                onValueChange={(value) => void toggleReminder(row.key, value)}
                trackColor={{ true: palette.electric }}
                accessibilityLabel={row.title}
              />
            </View>
          ))}
          {notificationPrefs.morningBrief ? (
            <HourStepper
              label="Brief time"
              hour={notificationPrefs.morningHour}
              onChange={(hour) => updateNotificationPrefs({ morningHour: hour })}
            />
          ) : null}
          <View style={styles.demoRow}>
            <View style={styles.planRowText}>
              <Text style={styles.linkLabel}>Quiet hours</Text>
              <Text style={styles.planRowSub}>No reminders during this window</Text>
            </View>
            <Switch
              value={notificationPrefs.quietHoursEnabled}
              onValueChange={(value) => updateNotificationPrefs({ quietHoursEnabled: value })}
              trackColor={{ true: palette.electric }}
              accessibilityLabel="Quiet hours"
            />
          </View>
          {notificationPrefs.quietHoursEnabled ? (
            <>
              <HourStepper
                label="From"
                hour={notificationPrefs.quietStartHour}
                onChange={(hour) => updateNotificationPrefs({ quietStartHour: hour })}
              />
              <HourStepper
                label="Until"
                hour={notificationPrefs.quietEndHour}
                onChange={(hour) => updateNotificationPrefs({ quietEndHour: hour })}
              />
            </>
          ) : null}
        </View>
      </View>

      {DEMO_MODE_AVAILABLE ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DEMO MODE</Text>
          <View style={styles.demoCard}>
            <View style={styles.demoRow}>
              <View style={styles.planRowText}>
                <Text style={styles.linkLabel}>Simulated data</Text>
                <Text style={styles.planRowSub}>
                  Fills Home, Missions, Progress and Insights with generated data for screenshots.
                  Display only — nothing is written to your account.
                </Text>
              </View>
              <Switch
                value={demo.enabled}
                onValueChange={(value) => {
                  fireHaptic('selectionTick');
                  setDemoEnabled(value);
                }}
                trackColor={{ true: palette.electric }}
                accessibilityLabel="Demo mode"
              />
            </View>
            {demo.enabled ? (
              <Pressable
                style={styles.shuffleButton}
                onPress={() => {
                  fireHaptic('selectionTick');
                  reshuffleDemoData();
                }}
                accessibilityRole="button"
                accessibilityLabel="Shuffle demo data"
              >
                <Icon name="failed" size={16} color={palette.electric} />
                <Text style={styles.shuffleLabel}>Shuffle demo data</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

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
  avatarPressable: {
    marginBottom: space.sm,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: semantic.action.primary,
    borderWidth: 3,
    borderColor: semantic.bg.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: space.xs,
    paddingVertical: 4,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(palette.gold, 0.14),
  },
  rankChipLabel: {
    ...type.data,
    color: palette.gold,
  },
  xpBarWrap: {
    width: '100%',
    marginTop: space.sm,
  },
  quickStats: {
    flexDirection: 'row',
    gap: space.sm,
    width: '100%',
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: space.md,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  quickStatValue: {
    ...type.title,
    fontSize: 20,
    color: semantic.text.primary,
  },
  quickStatLabel: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
  achievementsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  achievementIcons: {
    flexDirection: 'row',
    gap: space.sm,
    flex: 1,
  },
  achievementBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: withAlpha(palette.gold, 0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementCount: {
    ...type.title,
    fontSize: 18,
    color: semantic.text.secondary,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperLabel: {
    ...type.body,
    color: semantic.text.secondary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: semantic.glass.fill8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperGlyph: {
    ...type.title,
    fontSize: 20,
    color: semantic.text.primary,
  },
  stepperValue: {
    ...type.bodyMedium,
    minWidth: 78,
    textAlign: 'center',
    color: semantic.text.primary,
  },
  demoCard: {
    width: '100%',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: withAlpha(palette.electric, 0.4),
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(palette.electric, 0.14),
  },
  shuffleLabel: {
    ...type.bodyMedium,
    fontSize: 14,
    color: palette.electric,
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
  planRowText: {
    gap: 2,
  },
  planRowSub: {
    ...type.caption,
    fontSize: 12,
    color: semantic.text.tertiary,
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
