import { Stack } from 'expo-router';

import { OnboardingDraftProvider } from '@/state/onboardingDraft';
import { semantic } from '@/theme';

export default function OnboardingLayout() {
  return (
    <OnboardingDraftProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: semantic.bg.canvas },
          animation: 'slide_from_right',
        }}
      />
    </OnboardingDraftProvider>
  );
}
