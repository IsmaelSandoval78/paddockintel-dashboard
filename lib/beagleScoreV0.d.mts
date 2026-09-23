import type { SupabaseClient } from '@supabase/supabase-js';

export const RUBRIC_VERSION: 'v0';
export const WINDOW_DAYS: number;

export type SourceTier = 'first_party' | 'syndicated' | 'wire';

export type ScoreSignals = {
  independent_outlets: string[];
  syndication_collapse?: Record<string, string[]>;
  source_tier: SourceTier | null;
  economic_title_hint: { verified: false; hint?: string };
  primary_source: null;
  economic_mechanism: null;
  named_expert: null;
  eeat_incomplete: true;
};

export type JudgedItem = {
  id: string;
  title: string;
  link: string;
  sourceName: string;
  independentOutletCount: number;
  economicPayoffFlag: false;
  score: number;
  parts: { tierPoints: number; hintPoints: number; coveragePoints: number };
  signals: ScoreSignals;
};

export type PoolRow = {
  id?: string;
  source_name?: string | null;
  title?: string | null;
  link?: string | null;
  entity_tags?: string[] | null;
  published_at?: string | null;
  fetched_at?: string | null;
};

export function judgeItems(rows: PoolRow[]): JudgedItem[];

export function loadWindowItems(supabase: SupabaseClient, now?: number): Promise<PoolRow[]>;

export function upsertScoreRows(
  supabase: SupabaseClient,
  judged: JudgedItem[],
  scoredAt?: string,
): Promise<number>;

export function listTopScores(supabase: SupabaseClient, limit: number): Promise<unknown[]>;

export function selfTest(): void;
