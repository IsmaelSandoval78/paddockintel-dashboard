import { createClient } from './supabase/server';

// Dated, public corrections and updates for an article or a Feed item (EEAT: "corrections are
// visible", promised on /about; supabase/migrations/20261109150259_corrections.sql). Written from
// the `corrections` frontmatter by the ingest scripts, shown under the byline, newest first.
export type Correction = { date: string; note: string; note_es?: string };

// Read on its own so a page still renders before the migration has been pushed: a missing column
// is an error here, never a missing article.
export async function getCorrections(table: 'articles' | 'digest_items', id: string): Promise<Correction[]> {
  const { data, error } = await createClient().from(table).select('corrections').eq('id', id).maybeSingle();
  if (error || !data) return [];
  const list = (data as { corrections: unknown }).corrections;
  if (!Array.isArray(list)) return [];
  return (list as Correction[])
    .filter((c) => typeof c?.date === 'string' && typeof c?.note === 'string' && !Number.isNaN(Date.parse(c.date)))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

// Rejects a malformed entry at ingest time instead of letting it vanish on the page.
export function validateCorrections(list: unknown, where: string, needsEs: boolean): Correction[] {
  if (!Array.isArray(list)) throw new Error(`${where}: "corrections" must be a list`);
  return list.map((c, i) => {
    const entry = c as Partial<Correction>;
    if (typeof entry.date !== 'string' || Number.isNaN(Date.parse(entry.date)))
      throw new Error(`${where}: corrections[${i}].date must be an ISO 8601 date`);
    if (typeof entry.note !== 'string' || !entry.note.trim()) throw new Error(`${where}: corrections[${i}].note is empty`);
    if (needsEs && (typeof entry.note_es !== 'string' || !entry.note_es.trim()))
      throw new Error(`${where}: corrections[${i}].note_es is empty (the Feed is EN/ES)`);
    return { date: entry.date, note: entry.note.trim(), ...(needsEs ? { note_es: entry.note_es!.trim() } : {}) };
  });
}
