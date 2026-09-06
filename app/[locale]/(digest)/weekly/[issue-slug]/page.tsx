import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string; 'issue-slug': string }>;

type DigestItem = {
  id: string;
  source_name: string;
  source_url: string;
  headline: string;
  our_summary: string;
  published_at: string;
};

async function getIssue(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('digest_issues')
    .select('id, slug, published_at, intro_synthesis')
    .eq('slug', slug)
    .eq('series', 'newsletter')
    .single();
  return data;
}

async function getItems(issueId: string): Promise<DigestItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('digest_items')
    .select('id, source_name, source_url, headline, our_summary, published_at')
    .eq('issue_id', issueId)
    .order('published_at', { ascending: true });
  return (data ?? []) as DigestItem[];
}

function formatDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function issueNumber(slug: string): string {
  const m = slug.match(/vol-(\d+)/i);
  return m ? m[1].padStart(2, '0') : '01';
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { 'issue-slug': slug } = await params;
  const issue = await getIssue(slug);
  if (!issue) return { title: 'Weekly Digest — PaddockIntel' };
  return {
    title: `Digest Vol.${issueNumber(slug as string)} — PaddockIntel`,
    description: (issue.intro_synthesis as string).slice(0, 145),
  };
}

export default async function DigestIssuePage({ params }: { params: PageParams }) {
  const { 'issue-slug': slug } = await params;

  const issue = await getIssue(slug);
  if (!issue) notFound();

  const items = await getItems(issue.id as string);
  const volNum = issueNumber(slug);

  return (
    <main className="bg-bg min-h-screen">

      {/* Editorial header */}
      <header className="border-b border-border" style={{ background: 'var(--surface-raised)' }}>
        <div className="max-w-4xl mx-auto px-5 py-10 md:py-14">

          {/* Eyebrow */}
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-2 mb-6">
            PaddockIntel Digest · Vol.{volNum} · {formatDate(issue.published_at as string)}
          </p>

          {/* Issue title — derived from synthesis lead */}
          <h1
            className="uppercase text-text-1 leading-[0.92] tracking-[-0.03em] mb-8"
            style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.6rem, 5vw, 3.8rem)' }}
          >
            F1 Economics Weekly
          </h1>

          {/* Synthesis paragraph */}
          <p
            className="text-text-1 leading-relaxed max-w-2xl"
            style={{ fontFamily: 'var(--pi-sans)', fontSize: '0.9375rem', lineHeight: '1.75' }}
          >
            {issue.intro_synthesis as string}
          </p>

        </div>
      </header>

      {/* Items list */}
      <div className="max-w-4xl mx-auto">

        <p className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 border-b border-border-subtle">
          {items.length} sources this week
        </p>

        <ol>
          {items.map((item, i) => (
            <li
              key={item.id}
              className={`border-b border-border-subtle ${i % 2 === 1 ? 'bg-surface-raised' : ''}`}
            >
              <div className="px-5 py-6 flex gap-5 items-start">

                {/* Item number */}
                <span className="font-mono text-[11px] text-text-3 tabular-nums pt-0.5 w-5 shrink-0 select-none">
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Source chip */}
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-2 block">
                    {item.source_name}
                  </span>

                  {/* Headline */}
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-prose font-semibold text-text-1 leading-snug mb-2 hover:text-terracotta transition-colors duration-150"
                    style={{ fontSize: '0.9375rem' }}
                  >
                    {item.headline}
                  </a>

                  {/* Our take */}
                  <p
                    className="text-text-2 leading-relaxed"
                    style={{ fontFamily: 'var(--pi-sans)', fontSize: '0.875rem', lineHeight: '1.65' }}
                  >
                    {item.our_summary}
                  </p>

                  {/* Source link */}
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block font-mono text-[10px] uppercase tracking-[0.1em] text-terracotta hover:underline"
                  >
                    Read source →
                  </a>
                </div>

              </div>
            </li>
          ))}
        </ol>

        {/* Footer */}
        <div className="px-5 py-8 border-t border-border-subtle flex items-center justify-between gap-4 flex-wrap">
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-3">
            Curated by{' '}
            <Link href="/about" className="text-text-1 hover:text-terracotta transition-colors duration-150">
              Ismael Sandoval
            </Link>
            {' '}· PaddockIntel
          </p>
          <Link
            href="/weekly"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 hover:text-terracotta transition-colors duration-150"
          >
            ← All issues
          </Link>
        </div>

      </div>
    </main>
  );
}
