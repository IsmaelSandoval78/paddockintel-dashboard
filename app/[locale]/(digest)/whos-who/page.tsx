import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('whosWho');
  return {
    title: `${t('title')} — PaddockIntel`,
    description: t('description'),
  };
}

export const revalidate = 3600;

type Category = 'investigation' | 'construction' | 'critique' | 'context' | 'data';

const CATEGORY_ORDER: Category[] = ['investigation', 'construction', 'critique', 'context', 'data'];

type PickRow = {
  post_url: string;
  topic: string | null;
  takeaway: string;
  created_at: string;
  experts: {
    name: string;
    slug: string;
    category: Category;
    role: string;
    credibility_note: string | null;
    x_handle: string;
  } | null;
};

async function getPicks() {
  const supabase = createClient();
  const { data } = await supabase
    .from('expert_picks')
    .select('post_url, topic, takeaway, created_at, experts(name, slug, category, role, credibility_note, x_handle)')
    .order('created_at', { ascending: false })
    .returns<PickRow[]>();
  return data ?? [];
}

export default async function WhosWhoPage() {
  const [picks, t, tCategories] = await Promise.all([
    getPicks(),
    getTranslations('whosWho'),
    getTranslations('whosWho.categories'),
  ]);

  const byCategory = new Map<Category, PickRow[]>();
  for (const pick of picks) {
    if (!pick.experts) continue;
    const list = byCategory.get(pick.experts.category) ?? [];
    list.push(pick);
    byCategory.set(pick.experts.category, list);
  }

  return (
    <main className="bg-bg min-h-screen">
      <div className="h-12 border-b border-border flex items-center px-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-2">
          {t('kicker')} · {picks.length}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-10">
        <h1
          className="uppercase leading-none tracking-[-0.02em] text-text-1"
          style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}
        >
          {t('title')}
        </h1>
        <p className="font-prose text-[15px] text-text-2 leading-relaxed mt-3 max-w-md">
          {t('description')}
        </p>

        {CATEGORY_ORDER.map((category) => {
          const categoryPicks = byCategory.get(category);
          if (!categoryPicks || categoryPicks.length === 0) return null;

          return (
            <section key={category} className="mt-12">
              <div className="flex items-baseline justify-between border-b border-border pb-2">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-1">
                  {tCategories(`${category}.label`)}
                </h2>
                <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-text-3">
                  {categoryPicks.length}
                </p>
              </div>
              <p className="font-mono text-[10px] text-text-3 mt-2 mb-5">{tCategories(`${category}.lens`)}</p>

              <div className="flex flex-col gap-6">
                {categoryPicks.map((pick) => {
                  const expert = pick.experts!;
                  return (
                    <article
                      key={pick.post_url}
                      className="border border-border-subtle rounded-sm p-5 bg-surface-raised"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-[15px] font-semibold text-text-1">{expert.name}</h3>
                        <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-3 shrink-0">
                          @{expert.x_handle}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.05em] text-text-2 mt-1">
                        {expert.role}
                      </p>

                      <p className="font-prose text-[14px] text-text-1 leading-relaxed mt-4">
                        {pick.takeaway}
                      </p>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-subtle">
                        {pick.topic && (
                          <span
                            className="font-mono text-[9px] uppercase tracking-[0.08em]"
                            style={{ color: 'var(--terracotta)' }}
                          >
                            {pick.topic}
                          </span>
                        )}
                        <a
                          href={pick.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[10px] uppercase tracking-[0.08em] ml-auto hover:opacity-70 transition-opacity duration-150"
                          style={{ color: 'var(--terracotta)' }}
                        >
                          {t('readOriginal')}
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}

        <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-text-3 mt-12 pt-6 border-t border-border-subtle">
          SOURCE: SUPABASE (experts, expert_picks)
        </p>
      </div>
    </main>
  );
}
