/**
 * Feature flags for UI that exists as architecture but not yet as a real capability (UI v2 handoff
 * §33). Nothing behind a `false` flag may be shown to users as if it works. Flip a flag only when
 * the backing system (data model, scoring, integration) actually ships.
 */
export const features = {
  /** Reliability score needs a defined scoring model + backend; not built. */
  reliabilityScore: false,
  healthVerification: false,
  gpsVerification: false,
  /** Behavioural LLM recommendations. (The rule-based Insights feed is real and unflagged.) */
  aiRecommendations: false,
  financialStakes: false,
  creatorIntegration: false,
} as const;

export type ReliabilityScore = {
  score: number;
  delta?: number;
  trend?: 'up' | 'down' | 'flat';
  period?: string;
};
