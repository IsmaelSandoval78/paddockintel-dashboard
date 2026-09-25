# Hook & Deliver on the Feed (v0)

Pilot for Format Lab's drama→data pattern. Scope is the Feed only
(`app/[locale]/(digest)/feed/` and `/feed/[slug]/`). No Verdict chrome, no
FEEDS changes, no auto-publish.

The headline and `our_summary` stay the hook: they cite the reported claim.
The same item then shows **1–3 labeled facts** resolved from Supabase, plus one
Hub link into 1950–today history. Opinion stays where it already lives (Blog,
and the issue's editor take). This block does not add a Verdict.

## Where it renders

An item renders the block only when both are true:

1. `entity_tags` is a non-empty array.
2. A valid `hook_deliver` spec is present (column, or nested under `stats` — see below).

The list uses it on the day's top cards and on the dense rows. The story page
places it directly under the summary, before the editor's note and editor's take,
so the facts sit next to the claim and the existing take stays labeled as the take.

If a callout's refs do not resolve, or a query errors, that callout is dropped.
If the Hub entity does not resolve, or every callout drops, the whole block is
omitted. Nothing in the UI invents a number to fill the gap.

## Storage

`digest_items.stats` is already a JSON array of editorial callouts
(`value` / `label` / optional `label_es`, `unit`, `unit_es`). The live Feed
reader calls `.map` on that array. Replacing it with an object would blank or
throw on the currently deployed story page, so v0 does **not** rewrite `stats`.

The spec lives in a nullable jsonb column, `digest_items.hook_deliver`.
Existing rows stay `null` and render exactly as before. Table RLS and grants
are unchanged; the Feed still reads through the server Supabase client
(`lib/supabase/server.ts`), never the service role on the client.

The reader also accepts a nested form once this code is deployed, for an item
that wants one jsonb value:

```json
{
  "featured": [ { "value": "35", "label": "LAPS LED" } ],
  "hook_deliver": { "hub": {}, "callouts": [] }
}
```

When both the column and `stats.hook_deliver` are set, the column wins.
`featured` is what the existing "The Numbers" sidebar keeps rendering.

## Spec

```json
{
  "hub": { "kind": "constructor", "ref": "ferrari" },
  "callouts": [
    {
      "kind": "h2h_season",
      "driver_a": "leclerc",
      "driver_b": "norris",
      "year": 2026,
      "label": "Leclerc–Norris H2H 2026",
      "label_es": "Cara a cara Leclerc–Norris 2026",
      "label_pt": "Cara a cara Leclerc–Norris 2026"
    },
    {
      "kind": "wins_at_circuit",
      "driver_ref": "leclerc",
      "circuit_ref": "madring",
      "label": "Leclerc wins at Madring"
    },
    {
      "kind": "constructor_career",
      "constructor_ref": "ferrari",
      "metric": "points",
      "label": "Ferrari career points"
    }
  ]
}
```

Rules:

- `hub.kind` is `driver`, `constructor`, or `circuit`. `ref` is that table's
  `driver_ref` / `constructor_ref` / `circuit_ref`. The link is the existing Hub
  route: `/drivers/{ref}`, `/constructors/{ref}`, `/circuits/{ref}`.
- At most 3 callouts. Extras are ignored. Invalid entries are skipped.
- Refs match `^[a-z0-9_-]{1,80}$`. `year` is an integer from 1950 to 2100, not a string.
- `label` / `label_es` / `label_pt` are optional scope labels (max 80 characters).
  They describe what the number is. They must not state a conclusion. Spanish
  and Portuguese fall back to `label`, then to a locale string in `feed.hookDeliver`.
- The number is never stored in the spec.

### Callout kinds

| `kind` | Query | Value |
|---|---|---|
| `h2h_season` | `results` for both drivers, races in `year` only (stays under the PostgREST row cap; a full-career H2H is out of scope) | `{driver_a ahead}–{driver_b ahead}` |
| `wins_at_circuit` | `driver_circuit_wins` | Win count. A real driver and circuit with no row is `0` (the view only stores wins). An unknown ref is omitted. |
| `constructor_career` | `constructor_stats` | `metric`: `wins`, `podiums`, `points` (`total_points`), `races`, `championships` |
| `constructor_season_points` | latest `constructor_standings.points` for that constructor in `year` | Season points after the latest round that has a row |

Head-to-head uses the same finish rule as `app/api/compare/h2h`: both classified,
lower `position` finishes ahead; one classified and one null finishes ahead; both
null counts as a shared race and awards neither. The label has to name who is on
the left of the dash (`driver_a`).

Each rendered block ends with one mono source line for the reader:
`Source: Formula 1 official results / PaddockIntel data` (ES: `Fuente: resultados
oficiales de F1 / datos de PaddockIntel`). The line does not name database tables
or columns. Which table answered a callout stays inside the resolver.

## Authoring the next item

1. Pick a published Feed item whose `entity_tags` already name the people or teams.
2. Add `hook_deliver` to that item in `digests/<issue>.json` using refs that exist
   in Supabase. Do not type the number.
3. Re-ingest with `scripts/ingest-digest.ts` (the script writes the column), or
   update the one row:

```sql
update public.digest_items
set hook_deliver = '{"hub":{"kind":"driver","ref":"leclerc"},"callouts":[...]}'::jsonb
where slug = 'the-item-slug';
```

Re-ingest replaces every item on the issue. The JSON file has to carry `hook_deliver`
or the column goes back to null.

Confirm the block on `/feed/` and `/feed/<slug>/` in `en` and `es`. A missing
callout means the ref or the year did not resolve — fix the spec, do not hardcode
the figure in the component.

## Pilot

Slug: `ferrari-strategy-communication-weakness-spanish-gp-2026`
(issue `vol-11-week-2026-09-17`, PlanetF1 — the Ferrari strategy brief).

- Hook: the existing headline and summary (Leclerc led the Spanish GP and finished off the podium).
- Hub → Ferrari (`/constructors/ferrari`).
- Callouts: 2026 Leclerc–Norris race H2H (`results`), Leclerc wins at Madring
  (`driver_circuit_wins`; the 2026 Spanish GP is `circuit_ref = madring`), Ferrari
  career points (`constructor_stats.total_points`).

Those three numbers move when the tables move. They are not fixtures in the UI.
Snapshot checked against Supabase on 2026-09-23 while writing this pilot:
Leclerc–Norris race finishes in 2026 were level at 7–7 across 14 shared starts,
Leclerc had no win row at Madring, and `constructor_stats` had Ferrari career
points at 10850. Re-query before citing them anywhere else.
