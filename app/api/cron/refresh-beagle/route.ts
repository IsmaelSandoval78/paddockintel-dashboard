import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Automated sibling of scripts/beagle.mjs (the manual, console-only editorial radar) --
// that script never writes to Supabase and stays that way. This route is the pipeline that
// actually persists the raw press pool into beagle_items (see its migration for why),
// called every 4h by the Cloudflare cron wired in custom-worker.ts.
//
// Feed list and entity-matching logic are deliberately duplicated from beagle.mjs rather
// than shared -- one is a plain Node script run locally, this is a Next.js route running on
// the Cloudflare Worker; sharing a module across those two runtimes isn't worth the
// indirection for ~40 lines of parsing logic. Keep the matching rules in sync by hand.
//
// The feed lists no longer match, on purpose. beagle.mjs also polls the seven non-English
// Motorsport.com locale feeds; this route does not. Those feeds are the same Motorsport
// Network story translated, and beagle_items exists only to count how many stories touch
// an entity (lib/beagleCounts.ts -- nothing else reads the table). Ingesting eight copies
// of one wire story would inflate a number the UI presents to readers as "how many other
// stories this week touch the same entity". The radar wants that breadth for reading;
// the counter does not. Every other language here is an independent newsroom, not a
// translation, so they stay.

// Must match the window lib/beagleCounts.ts scores over -- this route only stores what
// that query can still count.
const SCORING_WINDOW_DAYS = 7;

const FEEDS = [
  { name: 'Motorsport.com', url: 'https://www.motorsport.com/rss/f1/news/' },
  { name: 'Autosport', url: 'https://www.autosport.com/rss/f1/news/' },
  { name: 'The Race', url: 'https://www.the-race.com/feed/' },
  { name: 'RaceFans', url: 'https://www.racefans.net/feed/' },
  { name: 'RACER', url: 'https://racer.com/f1/feed/' },
  { name: 'Crash.net', url: 'https://www.crash.net/rss/f1' },
  { name: 'RacingNews365', url: 'https://racingnews365.com/feed/news.xml' },
  { name: 'PlanetF1', url: 'https://www.planetf1.com/rss' },
  { name: 'Grandprix.com', url: 'https://www.grandprix.com/rss.xml' },
  { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/formula1/rss.xml' },
  { name: 'Sky Sports', url: 'https://www.skysports.com/rss/12433' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/sport/formulaone/rss' },
  { name: 'Formula1.com', url: 'https://www.formula1.com/en/latest/all.xml' },
  { name: 'Racecar Engineering', url: 'https://www.racecar-engineering.com/feed/' },
  { name: 'FIA', url: 'https://www.fia.com/rss/press-release' },
  // Verified additions (2026-09-22 source survey), minus the Motorsport.com locale
  // siblings -- see the note above the list for why those are radar-only.
  { name: 'Liberty Media', url: 'https://libertymedia.com/investors/news-events/press-releases/rss' },
  { name: 'Motorsport Week', url: 'https://www.motorsportweek.com/feed/' },
  { name: 'Pitpass', url: 'https://www.pitpass.com/fes_php/fes_usr_sit_newsfeed.php?fes_prepend_aty_sht_name=1/feed' },
  { name: 'The Checkered Flag', url: 'https://www.thecheckeredflag.co.uk/open-wheel/formula-1/feed/' },
  { name: 'Speedcafe', url: 'https://www.speedcafe.com/f1/feed/' },
  { name: 'ESPN', url: 'https://www.espn.com/espn/rss/f1/news' },
  { name: 'The New York Times', url: 'https://www.nytimes.com/svc/collections/v1/publish/https://www.nytimes.com/topic/organization/formula-one/rss.xml' },
  { name: 'Mirror', url: 'https://www.mirror.co.uk/sport/formula-1/rss.xml' },
  { name: 'Race Tech Magazine', url: 'https://www.racetechmag.com/feed/' },
  { name: 'SportsPro', url: 'https://www.sportspromedia.com/feed/' },
  { name: 'Forbes SportsMoney', url: 'https://www.forbes.com/sportsmoney/feed/' },
  { name: 'Motorsport Broadcasting', url: 'https://motorsportbroadcasting.com/feed/' },
  { name: 'AS', url: 'https://feeds.as.com/mrss-s/pages/as/site/as.com/section/motor/subsection/formula_1/' },
  { name: 'Marca', url: 'https://www.marca.com/rss/motor/formula1.xml' },
  { name: 'El Mundo', url: 'https://e00-elmundo.uecdn.es/elmundodeporte/rss/motor.xml' },
  { name: 'Mundo Deportivo', url: 'https://www.mundodeportivo.com/rss/motor.xml' },
  { name: 'FormulaPassion', url: 'https://www.formulapassion.it/feed' },
  { name: 'Formula1.it', url: 'https://www.formula1.it/rss.asp' },
  { name: 'F1Sport.it', url: 'https://www.f1sport.it/feed/' },
  { name: 'Automoto.it', url: 'https://www.automoto.it/rss/formula1.xml' },
  { name: 'Gazzetta dello Sport', url: 'https://www.gazzetta.it/rss/motori.xml' },
  { name: 'AutoHebdo', url: 'https://www.autohebdo.fr/feed' },
  { name: 'Motorsport-Total', url: 'https://www.motorsport-total.com/rss/rss_formel-1.xml' },
  { name: 'Motorsport-Magazin', url: 'https://www.motorsport-magazin.com/rss/formel1.xml' },
  { name: 'F1Mania', url: 'https://www.f1mania.net/feed/' },
  { name: 'Autoracing', url: 'https://autoracing.com.br/feed/' },
  { name: 'Formula Web', url: 'http://www.formula-web.jp/f1news/rss2.xml' },
  { name: 'Joe Saward', url: 'https://joesaward.wordpress.com/feed/' },
  { name: 'Adam Cooper', url: 'https://adamcooperf1.com/feed/' },
  { name: 'Peter Windsor', url: 'https://peterwindsor.com/feed/' },
  { name: 'Will Buxton', url: 'https://willthef1journo.wordpress.com/feed/' },
  { name: 'TheJudge13', url: 'https://thejudge13.com/feed/' },
  { name: 'F1 Chronicle', url: 'https://f1chronicle.com/feed/' },
  { name: 'NewsOnF1', url: 'https://www.newsonf1.com/feed/' },
  { name: 'F1 Beyond The Grid', url: 'https://audioboom.com/channels/4964339.rss' },
];

function decodeEntities(str: string) {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}

function tag(xml: string, tagName: string) {
  const m = xml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i'));
  return m ? decodeEntities(m[1]) : null;
}

function parseFeed(xml: string) {
  const items: { title: string; link: string; pubDate: Date | null }[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  for (const block of blocks) {
    const title = tag(block, 'title');
    let link = tag(block, 'link');
    if (!link) {
      const hrefMatch = block.match(/<link[^>]*href=["']([^"']+)["']/i);
      link = hrefMatch ? hrefMatch[1] : null;
    }
    const pubDateRaw = tag(block, 'pubDate') ?? tag(block, 'published') ?? tag(block, 'updated');
    const parsedDate = pubDateRaw ? new Date(pubDateRaw) : null;
    const pubDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;
    if (title && link) items.push({ title, link, pubDate });
  }
  return items;
}

async function fetchFeed({ name, url }: { name: string; url: string }) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (PaddockIntel news radar; +https://paddockintel.com)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { name, items: [] as ReturnType<typeof parseFeed>, error: `HTTP ${res.status}` };
    const xml = await res.text();
    return { name, items: parseFeed(xml), error: null as string | null };
  } catch (e) {
    return { name, items: [] as ReturnType<typeof parseFeed>, error: (e as Error).message };
  }
}

async function loadEntityDictionary(supabase: ReturnType<typeof createClient>) {
  const { data: races } = await supabase.from('races').select('id').eq('year', 2026);
  const raceIds = (races ?? []).map((r) => r.id as number);

  const { data: results } = await supabase
    .from('results')
    .select('driver_id, constructor_id')
    .in('race_id', raceIds);

  const driverIds = [...new Set((results ?? []).map((r) => r.driver_id as number))];
  const constructorIds = [...new Set((results ?? []).map((r) => r.constructor_id as number))];

  const { data: drivers } = await supabase.from('drivers').select('forename, surname').in('id', driverIds);
  const { data: constructors } = await supabase.from('constructors').select('name').in('id', constructorIds);

  const entities = new Map<string, string>();
  for (const d of drivers ?? []) {
    const full = `${d.forename as string} ${d.surname as string}`;
    entities.set(full.toLowerCase(), full);
    if ((d.surname as string).length > 3) entities.set((d.surname as string).toLowerCase(), full);
  }
  for (const c of constructors ?? []) {
    entities.set((c.name as string).toLowerCase(), c.name as string);
  }
  return [...entities.entries()].sort((a, b) => b[0].length - a[0].length);
}

function matchEntities(title: string, dictionary: [string, string][]) {
  const lower = title.toLowerCase();
  const found = new Set<string>();
  for (const [needle, canonical] of dictionary) {
    if (lower.includes(needle)) found.add(canonical);
  }
  return [...found];
}

// Called by the Cloudflare cron (custom-worker.ts) every 4h. Same Bearer CRON_SECRET check
// as /api/digest/send -- no separate auth mechanism invented for this route.
export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();

  const [dictionary, feedResults] = await Promise.all([
    loadEntityDictionary(supabase),
    Promise.all(FEEDS.map(fetchFeed)),
  ]);

  // An item published before this can never enter the scoring window -- lib/beagleCounts.ts
  // counts a 7-day span of coalesce(published_at, fetched_at) -- so storing it is dead
  // weight. Without the cutoff every feed's whole visible backlog lands on the first run
  // (that's the 681-row spike on 2026-09-18), and the archive-deep feeds make that scale
  // with back-catalogue size rather than with how much news happened: 442 F1 Beyond The
  // Grid episodes, 262 RacingNews365 items. Measured across these 50 feeds, the cutoff
  // drops a run from 1,883 rows to 860.
  //
  // Items with no parseable pubDate are kept: they coalesce to fetched_at and do count.
  const cutoff = Date.now() - SCORING_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const rows = feedResults.flatMap((feed) =>
    feed.items
      .filter((item) => !item.pubDate || item.pubDate.getTime() >= cutoff)
      .map((item) => ({
        source_name: feed.name,
        title: item.title,
        link: item.link,
        entity_tags: matchEntities(item.title, dictionary),
        published_at: item.pubDate ? item.pubDate.toISOString() : null,
      }))
  );

  if (rows.length === 0) {
    return NextResponse.json({ inserted: 0, feedsFailed: feedResults.filter((f) => f.error).map((f) => f.name) });
  }

  // ignoreDuplicates relies on the `link` unique constraint -- first-seen entity_tags for
  // an item stick, matching the migration's documented dedup behavior.
  const { error } = await supabase
    .from('beagle_items')
    .upsert(rows, { onConflict: 'link', ignoreDuplicates: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    fetched: rows.length,
    feedsFailed: feedResults.filter((f) => f.error).map((f) => f.name),
  });
}
