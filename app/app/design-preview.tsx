import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DisplayHeading } from '@/components/DisplayHeading';
import {
  campaigns,
  gradients,
  Icon,
  IconTile,
  palette,
  semantic,
  space,
  radius,
  type,
} from '@/theme';

/**
 * Design-system smoke test, reachable at /design-preview regardless of onboarding state
 * (it's an explicit unguarded Stack.Screen in the root layout). NOT the real dashboard
 * (that's TODO.md Phase 6). Proves the token pipeline (colors, gradients, type, icon registry,
 * DisplayHeading) renders correctly end to end before screens are built on top of it.
 */
export default function DesignSystemPreview() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: semantic.bg.canvas }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.xl }]}
    >
      <Text style={styles.eyebrow}>LOCKEDIN · DESIGN SYSTEM PREVIEW</Text>

      <DisplayHeading line1="Become the person" line2="you promised." />

      <LinearGradient
        colors={gradients.xp}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.ctaButton}
      >
        <Text style={styles.ctaLabel}>Start My Journey</Text>
        <Icon name="xp" size={18} color={semantic.text.onAccent} />
      </LinearGradient>

      <Section title="Mission card">
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="mainQuest" size={20} color={palette.gold} />
            <Text style={styles.cardEyebrow}>MAIN QUEST</Text>
          </View>
          <Text style={styles.cardTitle}>Build Landing Page</Text>
          <View style={styles.cardMetaRow}>
            <Text style={styles.cardMeta}>2 HOURS REMAINING</Text>
            <Text style={[styles.cardMeta, { color: palette.gold }]}>+500 XP</Text>
          </View>
        </View>
      </Section>

      <Section title="Campaign accents (pixel-sampled from mockups)">
        <View style={styles.grid}>
          {Object.entries(campaigns).map(([key, campaign]) => (
            <View key={key} style={styles.campaignRow}>
              <IconTile name={campaign.icon} accent={campaign.accent} size={40} />
              <Text style={styles.campaignLabel}>{campaign.label}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Nav icons">
        <View style={styles.navRow}>
          {(['home', 'missions', 'progress', 'ai', 'profile'] as const).map((name) => (
            <Icon key={name} name={name} size={24} color={semantic.text.secondary} />
          ))}
        </View>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
    gap: space.xxl,
  },
  eyebrow: {
    ...type.data,
    color: semantic.text.tertiary,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.lg,
    borderRadius: radius.pill,
  },
  ctaLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
  section: {
    gap: space.md,
  },
  sectionTitle: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
  card: {
    backgroundColor: semantic.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    padding: space.lg,
    gap: space.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  cardEyebrow: {
    ...type.data,
    color: palette.gold,
  },
  cardTitle: {
    ...type.title,
    color: semantic.text.primary,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.xs,
  },
  cardMeta: {
    ...type.data,
    color: semantic.text.tertiary,
  },
  grid: {
    gap: space.md,
  },
  campaignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  campaignLabel: {
    ...type.body,
    color: semantic.text.primary,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: semantic.bg.surface,
    borderRadius: radius.pill,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
  },
});
