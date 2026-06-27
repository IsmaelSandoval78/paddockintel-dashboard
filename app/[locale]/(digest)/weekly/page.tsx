import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import EmailCapture from '@/components/ui/EmailCapture';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Weekly Digest — PaddockIntel',
    description:
      'Curated F1 and motorsport economics news with original synthesis. Every week, verified sources and first-party analysis.',
  };
}

async function getIssues() {
  const supabase = createClient();
  const { data } = await supabase
    .from('digest_issues')
    .select('slug, published_at, intro_synthesis')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  return data ?? [];
}

export default async function DigestIndexPage() {
  const t = await getTranslations('digest');
  const format = await getFormatter();
  const issues = await getIssues();

  return (
    <main className="bg-bg min-h-screen">
      {/* Hero */}
      <div className="border-b border-border px-5 py-10 max-w-4xl mx-auto">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-2">
          {t('kicker')}
        </p>
        <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] leading-[0.92] tracking-[-0.03em] text-text-1 mt-3 mb-5">
          F1 economics,<br />weekly.
        </h1>
        <p className="font-sans text-text-2 leading-relaxed max-w-md mb-6">
          Verified sources. Original synthesis. No wire-service summaries — every issue has a first-person economic angle on what happened in and around F1.
        </p>
        <EmailCapture className="max-w-sm" />
        <p className="mt-2 font-mono text-[10px] text-text-3">
          By subscribing you agree to the{' '}
          <Link href="/privacy" className="underline hover:text-red transition-colors duration-150">
            privacy policy
          </Link>
          .
        </p>
      </div>

      {/* Issue list */}
      <div className="max-w-4xl mx-auto">
        <p className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 border-b border-border-subtle">
          {t('sources')} — {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
        </p>

        {issues.length === 0 ? (
          <p className="px-5 py-12 font-mono text-[11px] text-text-3 uppercase tracking-[0.1em]">
            No issues published yet.
          </p>
        ) : (
          <ul>
            {issues.map((issue, i) => (
              <li key={issue.slug as string} className="border-b border-border-subtle">
                <Link
                  href={`/weekly/${issue.slug as string}`}
                  className="group flex items-start gap-5 px-5 py-5 hover:bg-surface-raised transition-colors duration-150"
                >
                  <span className="font-mono text-[11px] text-text-3 tabular-nums pt-0.5 w-5 shrink-0">
                    {String(issues.length - i).padStart(2, '0')}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 mb-1">
                      {format.dateTime(new Date(issue.published_at as string), { dateStyle: 'long' })}
                    </span>
                    <span className="block font-sans text-text-1 leading-snug line-clamp-2">
                      {issue.intro_synthesis as string}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-red opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0 pt-0.5">
                    Read →
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
