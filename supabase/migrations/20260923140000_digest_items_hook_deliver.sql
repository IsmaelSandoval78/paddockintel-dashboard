-- Feed Hook & Deliver v0. Spec only — the numbers are queried at render time
-- from results / driver_circuit_wins / constructor_stats / constructor_standings.
-- See docs/HOOK-DELIVER-FEED-V0.md.
--
-- Stored as its own jsonb column so digest_items.stats can stay the Stat[] the
-- deployed Feed reader already maps. A null column means "render this item
-- exactly as before." No new table, no RLS change: digest_items policies and
-- grants already cover every column.

alter table public.digest_items
  add column if not exists hook_deliver jsonb;

alter table public.digest_items
  drop constraint if exists digest_items_hook_deliver_object;

alter table public.digest_items
  add constraint digest_items_hook_deliver_object
  check (hook_deliver is null or jsonb_typeof(hook_deliver) = 'object');

comment on column public.digest_items.hook_deliver is
  'Hook & Deliver v0 spec (hub + up to 3 query descriptors). Numbers are not stored. Contract: docs/HOOK-DELIVER-FEED-V0.md.';

-- Pilot: the published Ferrari strategy brief. Refs only; the Feed resolves
-- Leclerc–Norris 2026 H2H, Leclerc wins at Madring, and Ferrari career points.
update public.digest_items
set hook_deliver = $${
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
      "label": "Leclerc wins at Madring",
      "label_es": "Victorias de Leclerc en Madring",
      "label_pt": "Vitórias de Leclerc em Madring"
    },
    {
      "kind": "constructor_career",
      "constructor_ref": "ferrari",
      "metric": "points",
      "label": "Ferrari career points",
      "label_es": "Puntos históricos de Ferrari",
      "label_pt": "Pontos históricos da Ferrari"
    }
  ]
}$$::jsonb
where slug = 'ferrari-strategy-communication-weakness-spanish-gp-2026';
