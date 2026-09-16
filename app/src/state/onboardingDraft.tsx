import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { CampaignKey } from '@/theme';
import type { IdentityClass } from '@/lib/database.types';

type OnboardingDraftState = {
  identityClass: IdentityClass | null;
  setIdentityClass: (identityClass: IdentityClass) => void;
  selectedCampaigns: Set<CampaignKey>;
  toggleCampaign: (key: CampaignKey) => void;
};

/**
 * Ephemeral draft of in-progress onboarding selections — scoped to the (onboarding) route group
 * only (provided in its _layout.tsx), not persisted anywhere. The final auth.tsx step reads this
 * to write the real profiles.identity_class and user_campaigns rows once the user signs in;
 * nothing here is real data on its own.
 */
const OnboardingDraftContext = createContext<OnboardingDraftState | null>(null);

export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  const [identityClass, setIdentityClass] = useState<IdentityClass | null>(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<CampaignKey>>(new Set());

  const value = useMemo<OnboardingDraftState>(
    () => ({
      identityClass,
      setIdentityClass,
      selectedCampaigns,
      toggleCampaign: (key: CampaignKey) => {
        setSelectedCampaigns((prev) => {
          const next = new Set(prev);
          if (next.has(key)) {
            next.delete(key);
          } else {
            next.add(key);
          }
          return next;
        });
      },
    }),
    [identityClass, selectedCampaigns],
  );

  return (
    <OnboardingDraftContext.Provider value={value}>{children}</OnboardingDraftContext.Provider>
  );
}

export function useOnboardingDraft(): OnboardingDraftState {
  const ctx = useContext(OnboardingDraftContext);
  if (!ctx) {
    throw new Error('useOnboardingDraft must be used within an OnboardingDraftProvider');
  }
  return ctx;
}
