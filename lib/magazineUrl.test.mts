import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  FEED_LOCALES,
  MAGAZINE_BASE,
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
