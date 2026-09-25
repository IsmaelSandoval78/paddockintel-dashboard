import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  FEED_LOCALES,
  MAGAZINE_BASE,
  articleAlternates,
  feedContentLocale,
  feedLanguageUrls,
  magazinePath,
  withXDefault,
} from './magazineUrl.ts';

const root = process.cwd();

test('magazine absolute URLs use the www host', () => {
  assert.equal(MAGAZINE_BASE, 'https://www.paddockintel.com');
  assert.equal(
    magazinePath('en', '/feed/sainz-williams-q3-baku-2026/'),
    'https://www.paddockintel.com/feed/sainz-williams-q3-baku-2026/',
  );
  assert.equal(
    magazinePath('es', '/feed/sainz-williams-q3-baku-2026'),
    'https://www.paddockintel.com/es/feed/sainz-williams-q3-baku-2026/',
  );
  assert.equal(magazinePath('pt', '/glossary/cost-cap'), 'https://www.paddockintel.com/pt/glossary/cost-cap/');
});

test('Feed hreflang is EN, ES, and x-default only', () => {
  const languages = feedLanguageUrls('/feed/sainz-williams-q3-baku-2026/');
  assert.deepEqual(Object.keys(languages).sort(), ['en', 'es', 'x-default']);
  assert.equal(languages.en, 'https://www.paddockintel.com/feed/sainz-williams-q3-baku-2026/');
  assert.equal(languages.es, 'https://www.paddockintel.com/es/feed/sainz-williams-q3-baku-2026/');
  assert.equal(languages['x-default'], languages.en);
  assert.deepEqual([...FEED_LOCALES], ['en', 'es']);
  assert.equal(feedContentLocale('pt'), 'en');
  assert.equal(feedContentLocale('es'), 'es');
});

test('article canonical is self-referencing on www, hreflang uses each locale slug', () => {
  const versions = [
    { locale: 'en', slug: 'azerbaijan-gp-2026-qualifying-antonelli-16th' },
    { locale: 'es', slug: 'clasificacion-gp-azerbaiyan-2026-antonelli-16' },
    { locale: 'pt', slug: 'classificacao-gp-azerbaijao-2026-antonelli-16' },
  ];
  const en = articleAlternates('en', versions[0].slug, versions);
  assert.equal(
    en.canonical,
    'https://www.paddockintel.com/azerbaijan-gp-2026-qualifying-antonelli-16th/',
  );
  assert.equal(en.languages.en, en.canonical);
  assert.equal(
    en.languages.es,
    'https://www.paddockintel.com/es/clasificacion-gp-azerbaiyan-2026-antonelli-16/',
  );
  assert.equal(
    en.languages.pt,
    'https://www.paddockintel.com/pt/classificacao-gp-azerbaijao-2026-antonelli-16/',
  );
  assert.equal(en.languages['x-default'], en.languages.en);
  assert.equal(en.canonical.includes('https://paddockintel.com/'), false);

  const es = articleAlternates('es', versions[1].slug, versions);
  assert.equal(
    es.canonical,
    'https://www.paddockintel.com/es/clasificacion-gp-azerbaiyan-2026-antonelli-16/',
  );
  const pt = articleAlternates('pt', versions[2].slug, versions);
  assert.equal(
    pt.canonical,
    'https://www.paddockintel.com/pt/classificacao-gp-azerbaijao-2026-antonelli-16/',
  );
});

test('x-default follows English and is omitted when English is absent', () => {
  assert.equal(
    withXDefault({
      es: 'https://www.paddockintel.com/es/example/',
      pt: 'https://www.paddockintel.com/pt/example/',
    })['x-default'],
    undefined,
  );
  const withEn = withXDefault({
    en: 'https://www.paddockintel.com/example/',
    pt: 'https://www.paddockintel.com/pt/example/',
  });
  assert.equal(withEn['x-default'], withEn.en);
});

test('Hook & Deliver source copy names no database tables', () => {
  const banned = ['constructor_standings', 'constructor_stats', 'driver_circuit_wins', '{tables}'];
  const expected: Record<string, string> = {
    en: 'Source: Formula 1 official results / PaddockIntel data',
    es: 'Fuente: resultados oficiales de F1 / datos de PaddockIntel',
    pt: 'Fonte: resultados oficiais da F1 / dados da PaddockIntel',
  };
  for (const locale of ['en', 'es', 'pt']) {
    const messages = JSON.parse(readFileSync(join(root, 'locales', `${locale}.json`), 'utf8')) as {
      feed: { hookDeliver: { source: string } };
    };
    const source = messages.feed.hookDeliver.source;
    assert.equal(source, expected[locale]);
    for (const token of banned) {
      assert.equal(source.includes(token), false, `${locale} source contains ${token}`);
    }
  }
});
