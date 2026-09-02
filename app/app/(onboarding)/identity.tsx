import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingStep } from '@/components/OnboardingStep';
import { useOnboardingDraft } from '@/state/onboardingDraft';
import { Icon, type IconName, radius, semantic, space, type } from '@/theme';
import type { IdentityClass } from '@/lib/database.types';

const classes: { key: IdentityClass; label: string; classLabel: string; icon: IconName }[] = [
  { key: 'developer', label: 'Developer', classLabel: 'Builder Class', icon: 'developer' },
  { key: 'founder', label: 'Founder', classLabel: 'Visionary Class', icon: 'founder' },
  { key: 'creator', label: 'Creator', classLabel: 'Artisan Class', icon: 'creator' },
  { key: 'student', label: 'Student', classLabel: 'Scholar Class', icon: 'student' },
  { key: 'athlete', label: 'Athlete', classLabel: 'Warrior Class', icon: 'athlete' },
  {
    key: 'professional',
    label: 'Professional',
    classLabel: 'Strategist Class',
    icon: 'professional',
  },
  { key: 'entrepreneur', label: 'Entrepreneur', classLabel: 'Hustler Class', icon: 'entrepreneur' },
  { key: 'designer', label: 'Designer', classLabel: 'Architect Class', icon: 'designer' },
];

export default function Identity() {
  const { identityClass, setIdentityClass } = useOnboardingDraft();

  return (
    <OnboardingStep
      step={2}
      totalSteps={4}
      title="Choose your path"
      subtitle="Select the identity that defines your mission."
      ctaLabel="Continue"
      ctaDisabled={!identityClass}
      onCta={() => router.push('/(onboarding)/goals')}
    >
      <View style={styles.grid}>
        {classes.map((c) => {
          const isSelected = identityClass === c.key;
          return (
            <Pressable
              key={c.key}
              style={[styles.card, isSelected ? styles.cardSelected : null]}
              onPress={() => setIdentityClass(c.key)}
            >
              <View style={styles.iconTile}>
                <Icon
                  name={c.icon}
                  size={20}
                  color={isSelected ? semantic.action.primary : semantic.text.secondary}
                />
              </View>
              <Text style={styles.cardLabel}>{c.label}</Text>
              <Text style={styles.cardSubLabel}>{c.classLabel}</Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
  },
  card: {
    width: '47%',
    backgroundColor: semantic.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    padding: space.md,
    gap: space.xs,
  },
  cardSelected: {
    borderColor: semantic.action.primary,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.icon,
    backgroundColor: semantic.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  cardLabel: {
    ...type.bodyMedium,
    color: semantic.text.primary,
  },
  cardSubLabel: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
});
