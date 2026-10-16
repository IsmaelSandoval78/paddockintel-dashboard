// Links the first mention of each glossary term in an article body to that term's glossary page,
// so the glossary gets internal links from the pages Google already crawls. Search Console,
// 2026-10-16: 229 of 241 glossary URLs unindexed, nearly all "Discovered - currently not indexed",
// with almost no internal links pointing at them.
//
// Works on the markdown before rendering. Only running text is touched: headings, tables, block
// quotes, italic notes (corrections/updates), fenced code and figure markers are left alone, as is
// anything already inside a link, inline code, raw HTML or a bare URL. Each term is linked once,
// at most MAX_LINKS per article, and never if the article already links that term.

export type GlossaryLinkTerm = { slug: string; term: string };

const MAX_LINKS = 8;

// "Cost Cap" -> ["Cost Cap"]; "Tope de Gastos (Cost Cap)" -> ["Tope de Gastos", "Cost Cap"].
// A "vs." name ("Safety Car vs. Virtual Safety Car (VSC)") never appears in prose; only its short
// form is kept.
function aliases(term: string): string[] {
  const m = term.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  const parts = m ? [m[1], m[2]] : [term];
  return parts.map((p) => p.trim()).filter((p) => p.length >= 3 && !/\bvs\.?(\s|$)/i.test(p));
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// An all-caps alias (DRS, ATR, VSC) matches case-sensitively; anything else ignores case.
function aliasPattern(alias: string): RegExp {
  const flags = alias === alias.toUpperCase() ? 'u' : 'iu';
  return new RegExp(`(?<![\\p{L}\\p{N}_-])${escape(alias)}(?![\\p{L}\\p{N}_-])`, flags);
}

// Segments that must not be rewritten: links/images, inline code, HTML tags, bare URLs, figure markers.
const PROTECTED = /(!?\[[^\]]*\]\([^)]*\)|`[^`]*`|<[^>]+>|https?:\/\/\S+|\[\[[^\]]*\]\])/g;

function skipLine(line: string): boolean {
  const t = line.trim();
  return (
    t === '' ||
    t.startsWith('#') ||
    t.startsWith('|') ||
    t.startsWith('>') ||
    t.startsWith('[[') ||
    t.startsWith('<') ||
    (t.startsWith('*') && t.endsWith('*') && !t.startsWith('* ') && !t.startsWith('**'))
  );
}

function glossaryHref(locale: string, slug: string): string {
  return locale === 'en' ? `/glossary/${slug}/` : `/${locale}/glossary/${slug}/`;
}

// Replaces the first match of `re` outside protected segments of `line`; null when there is none.
function linkFirst(line: string, re: RegExp, href: string): string | null {
  let out = '';
  let last = 0;
  for (const m of line.matchAll(PROTECTED)) {
    const text = line.slice(last, m.index);
    const hit = text.match(re);
    if (hit && hit.index !== undefined) {
      return out + text.slice(0, hit.index) + `[${hit[0]}](${href})` + text.slice(hit.index + hit[0].length) + line.slice(m.index);
    }
    out += text + m[0];
    last = (m.index ?? 0) + m[0].length;
  }
  const text = line.slice(last);
  const hit = text.match(re);
  if (!hit || hit.index === undefined) return null;
  return out + text.slice(0, hit.index) + `[${hit[0]}](${href})` + text.slice(hit.index + hit[0].length);
}

export function linkGlossaryTerms(markdown: string, terms: GlossaryLinkTerm[], locale: string): string {
  const pending = terms
    .filter((t) => !markdown.includes(`/glossary/${t.slug}`))
    .map((t) => ({ slug: t.slug, patterns: aliases(t.term).sort((a, b) => b.length - a.length).map(aliasPattern) }))
    .filter((t) => t.patterns.length > 0);
  if (!pending.length) return markdown;

  const lines = markdown.split('\n');
  let inFence = false;
  let linked = 0;
  for (let i = 0; i < lines.length && linked < MAX_LINKS && pending.length; i++) {
    if (lines[i].trim().startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence || skipLine(lines[i])) continue;
    for (let k = 0; k < pending.length && linked < MAX_LINKS; ) {
      const term = pending[k];
      let next: string | null = null;
      for (const re of term.patterns) {
        next = linkFirst(lines[i], re, glossaryHref(locale, term.slug));
        if (next) break;
      }
      if (next) {
        lines[i] = next;
        linked++;
        pending.splice(k, 1);
      } else {
        k++;
      }
    }
  }
  return lines.join('\n');
}
