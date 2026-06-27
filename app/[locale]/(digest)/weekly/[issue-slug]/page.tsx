import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import ShareButton from '@/components/ui/ShareButton';
import { Link } from '@/lib/i18n/navigation';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string; 'issue-slug': string }>;

async function getIssue(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('digest_issues')
    .select('id, slug, published_at, intro_synthesis')
    .eq('slug', slug)
    .single();
  return data;
}

async function getItems(issueId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('digest_items')
    .select('id, source_name, source_url, headline, our_summary, published_at')
    .eq('issue_id', issueId)
    .order('published_at', { ascending: true });
  return data ?? [];
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { 'issue-slug': slug } = await params;
  const issue = await getIssue(slug);
  if (!issue) return { title: 'Weekly Digest — PaddockIntel' };
  return {
    title: `Weekly Digest — PaddockIntel`,
    description: issue.intro_synthesis as string,
  };
}

export default async function DigestIssuePage({ params }: { params: PageParams }) {
  const { 'issue-slug': slug } = await params;
  const t = await getTranslations('digest');
  const format = await getFormatter();

  const issue = await getIssue(slug);
  if (!issue) notFound();

  const items = await getItems(issue.id as string);

  return (
    <main className="bg-bg min-h-screen px-5 py-12 max-w-4xl mx-auto">
      <p className="font-mono text-xs uppercase tracking-wide text-text-2">
        {t('kicker')} · {format.dateTime(new Date(issue.published_at as string), { dateStyle: 'long' })}
      </p>

      <p className="font-sans text-text-1 mt-6 leading-relaxed max-w-2xl">
        {issue.intro_synthesis as string}
      </p>

      <h2 className="font-mono text-xs uppercase tracking-wide text-text-2 mt-12 mb-4">
        {t('sources')}
      </h2>

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-border-subtle">
        {items.map((item) => (
          <li key={item.id as string} className="bg-bg border-r border-b border-border-subtle p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wide text-text-2">
                {item.source_name as string}
              </span>
              <ShareButton url={item.source_url as string} title={item.headline as string} />
            </div>
            <h3 className="font-sans font-bold text-text-1 leading-snug">
              <a
                href={item.source_url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red transition-colors"
              >
                {item.headline as string}
              </a>
            </h3>
            <p className="font-sans text-text-2 text-sm leading-relaxed">
              {item.our_summary as string}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-12 pt-6 border-t border-border-subtle font-mono text-[11px] uppercase tracking-[0.06em] text-text-3">
        Curated by{' '}
        <Link href="/about" className="text-text-1 hover:text-red transition-colors duration-150">
          Ismael Sandoval
        </Link>
      </p>
    </main>
  );
}
