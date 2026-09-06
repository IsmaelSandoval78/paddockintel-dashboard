import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600;

type FeedItem = {
  id: string;
  source_name: string;
  source_url: string;
  headline: string;
  our_summary: string;
  entity_tags: string[];
  published_at: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('feed');
  return {
    title: `${t('title')} — PaddockIntel`,
    description: t('description'),
  };
}

async function getItems(): Promise<FeedItem[]> {
  const supabase = createClient();
  const { data: issues } = await supabase.from('digest_issues').select('id').eq('series', 'newsletter');
  const issueIds = (issues ?? []).map((i) => i.id as string);
  if (issueIds.length === 0) return [];

  const { data } = await supabase
    .from('digest_items')
    .select('id, source_name, source_url, headline, our_summary, entity_tags, published_at')
    .in('issue_id', issueIds)
    .order('published_at', { ascending: false });
  return (data ?? []) as FeedItem[];
}

function mostMentioned(items: FeedItem[]): { entity: string; count: number }[] {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const counts = new Map<string, number>();
  for (const item of items) {
    if (new Date(item.published_at).getTime() < cutoff) continue;
    for (const entity of item.entity_tags) {
      counts.set(entity, (counts.get(entity) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([entity, count]) => ({ entity, count }))
    .filter((e) => e.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export default async function FeedPage() {
  const t = await getTranslations('feed');
  const format = await getFormatter();
  const items = await getItems();
  const mentioned = mostMentioned(items);

  return (
    <main className="bg-bg min-h-screen">
      <div className="h-12 border-b border-border flex items-center px-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-2">
          {t('kicker')} · {items.length}
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-10 md:py-14">
        <h1
          className="uppercase leading-none tracking-[-0.02em] text-text-1"
          style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}
        >
          {t('title')}
        </h1>
        <p className="font-prose text-text-2 leading-relaxed max-w-lg mt-3">{t('description')}</p>

        {mentioned.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border-subtle">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 mb-3">
              {t('mostMentioned')}
            </p>
            <div className="flex flex-wrap gap-2">
              {mentioned.map(({ entity, count }) => (
                <span
                  key={entity}
                  className="font-mono text-[11px] uppercase tracking-[0.04em] border border-border-subtle rounded-sm px-2.5 py-1 text-text-1"
                >
                  {entity} <span style={{ color: 'var(--terracotta)' }}>×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        {items.length === 0 ? (
          <p className="px-5 py-12 font-mono text-[11px] text-text-3 uppercase tracking-[0.1em] border-t border-border-subtle">
            {t('noItems')}
          </p>
        ) : (
          <ol className="border-t border-border-subtle">
            {items.map((item, i) => (
              <li
                key={item.id}
                className={`border-b border-border-subtle ${i % 2 === 1 ? 'bg-surface-raised' : ''}`}
              >
                <div className="px-5 py-6 flex gap-5 items-start">
                  <span className="font-mono text-[11px] text-text-3 tabular-nums pt-0.5 w-5 shrink-0 select-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2">
                        {item.source_name}
                      </span>
                      <span className="text-text-3">·</span>
                      <span className="font-mono text-[10px] text-text-3">
                        {format.dateTime(new Date(item.published_at), { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block font-prose font-semibold text-text-1 leading-snug mb-2 hover:text-terracotta transition-colors duration-150"
                      style={{ fontSize: '0.9375rem' }}
                    >
                      {item.headline}
                    </a>

                    <p
                      className="text-text-2 leading-relaxed"
                      style={{ fontFamily: 'var(--pi-sans)', fontSize: '0.875rem', lineHeight: '1.65' }}
                    >
                      {item.our_summary}
                    </p>

                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      {item.entity_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {item.entity_tags.map((tag) => (
                            <span
                              key={tag}
                              className="font-mono text-[9px] uppercase tracking-[0.04em] text-text-3"
                            >
                              #{tag.replace(/\s+/g, '')}
                            </span>
                          ))}
                        </div>
                      )}
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10px] uppercase tracking-[0.1em] hover:underline ml-auto"
                        style={{ color: 'var(--terracotta)' }}
                      >
                        {t('readSource')}
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
