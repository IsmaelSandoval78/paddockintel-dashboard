// Beagle — sniffs out what's being talked about across the F1 press right now.
// Pulls the ~15 credible F1 RSS feeds (see docs/advisors/SEO-EXPERT.md's source-authority
// notes for how this tier list was chosen), tags each item against the current season's real
// drivers/constructors (pulled fresh from Supabase, never hardcoded), and ranks entities by
// how many independent outlets are covering them right now.
//
// This is an editorial radar, not a publisher: it never writes to Supabase. Read the report,
// pick what's worth a real digest_items entry (with a genuine our_summary from the actual
// article, per DATA-EXPERT.md), and add those by hand or via a separate insert script.
//
// Usage: node scripts/beagle.mjs [hours]   (default: last 48h)

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const HOURS = Number(process.argv[2]) > 0 ? Number(process.argv[2]) : 48;

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
];

function decodeEntities(str) {
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

function tag(xml, tagName) {
  const m = xml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i'));
  return m ? decodeEntities(m[1]) : null;
}

function parseFeed(xml) {
  const items = [];
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

async function fetchFeed({ name, url }) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (PaddockIntel news radar; +https://paddockintel.com)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { name, url, items: [], error: `HTTP ${res.status}` };
    const xml = await res.text();
    const items = parseFeed(xml);
    return { name, url, items, error: null };
  } catch (e) {
    return { name, url, items: [], error: e.message };
  }
}

function readEnvVar(env, name) {
  return env.match(new RegExp(`${name}=(.*)`))[1].trim().replace(/^"(.*)"$/, '$1');
}

async function loadEntityDictionary() {
  const env = fs.readFileSync('.env.local', 'utf-8');
  const supaUrl = readEnvVar(env, 'NEXT_PUBLIC_SUPABASE_URL');
  const key = readEnvVar(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const sb = createClient(supaUrl, key);

  const { data: races } = await sb.from('races').select('id').eq('year', 2026);
  const raceIds = (races ?? []).map((r) => r.id);

  const { data: results } = await sb
    .from('results')
    .select('driver_id, constructor_id')
    .in('race_id', raceIds);

  const driverIds = [...new Set((results ?? []).map((r) => r.driver_id))];
  const constructorIds = [...new Set((results ?? []).map((r) => r.constructor_id))];

  const { data: drivers } = await sb.from('drivers').select('forename, surname').in('id', driverIds);
  const { data: constructors } = await sb.from('constructors').select('name').in('id', constructorIds);

  const entities = new Map(); // matchable string (lowercase) -> canonical tag
  for (const d of drivers ?? []) {
    const full = `${d.forename} ${d.surname}`;
    entities.set(full.toLowerCase(), full);
    if (d.surname.length > 3) entities.set(d.surname.toLowerCase(), full);
  }
  for (const c of constructors ?? []) {
    entities.set(c.name.toLowerCase(), c.name);
  }
  // Longest match first avoids "Max" matching before "Max Verstappen" is checked.
  return [...entities.entries()].sort((a, b) => b[0].length - a[0].length);
}

function matchEntities(title, dictionary) {
  const lower = title.toLowerCase();
  const found = new Set();
  for (const [needle, canonical] of dictionary) {
    if (lower.includes(needle)) found.add(canonical);
  }
  return [...found];
}

async function main() {
  console.log(`Fetching ${FEEDS.length} feeds, entity dictionary from Supabase (2026 season)...\n`);

  const [dictionary, feedResults] = await Promise.all([
    loadEntityDictionary(),
    Promise.all(FEEDS.map(fetchFeed)),
  ]);

  const failed = feedResults.filter((f) => f.error);
  if (failed.length > 0) {
    console.log('Feeds that failed this run:');
    failed.forEach((f) => console.log(`  ✗ ${f.name}: ${f.error}`));
    console.log('');
  }

  const cutoff = Date.now() - HOURS * 60 * 60 * 1000;
  const allItems = [];
  for (const feed of feedResults) {
    for (const item of feed.items) {
      if (item.pubDate && item.pubDate.getTime() < cutoff) continue;
      const entities = matchEntities(item.title, dictionary);
      allItems.push({ source: feed.name, ...item, entities });
    }
  }

  console.log(`${allItems.length} items across ${feedResults.filter((f) => !f.error).length} working feeds in the last ${HOURS}h.\n`);

  // Rank entities by how many DISTINCT SOURCES are covering them right now.
  const entitySources = new Map(); // entity -> Set(source)
  for (const item of allItems) {
    for (const e of item.entities) {
      if (!entitySources.has(e)) entitySources.set(e, new Set());
      entitySources.get(e).add(item.source);
    }
  }

  const ranked = [...entitySources.entries()]
    .map(([entity, sources]) => ({ entity, sourceCount: sources.size }))
    .filter((e) => e.sourceCount >= 2)
    .sort((a, b) => b.sourceCount - a.sourceCount);

  console.log('=== Cross-covered right now (2+ independent sources) ===\n');
  for (const { entity, sourceCount } of ranked) {
    console.log(`${entity} — ${sourceCount} sources`);
    const items = allItems
      .filter((i) => i.entities.includes(entity))
      .sort((a, b) => (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0));
    for (const i of items) {
      const when = i.pubDate ? i.pubDate.toISOString().slice(0, 16).replace('T', ' ') : '?';
      console.log(`  [${i.source}] ${i.title}  (${when})`);
      console.log(`    ${i.link}`);
    }
    console.log('');
  }

  const singleSource = allItems.filter((i) => i.entities.every((e) => entitySources.get(e).size < 2));
  console.log(`=== Single-source items (${singleSource.length}) — lower editorial signal, not printed by default ===`);
  console.log('Re-run with DEBUG=1 to see them.\n');
  if (process.env.DEBUG) {
    for (const i of singleSource) {
      console.log(`  [${i.source}] ${i.title}`);
      console.log(`    ${i.link}`);
    }
  }
}

main();
