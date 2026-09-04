/**
 * Hand-written to match supabase/migrations/*.sql exactly, since there is no live project yet
 * to run `supabase gen types typescript --project-id <id> > database.types.ts` against.
 *
 * ⚠️ Once a real Supabase project exists and the migrations are applied to it, regenerate this
 * file from the CLI and delete this file by hand — a hand-maintained copy WILL drift from the
 * real schema the moment someone edits a migration and forgets this file exists.
 *
 * Every table below carries `Relationships: []`, even though nothing here has an empty
 * relationship set in reality (every table has FKs). This is not optional decoration — omitting
 * it entirely breaks @supabase/supabase-js's `.update()`/`.insert()` generic type resolution
 * silently (every call resolves to `never`, no matter what `Update`/`Insert` say), confirmed by
 * bisecting against the installed package's actual .d.ts files, not by reading a doc. A real
 * `supabase gen types` run will populate this with actual FK-derived relationship descriptors —
 * this hand-written version leaves it empty since nothing here performs embedded-resource
 * (`select('*, related_table(*)')`) queries yet.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CampaignKey =
  | 'careerGrowth'
  | 'buildBusiness'
  | 'learnSkill'
  | 'improveFitness'
  | 'increaseIncome'
  | 'createContent'
  | 'improveHealth'
  | 'personalGrowth';

export type MissionType = 'main' | 'side' | 'daily';
export type MissionStatus = 'active' | 'completed' | 'failed' | 'recovery';
export type MissionDifficulty = 'standard' | 'challenging' | 'hard' | 'epic';
export type ProofType = 'photo' | 'voice' | 'screenshot' | 'file';
export type SubscriptionTier = 'free' | 'pro' | 'elite';
export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'expired';

export type IdentityClass =
  | 'developer'
  | 'founder'
  | 'creator'
  | 'student'
  | 'athlete'
  | 'professional'
  | 'entrepreneur'
  | 'designer';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          identity_class: IdentityClass | null;
          level: number;
          xp_total: number;
          streak_count: number;
          execution_score: number;
          onboarding_completed_at: string | null;
          // Added in 20260901000010_streaks.sql — see that migration's column comments.
          timezone: string;
          last_streak_date: string | null;
          streak_grace_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        // No Insert type: rows are created only by the on_auth_user_created trigger.
        Insert: never;
        Update: Partial<{
          display_name: string | null;
          identity_class: IdentityClass | null;
          onboarding_completed_at: string | null;
          timezone: string;
        }>;
        Relationships: [];
      };
      user_campaigns: {
        Row: {
          user_id: string;
          campaign_key: CampaignKey;
          selected_at: string;
        };
        Insert: {
          user_id: string;
          campaign_key: CampaignKey;
          selected_at?: string;
        };
        Update: Partial<{ campaign_key: CampaignKey }>;
        Relationships: [];
      };
      missions: {
        Row: {
          id: string;
          user_id: string;
          campaign_key: CampaignKey | null;
          type: MissionType;
          title: string;
          difficulty: MissionDifficulty;
          status: MissionStatus;
          xp_reward: number;
          proof_requirements: Json;
          deadline: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          campaign_key?: CampaignKey | null;
          type?: MissionType;
          title: string;
          difficulty?: MissionDifficulty;
          status?: MissionStatus;
          xp_reward: number;
          proof_requirements?: Json;
          deadline?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['missions']['Insert']>;
        Relationships: [];
      };
      proofs: {
        Row: {
          id: string;
          mission_id: string;
          user_id: string;
          type: ProofType;
          storage_path: string;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          user_id: string;
          type: ProofType;
          storage_path: string;
          submitted_at?: string;
        };
        // No Update: a submitted proof is immutable (see the migration comment) — resubmission
        // is a new row, not an edit.
        Update: never;
        Relationships: [];
      };
      verifications: {
        Row: {
          id: string;
          proof_id: string;
          verified: boolean;
          confidence: number;
          reasoning: string | null;
          suggested_xp: number | null;
          created_at: string;
        };
        // Written only by the server (service_role) — the client never inserts/updates these.
        Insert: never;
        Update: never;
        Relationships: [];
      };
      achievements: {
        Row: {
          key: string;
          label: string;
          description: string;
          icon: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      user_achievements: {
        Row: {
          user_id: string;
          achievement_key: string;
          unlocked_at: string;
        };
        // Unlocked server-side only — see the migration comment.
        Insert: never;
        Update: never;
        Relationships: [];
      };
      xp_events: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason: string;
          mission_id: string | null;
          created_at: string;
        };
        // Awarded server-side only, after AI verification — the client never inserts these.
        Insert: never;
        Update: never;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          user_id: string;
          tier: SubscriptionTier;
          status: SubscriptionStatus;
          revenuecat_app_user_id: string | null;
          current_period_end: string | null;
          updated_at: string;
        };
        // Written only by the RevenueCat webhook handler (service_role).
        Insert: never;
        Update: never;
        Relationships: [];
      };
      level_thresholds: {
        Row: {
          level: number;
          cumulative_xp: number;
        };
        // Static reference data, seeded once by the migration — see
        // 20260901000009_level_curve.sql and app/src/lib/leveling.ts.
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      campaign_key: CampaignKey;
      mission_type: MissionType;
      mission_status: MissionStatus;
      mission_difficulty: MissionDifficulty;
      proof_type: ProofType;
      subscription_tier: SubscriptionTier;
      subscription_status: SubscriptionStatus;
    };
  };
};
