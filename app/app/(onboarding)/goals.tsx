import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingStep } from '@/components/OnboardingStep';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import {
  campaigns,
  type CampaignKey,
  Icon,
  IconTile,
  radius,
  semantic,
  space,
  type,
  withAlpha,
} from '@/theme';

export default function Goals() {
  const { selectedCampaigns, toggleCampaign } = useOnboardingDraft();

  return (
    <OnboardingStep
      step={3}
      totalSteps={4}
      title="What are you working toward?"
      subtitle="Pick one or more. Each unlocks a mission campaign."
      ctaLabel={selectedCampaigns.size === 0 ? 'Select at least one goal' : 'Lock In My Missions'}
      ctaDisabled={selectedCampaigns.size === 0}
      onCta={() => router.push('/(onboarding)/generating')}
    >
      {(Object.entries(campaigns) as [CampaignKey, (typeof campaigns)[CampaignKey]][]).map(
        ([key, campaign]) => {
          const isSelected = selectedCampaigns.has(key);
          return (
            <Pressable
              key={key}
              style={[
                styles.row,
                isSelected
                  ? {
                      borderColor: campaign.accent,
                      backgroundColor: withAlpha(campaign.accent, 0.08),
                    }
                  : null,
              ]}
              onPress={() => toggleCampaign(key)}
              accessibilityRole="button"
              accessibilityLabel={`${campaign.label} goal`}
              accessibilityState={{ selected: isSelected }}
            >
              <IconTile name={campaign.icon} accent={campaign.accent} size={44} />
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>{campaign.label}</Text>
              </View>
              <View
                style={[
                  styles.check,
                  isSelected
                    ? { backgroundColor: campaign.accent, borderColor: campaign.accent }
                    : null,
                ]}
              >
                {isSelected ? (
                  <Icon name="verified" size={14} color={semantic.text.onAccent} />
                ) : null}
              </View>
            </Pressable>
          );
        },
      )}
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: semantic.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    padding: space.md,
  },
  rowBody: {
    flex: 1,
  },
  rowLabel: {
    ...type.bodyMedium,
    color: semantic.text.primary,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: semantic.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
