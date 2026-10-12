import type { SupabaseClient } from '@supabase/supabase-js';

// The race an article is about (articles.race_id), with its full classification from `results`:
// the grid-to-flag figure, the race-result rail card and the code -> surname map that per-race
// highlights (keyed by FastF1 abbreviations) need. Null when the article isn't tied to a race or
// the race has no results yet — the race modules then simply don't render.

export type ArticleRaceRow = {
  code: string;
  surname: string;
  constructorRef: string;
  grid: number;
  positionOrder: number;
  positionText: string;
  points: number;
  // position_text is a number: officially classified (a car that stopped late can still be,
  // e.g. Albon P18 in Singapore 2026). Otherwise "R" (retired), "D" (disqualified), "W" (did
  // not start), as load_race.py writes it from FastF1's ClassifiedPosition.
  classified: boolean;
};

export type ArticleRace = {
  id: number;
  year: number;
  round: number;
  name: string;
  date: string;
  circuitName: string;
  rows: ArticleRaceRow[];
  surnameByCode: Record<string, string>;
};

type ResultJoin = {
  grid: number | null;
  position_order: number | null;
  position_text: string | null;
  points: number | string | null;
  drivers: { code: string | null; surname: string } | null;
  constructors: { constructor_ref: string } | null;
};

export async function getArticleRace(supabase: SupabaseClient, raceId: number): Promise<ArticleRace | null> {
  const [raceRes, resultsRes] = await Promise.all([
    supabase.from('races').select('id, year, round, name, date, circuits(name)').eq('id', raceId).single(),
    supabase
      .from('results')
      .select('grid, position_order, position_text, points, drivers(code, surname), constructors(constructor_ref)')
      .eq('race_id', raceId)
      .order('position_order', { ascending: true }),
  ]);
  const race = raceRes.data as
    | { id: number; year: number; round: number; name: string; date: string; circuits: { name: string } | null }
    | null;
  const results = (resultsRes.data ?? []) as unknown as ResultJoin[];
  if (!race || !results.length) return null;

  const rows: ArticleRaceRow[] = results.flatMap((r) =>
    r.drivers?.code && r.position_order
      ? [
          {
            code: r.drivers.code,
            surname: r.drivers.surname,
            constructorRef: r.constructors?.constructor_ref ?? '',
            grid: r.grid ?? 0,
            positionOrder: r.position_order,
            positionText: r.position_text ?? '',
            points: Number(r.points ?? 0),
            classified: /^\d+$/.test(r.position_text ?? ''),
          },
        ]
      : [],
  );

  return {
    id: race.id,
    year: race.year,
    round: race.round,
    name: race.name,
    date: race.date,
    circuitName: race.circuits?.name ?? '',
    rows,
    surnameByCode: Object.fromEntries(rows.map((r) => [r.code, r.surname])),
  };
}
