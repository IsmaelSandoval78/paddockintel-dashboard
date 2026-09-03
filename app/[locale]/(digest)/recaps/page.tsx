import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Recap Series — PaddockIntel',
    description:
      'Retrospective, week-by-week coverage of the 2026 F1 season published after the fact — separate from the live weekly digest.',
  };
}

async function getRecaps() {
  const supabase = createClient();
  const { data } = await supabase
    .from('digest_issues')
    .select('slug, published_at, intro_synthesis')
    .eq('status', 'published')
    .eq('series', 'recap')
    .order('published_at', { ascending: false });
  return data ?? [];
}

export default async function RecapsIndexPage() {
  const t = await getTranslations('recaps');
  const format = await getFormatter();
  const recaps = await getRecaps();

  return (
    <main className="bg-bg min-h-screen">
      {/* Hero */}
      <div className="border-b border-border px-5 py-10 max-w-4xl mx-auto">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-2">
          {t('kicker')}
        </p>
        <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] leading-[0.92] tracking-[-0.03em] text-text-1 mt-3 mb-5">
          F1 economics,<br />revisited.
        </h1>
        <p className="font-prose text-text-2 leading-relaxed max-w-md mb-6">
          {t('index.description')}
        </p>
        <p className="font-mono text-[10px] text-text-3">
          Looking for the live weekly digest?{' '}
          <Link href="/weekly" className="underline hover:text-terracotta transition-colors duration-150">
            Go to Weekly Digest
          </Link>
          .
        </p>
      </div>

      {/* Recap list */}
      <div className="max-w-4xl mx-auto">
        <p className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 border-b border-border-subtle">
          {t('sources')} — {recaps.length} {recaps.length === 1 ? t('index.issue') : t('index.issues')}
        </p>

        {recaps.length === 0 ? (
          <p className="px-5 py-12 font-mono text-[11px] text-text-3 uppercase tracking-[0.1em]">
            {t('index.noIssues')}
          </p>
        ) : (
          <ul>
            {recaps.map((recap, i) => (
              <li key={recap.slug as string} className="border-b border-border-subtle">
                <Link
                  href={`/recaps/${recap.slug as string}`}
                  className="group flex items-start gap-5 px-5 py-5 hover:bg-surface-raised transition-colors duration-150"
                >
                  <span className="font-mono text-[11px] text-text-3 tabular-nums pt-0.5 w-5 shrink-0">
                    {String(recaps.length - i).padStart(2, '0')}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 mb-1">
                      {t('detail.published')} {format.dateTime(new Date(recap.published_at as string), { dateStyle: 'long' })}
                    </span>
                    <span className="block font-prose text-text-1 leading-snug line-clamp-2">
                      {recap.intro_synthesis as string}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-terracotta opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0 pt-0.5">
                    {t('index.read')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
