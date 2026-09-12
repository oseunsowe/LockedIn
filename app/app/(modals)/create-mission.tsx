import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DifficultyMeter } from '@/components/DifficultyMeter';
import { useCreateMission } from '@/hooks/useCreateMission';
import { useUserCampaigns } from '@/hooks/useUserCampaigns';
import type { MissionDifficulty, MissionType, ProofType } from '@/lib/database.types';
import {
  allProofTypes,
  defaultXpForDifficulty,
  difficultyMeta,
  proofTypeIcon,
  proofTypeLabel,
} from '@/lib/missions';
import { useAuth } from '@/state/auth';
import {
  campaigns,
  type CampaignKey,
  glow,
  gradients,
  Icon,
  type IconName,
  IconTile,
  palette,
  radius,
  semantic,
  space,
  type,
  withAlpha,
} from '@/theme';

type DeadlineOption = { key: string; label: string; iso: string | null };

/** Quick deadline presets, computed at render time (wall-clock, not stored) — avoids pulling in a
 * native date-picker dependency just for this one field, and matches §7.2's "avoid forms" brief
 * better than a calendar widget would anyway. */
function buildDeadlineOptions(): DeadlineOption[] {
  const at9pm = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(21, 0, 0, 0);
    return copy;
  };
  const now = new Date();
  const tonight = at9pm(now);
  const tomorrow = at9pm(new Date(now.getTime() + 24 * 60 * 60 * 1000));
  const in3Days = at9pm(new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000));
  const nextWeek = at9pm(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));

  const options: DeadlineOption[] = [];
  if (tonight > now) options.push({ key: 'tonight', label: 'Tonight', iso: tonight.toISOString() });
  options.push({ key: 'tomorrow', label: 'Tomorrow', iso: tomorrow.toISOString() });
  options.push({ key: '3days', label: 'In 3 Days', iso: in3Days.toISOString() });
  options.push({ key: 'week', label: 'This Week', iso: nextWeek.toISOString() });
  options.push({ key: 'none', label: 'No Deadline', iso: null });
  return options;
}

const missionTypeMeta: Record<MissionType, { icon: IconName; label: string }> = {
  main: { icon: 'mainQuest', label: 'Main Quest' },
  side: { icon: 'side', label: 'Side Mission' },
  daily: { icon: 'daily', label: 'Daily Challenge' },
};

const difficultyOrder: MissionDifficulty[] = ['standard', 'challenging', 'hard', 'epic'];

const XP_STEP = 50;
const XP_MIN = 50;
const XP_MAX = 5000;

/**
 * Manual mission creation (TODO.md §7.2). Template and AI-generate entry modes are shown (the
 * spec's segmented control) but disabled — templates need seeded per-campaign data and AI-generate
 * needs the server-side Claude proxy, neither of which exist yet (Phase 8/10). "Accountability
 * level" from the spec is cut here too: there's no schema column or defined semantics for it
 * (see TODO.md §7.2) — adding a chip with nothing behind it would be decoration, not a feature.
 */
export default function CreateMissionModal() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userCampaignsQuery = useUserCampaigns(session?.user.id);
  const createMission = useCreateMission(session?.user.id);

  const [title, setTitle] = useState('');
  const [missionType, setMissionType] = useState<MissionType>('side');
  const [campaignKey, setCampaignKey] = useState<CampaignKey | null>(null);
  const [difficulty, setDifficulty] = useState<MissionDifficulty>('standard');
  const [deadlineKey, setDeadlineKey] = useState('tomorrow');
  const [proofTypes, setProofTypes] = useState<ReadonlySet<ProofType>>(new Set());
  // `null` = "follow the difficulty's suggested reward"; a number once the user overrides it by
  // hand, at which point switching difficulty no longer clobbers a value they chose deliberately.
  const [customXp, setCustomXp] = useState<number | null>(null);
  const xpReward = customXp ?? defaultXpForDifficulty[difficulty];

  const deadlineOptions = useMemo(() => buildDeadlineOptions(), []);

  const goalOptions = (
    userCampaignsQuery.data && userCampaignsQuery.data.length > 0
      ? userCampaignsQuery.data
      : (Object.keys(campaigns) as CampaignKey[])
  ) as CampaignKey[];

  function toggleProofType(proofType: ProofType) {
    setProofTypes((prev) => {
      const next = new Set(prev);
      if (next.has(proofType)) next.delete(proofType);
      else next.add(proofType);
      return next;
    });
  }

  const canSubmit = title.trim().length > 0 && !createMission.isPending;

  async function handleSubmit() {
    if (!canSubmit) return;
    const deadline = deadlineOptions.find((o) => o.key === deadlineKey)?.iso ?? null;
    try {
      await createMission.mutateAsync({
        title: title.trim(),
        type: missionType,
        campaign_key: campaignKey,
        difficulty,
        xp_reward: xpReward,
        proof_requirements: Array.from(proofTypes).map((t) => ({ type: t })),
        deadline,
      });
      router.back();
    } catch {
      // createMission.isError renders the inline error banner below — nothing else to do here.
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.closeButton, { top: insets.top + space.sm }]}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Icon name="close" size={18} color={semantic.text.secondary} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.xxl, paddingBottom: space.xxxl },
        ]}
      >
        <Text style={styles.title}>Configure Your Mission</Text>
        <Text style={styles.subtitle}>Chips, not forms. Set it up like a challenge.</Text>

        <View style={styles.entryModeRow}>
          <View style={[styles.entryModeChip, styles.entryModeChipActive]}>
            <Text style={styles.entryModeLabelActive}>Manual</Text>
          </View>
          <View style={[styles.entryModeChip, styles.entryModeChipDisabled]}>
            <Text style={styles.entryModeLabelDisabled}>Template</Text>
            <Text style={styles.soonBadge}>SOON</Text>
          </View>
          <View style={[styles.entryModeChip, styles.entryModeChipDisabled]}>
            <Text style={styles.entryModeLabelDisabled}>AI Generate</Text>
            <Text style={styles.soonBadge}>SOON</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MISSION NAME</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Ship the landing page"
            placeholderTextColor={semantic.text.tertiary}
            style={styles.titleInput}
            maxLength={120}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TYPE</Text>
          <View style={styles.chipRow}>
            {(
              Object.entries(missionTypeMeta) as [
                MissionType,
                (typeof missionTypeMeta)[MissionType],
              ][]
            ).map(([key, meta]) => {
              const selected = missionType === key;
              return (
                <Pressable
                  key={key}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                  onPress={() => setMissionType(key)}
                  accessibilityRole="button"
                  accessibilityLabel={meta.label}
                  accessibilityState={{ selected }}
                >
                  <Icon
                    name={meta.icon}
                    size={14}
                    color={selected ? semantic.text.onAccent : semantic.text.secondary}
                  />
                  <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GOAL</Text>
          <View style={styles.chipRow}>
            <Pressable
              style={[styles.chip, campaignKey === null ? styles.chipSelected : null]}
              onPress={() => setCampaignKey(null)}
              accessibilityRole="button"
              accessibilityLabel="No goal"
              accessibilityState={{ selected: campaignKey === null }}
            >
              <Text
                style={[styles.chipLabel, campaignKey === null ? styles.chipLabelSelected : null]}
              >
                No Goal
              </Text>
            </Pressable>
            {goalOptions.map((key) => {
              const campaign = campaigns[key];
              const selected = campaignKey === key;
              return (
                <Pressable
                  key={key}
                  style={[
                    styles.goalChip,
                    selected
                      ? {
                          borderColor: campaign.accent,
                          backgroundColor: withAlpha(campaign.accent, 0.12),
                        }
                      : null,
                  ]}
                  onPress={() => setCampaignKey(key)}
                  accessibilityRole="button"
                  accessibilityLabel={campaign.label}
                  accessibilityState={{ selected }}
                >
                  <IconTile name={campaign.icon} accent={campaign.accent} size={28} iconSize={14} />
                  <Text style={styles.chipLabel}>{campaign.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DIFFICULTY</Text>
          <View style={styles.chipRow}>
            {difficultyOrder.map((key) => {
              const meta = difficultyMeta[key];
              const selected = difficulty === key;
              return (
                <Pressable
                  key={key}
                  style={[
                    styles.difficultyChip,
                    selected
                      ? { borderColor: meta.color, backgroundColor: withAlpha(meta.color, 0.12) }
                      : null,
                  ]}
                  onPress={() => setDifficulty(key)}
                  accessibilityRole="button"
                  accessibilityLabel={`${meta.label} difficulty`}
                  accessibilityState={{ selected }}
                >
                  <DifficultyMeter difficulty={key} />
                  <Text style={[styles.chipLabel, selected ? { color: meta.color } : null]}>
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DEADLINE</Text>
          <View style={styles.chipRow}>
            {deadlineOptions.map((option) => {
              const selected = deadlineKey === option.key;
              return (
                <Pressable
                  key={option.key}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                  onPress={() => setDeadlineKey(option.key)}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PROOF REQUIRED</Text>
          <View style={styles.chipRow}>
            {allProofTypes.map((proofType) => {
              const selected = proofTypes.has(proofType);
              return (
                <Pressable
                  key={proofType}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                  onPress={() => toggleProofType(proofType)}
                  accessibilityRole="button"
                  accessibilityLabel={proofTypeLabel[proofType]}
                  accessibilityState={{ selected }}
                >
                  <Icon
                    name={proofTypeIcon[proofType]}
                    size={14}
                    color={selected ? semantic.text.onAccent : semantic.text.secondary}
                  />
                  <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                    {proofTypeLabel[proofType]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>REWARD</Text>
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepperButton}
              onPress={() => setCustomXp(Math.max(XP_MIN, xpReward - XP_STEP))}
              hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
              accessibilityRole="button"
              accessibilityLabel="Decrease XP reward"
            >
              <Text style={styles.stepperButtonLabel}>−</Text>
            </Pressable>
            <Text style={styles.stepperValue}>+{xpReward} XP</Text>
            <Pressable
              style={styles.stepperButton}
              onPress={() => setCustomXp(Math.min(XP_MAX, xpReward + XP_STEP))}
              hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
              accessibilityRole="button"
              accessibilityLabel="Increase XP reward"
            >
              <Text style={styles.stepperButtonLabel}>+</Text>
            </Pressable>
          </View>
        </View>

        {createMission.isError ? (
          <Text style={styles.errorText}>Couldn&rsquo;t create that mission. Try again.</Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel={
            canSubmit
              ? createMission.isPending
                ? 'Locking in mission'
                : 'Lock in mission'
              : 'Name your mission to continue'
          }
          accessibilityState={{ disabled: !canSubmit }}
        >
          {canSubmit ? (
            <LinearGradient
              colors={gradients.xp}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cta, styles.ctaRow, glow(palette.electric)]}
            >
              <Icon name="locked" size={16} color={semantic.text.onAccent} />
              <Text style={styles.ctaLabel}>
                {createMission.isPending ? 'Locking In…' : 'Lock In Mission'}
              </Text>
            </LinearGradient>
          ) : (
            <View style={[styles.cta, styles.ctaDisabled]}>
              <Text style={styles.ctaLabelDisabled}>Name your mission to continue</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.bg.canvas,
  },
  closeButton: {
    position: 'absolute',
    right: space.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: semantic.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: space.xl,
    gap: space.xl,
  },
  title: {
    ...type.display,
    color: semantic.text.primary,
  },
  subtitle: {
    ...type.body,
    color: semantic.text.secondary,
    marginTop: -space.md,
  },
  entryModeRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  entryModeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
  },
  entryModeChipActive: {
    backgroundColor: semantic.action.primary,
  },
  entryModeChipDisabled: {
    backgroundColor: semantic.bg.surface,
    opacity: 0.6,
  },
  entryModeLabelActive: {
    ...type.bodyMedium,
    fontSize: 14,
    color: semantic.text.onAccent,
  },
  entryModeLabelDisabled: {
    ...type.bodyMedium,
    fontSize: 14,
    color: semantic.text.tertiary,
  },
  soonBadge: {
    ...type.data,
    fontSize: 9,
    color: palette.iris,
  },
  section: {
    gap: space.sm,
  },
  sectionLabel: {
    ...type.data,
    color: semantic.text.tertiary,
  },
  titleInput: {
    ...type.bodyMedium,
    color: semantic.text.primary,
    backgroundColor: semantic.bg.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    backgroundColor: semantic.bg.surface,
  },
  chipSelected: {
    backgroundColor: semantic.action.primary,
    borderColor: semantic.action.primary,
  },
  chipLabel: {
    ...type.caption,
    color: semantic.text.secondary,
  },
  chipLabelSelected: {
    color: semantic.text.onAccent,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    paddingRight: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    backgroundColor: semantic.bg.surface,
  },
  difficultyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    backgroundColor: semantic.bg.surface,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: semantic.bg.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    padding: space.sm,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: semantic.glass.fill8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonLabel: {
    ...type.title,
    color: semantic.text.primary,
  },
  stepperValue: {
    ...type.data,
    fontSize: 16,
    textTransform: 'none',
    letterSpacing: 0,
    color: palette.gold,
  },
  errorText: {
    ...type.caption,
    color: semantic.state.danger,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: semantic.border.subtle,
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.lg,
    borderRadius: radius.pill,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  ctaDisabled: {
    backgroundColor: semantic.bg.surface,
  },
  ctaLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
  ctaLabelDisabled: {
    ...type.bodyMedium,
    color: semantic.text.tertiary,
  },
});
