import { formatTimeRemaining } from './time';
import type { Mission } from './missions';
import type { GrowthTrend } from './progressStats';
import type { IconName } from '@/theme';

export type InsightTone = 'positive' | 'warning' | 'neutral';

export type Insight = {
  id: string;
  icon: IconName;
  tone: InsightTone;
  message: string;
};

export type InsightInput = {
  streakCount: number;
  consistencyPct: number;
  completionRatePct: number | null;
  growthTrend: GrowthTrend;
  activeMissions: Mission[];
};

/**
 * The "AI Insights" feed (TODO.md §1: the MVP stand-in for the cut voice-first AI Coach screen —
 * `docs/DESIGN-SYSTEM.md`'s example copy is literally "Mission risk detected" / "Your consistency
 * improved," which this reuses near-verbatim). This is a **deterministic rule engine over your
 * real data, not a live Claude call** — building an actual LLM-generated insight pipeline means
 * another Edge Function with its own deployment/cost story (see `verify-proof`'s), which is more
 * than a "stand-in" screen warrants. Every message here is backed by a real, currently-true number
 * from `profiles`/`missions`/`xp_events` — nothing is invented, but nothing here was written by
 * Claude at request time either; that distinction matters and shouldn't be papered over.
 *
 * Ordered risk-first, then reinforcement, then neutral nudges, capped by the caller if needed.
 */
export function generateInsights(input: InsightInput): Insight[] {
  const insights: Insight[] = [];

  const overdue = input.activeMissions.find(
    (mission) => mission.deadline && new Date(mission.deadline).getTime() < Date.now(),
  );
  if (overdue) {
    insights.push({
      id: 'overdue',
      icon: 'pending',
      tone: 'warning',
      message: `Mission risk detected — "${overdue.title}" is overdue. Activate Recovery Mode when you're ready, no rush.`,
    });
  }

  const dueSoon = input.activeMissions.find((mission) => {
    if (!mission.deadline) return false;
    const msRemaining = new Date(mission.deadline).getTime() - Date.now();
    return msRemaining > 0 && msRemaining <= 3 * 60 * 60 * 1000; // within 3 hours
  });
  if (dueSoon) {
    insights.push({
      id: 'due-soon',
      icon: 'timer',
      tone: 'warning',
      message: `"${dueSoon.title}" is due soon — ${formatTimeRemaining(dueSoon.deadline)}.`,
    });
  }

  if (input.growthTrend.growthTrendPct !== null) {
    if (input.growthTrend.growthTrendPct > 0) {
      insights.push({
        id: 'growth-up',
        icon: 'trending-up',
        tone: 'positive',
        message: `Your consistency improved — XP is up ${input.growthTrend.growthTrendPct}% vs last week.`,
      });
    } else if (input.growthTrend.growthTrendPct < 0) {
      insights.push({
        id: 'growth-down',
        icon: 'streak',
        tone: 'neutral',
        message: `Momentum dipped ${Math.abs(input.growthTrend.growthTrendPct)}% vs last week — one mission today gets it moving again.`,
      });
    }
  }

  if (input.streakCount >= 3) {
    insights.push({
      id: 'streak',
      icon: 'streak',
      tone: 'positive',
      message: `Your streak is alive at ${input.streakCount} days. Keep the momentum going.`,
    });
  }

  if (input.completionRatePct !== null && input.completionRatePct >= 70) {
    insights.push({
      id: 'completion',
      icon: 'verified',
      tone: 'positive',
      message: `Strong execution — ${input.completionRatePct}% of your missions get finished.`,
    });
  }

  if (input.consistencyPct >= 50) {
    insights.push({
      id: 'consistency',
      icon: 'progress',
      tone: 'positive',
      message: `You've shown up ${input.consistencyPct}% of the last 30 days. That's how progress compounds.`,
    });
  }

  return insights;
}
