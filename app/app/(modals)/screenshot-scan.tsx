import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateMission } from '@/hooks/useCreateMission';
import {
  type ExtractedIntention,
  type PickedScreenshot,
  useScanScreenshots,
} from '@/hooks/useScanScreenshots';
import { useUpdateIntentionStatus } from '@/hooks/useUpdateIntentionStatus';
import { MAX_BATCH_SIZE } from '@/lib/screenshotIntelligence';
import { useAuth } from '@/state/auth';
import {
  campaigns,
  Icon,
  IconTile,
  palette,
  radius,
  semantic,
  space,
  type,
  withAlpha,
} from '@/theme';

type Stage = 'intro' | 'permission-denied' | 'scanning' | 'results' | 'error';

/**
 * Screenshot Intelligence (TODO.md §10, "the differentiator, do not cut"). Permission priming
 * screen → native multi-select picker → scanning → results, per the spec's own flow. See
 * `scan-screenshots`'s doc comment for the privacy design (images are never persisted) and the
 * honest Batch-API cost-optimization gap (deferred pending Phase 13's notification system).
 *
 * Not yet wired to an entry point on the Dashboard/Mission Board — reachable directly at
 * `/(modals)/screenshot-scan` in the meantime.
 */
export default function ScreenshotScanModal() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const scanScreenshots = useScanScreenshots(session?.user.id);
  const createMission = useCreateMission(session?.user.id);
  const updateIntentionStatus = useUpdateIntentionStatus(session?.user.id);

  const [stage, setStage] = useState<Stage>('intro');
  const [results, setResults] = useState<ExtractedIntention[]>([]);
  const [decidedIds, setDecidedIds] = useState<ReadonlySet<string>>(new Set());
  const [convertingId, setConvertingId] = useState<string | null>(null);

  async function startScan() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setStage('permission-denied');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_BATCH_SIZE,
      quality: 0.8,
    });
    if (picked.canceled || picked.assets.length === 0) return;

    const screenshots: PickedScreenshot[] = picked.assets.map((asset, index) => ({
      id: `${Date.now()}-${index}`,
      uri: asset.uri,
      width: asset.width,
    }));

    setStage('scanning');
    try {
      const intentions = await scanScreenshots.mutateAsync(screenshots);
      setResults(intentions);
      setDecidedIds(new Set());
      setStage('results');
    } catch {
      setStage('error');
    }
  }

  async function convertToMission(item: ExtractedIntention) {
    setConvertingId(item.id);
    try {
      await createMission.mutateAsync({
        title: item.intention,
        type: 'side',
        campaign_key: item.category,
        difficulty: 'standard',
        xp_reward: 100,
        proof_requirements: [],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      await updateIntentionStatus.mutateAsync({ id: item.id, status: 'converted' });
      setDecidedIds((prev) => new Set(prev).add(item.id));
    } catch {
      // Inline per-item error isn't worth its own state here — the item stays actionable and the
      // user can just tap it again.
    } finally {
      setConvertingId(null);
    }
  }

  async function ignoreIntention(item: ExtractedIntention) {
    setDecidedIds((prev) => new Set(prev).add(item.id));
    try {
      await updateIntentionStatus.mutateAsync({ id: item.id, status: 'ignored' });
    } catch {
      // A failed status write just means it may resurface next visit — not worth blocking on.
    }
  }

  const categoryCounts = results.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

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
          { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl },
        ]}
      >
        {stage === 'intro' || stage === 'permission-denied' ? (
          <View style={styles.introBlock}>
            <View style={styles.introIconWrap}>
              <Icon name="ai" size={32} color={palette.electric} />
            </View>
            <Text style={styles.title}>Screenshot Intelligence</Text>
            <Text style={styles.body}>
              You&rsquo;ve probably screenshotted a course, a workout plan, or a business idea and
              never touched it again. Pick up to {MAX_BATCH_SIZE} screenshots and LockedIn will find
              the real intentions hiding in them — and offer to turn each one into a mission.
            </Text>
            <View style={styles.privacyCallout}>
              <Icon name="locked" size={16} color={semantic.text.tertiary} />
              <Text style={styles.privacyText}>
                Screenshots are analyzed and immediately discarded — never stored on our servers.
              </Text>
            </View>
            {stage === 'permission-denied' ? (
              <Text style={styles.errorText}>
                Photo library access was declined. Enable it in Settings to use Screenshot
                Intelligence.
              </Text>
            ) : null}
          </View>
        ) : null}

        {stage === 'scanning' ? (
          <View style={styles.centeredBlock}>
            <ActivityIndicator color={palette.electric} size="large" />
            <Text style={styles.body}>Finding forgotten goals…</Text>
          </View>
        ) : null}

        {stage === 'error' ? (
          <View style={styles.centeredBlock}>
            <Icon name="pending" size={32} color={semantic.text.tertiary} />
            <Text style={styles.title}>Couldn&rsquo;t Scan Those</Text>
            <Text style={styles.body}>
              The scan service didn&rsquo;t respond. Nothing was saved — try again.
            </Text>
          </View>
        ) : null}

        {stage === 'results' ? (
          <View style={styles.resultsBlock}>
            {results.length === 0 ? (
              <View style={styles.centeredBlock}>
                <Icon name="ai" size={32} color={semantic.text.tertiary} />
                <Text style={styles.title}>Nothing Found</Text>
                <Text style={styles.body}>
                  No clear intentions in that batch — try a different set of screenshots.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.title}>
                  Found {results.length} hidden intention{results.length === 1 ? '' : 's'}
                </Text>
                <Text style={styles.summaryLine}>
                  {Object.entries(categoryCounts)
                    .map(
                      ([key, count]) =>
                        `${count} ${campaigns[key as keyof typeof campaigns].label}`,
                    )
                    .join(' · ')}
                </Text>
                <View style={styles.list}>
                  {results.map((item) => {
                    const campaign = campaigns[item.category];
                    const decided = decidedIds.has(item.id);
                    return (
                      <View
                        key={item.id}
                        style={[styles.card, decided ? styles.cardDecided : null]}
                      >
                        <View style={styles.cardHeader}>
                          <IconTile
                            name={campaign.icon}
                            accent={campaign.accent}
                            size={36}
                            iconSize={18}
                          />
                          <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>{item.intention}</Text>
                            <Text style={[styles.cardCategory, { color: campaign.accent }]}>
                              {campaign.label} · {Math.round(item.confidence)}% confidence
                            </Text>
                          </View>
                        </View>
                        {!decided ? (
                          <View style={styles.cardActions}>
                            <Pressable
                              style={styles.ignoreButton}
                              onPress={() => void ignoreIntention(item)}
                              accessibilityRole="button"
                              accessibilityLabel={`Ignore "${item.intention}"`}
                            >
                              <Text style={styles.ignoreLabel}>Ignore</Text>
                            </Pressable>
                            <Pressable
                              style={styles.convertButton}
                              onPress={() => void convertToMission(item)}
                              disabled={convertingId === item.id}
                              accessibilityRole="button"
                              accessibilityLabel={`Turn "${item.intention}" into a mission`}
                            >
                              {convertingId === item.id ? (
                                <ActivityIndicator color={semantic.text.onAccent} size="small" />
                              ) : (
                                <Text style={styles.convertLabel}>Turn into Mission</Text>
                              )}
                            </Pressable>
                          </View>
                        ) : (
                          <Text style={styles.decidedLabel}>
                            Saved for later — check Mission Board.
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        {stage === 'intro' || stage === 'permission-denied' ? (
          <Pressable style={styles.cta} onPress={() => void startScan()}>
            <Text style={styles.ctaLabel}>Choose Screenshots</Text>
          </Pressable>
        ) : stage === 'error' ? (
          <Pressable style={styles.cta} onPress={() => setStage('intro')}>
            <Text style={styles.ctaLabel}>Try Again</Text>
          </Pressable>
        ) : stage === 'results' ? (
          <Pressable style={styles.cta} onPress={() => router.back()}>
            <Text style={styles.ctaLabel}>Done</Text>
          </Pressable>
        ) : null}
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
    gap: space.lg,
  },
  introBlock: {
    alignItems: 'center',
    gap: space.md,
    paddingTop: space.xxl,
  },
  introIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: withAlpha(palette.electric, 0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredBlock: {
    alignItems: 'center',
    gap: space.md,
    paddingTop: space.xxxl,
  },
  title: {
    ...type.display,
    color: semantic.text.primary,
    textAlign: 'center',
  },
  body: {
    ...type.body,
    color: semantic.text.secondary,
    textAlign: 'center',
  },
  privacyCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.sm,
    padding: space.md,
    borderRadius: radius.tile,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  privacyText: {
    ...type.caption,
    color: semantic.text.tertiary,
    flex: 1,
  },
  errorText: {
    ...type.caption,
    color: semantic.state.danger,
    textAlign: 'center',
  },
  resultsBlock: {
    gap: space.md,
  },
  summaryLine: {
    ...type.caption,
    color: semantic.text.tertiary,
    textAlign: 'center',
  },
  list: {
    gap: space.md,
    marginTop: space.sm,
  },
  card: {
    gap: space.md,
    padding: space.md,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  cardDecided: {
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...type.bodyMedium,
    color: semantic.text.primary,
  },
  cardCategory: {
    ...type.caption,
  },
  cardActions: {
    flexDirection: 'row',
    gap: space.sm,
  },
  ignoreButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  ignoreLabel: {
    ...type.bodyMedium,
    fontSize: 14,
    color: semantic.text.secondary,
  },
  convertButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: semantic.action.primary,
  },
  convertLabel: {
    ...type.bodyMedium,
    fontSize: 14,
    color: semantic.text.onAccent,
  },
  decidedLabel: {
    ...type.caption,
    color: semantic.text.tertiary,
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
    backgroundColor: semantic.action.primary,
  },
  ctaLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
});
