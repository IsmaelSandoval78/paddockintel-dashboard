import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string; year: string }>;

async function getChapters(year: number, locale: string) {
  const supabase = createClient();

  const { data: races } = await supabase.from('races').select('id').eq('year', year);
  const raceIds = (races ?? []).map((r) => r.id as number);
  if (raceIds.length === 0) return [];

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, body_markdown, published_at')
    .in('race_id', raceIds)
    .eq('locale', locale)
    .eq('status', 'published')
    .order('published_at', { ascending: true });

  return articles ?? [];
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { year } = await params;
  return { title: `Season ${year} — PaddockIntel Book` };
}

export default async function BookSeasonPage({ params }: { params: PageParams }) {
  const { year, locale } = await params;
  const t = await getTranslations('book');

  const chapters = await getChapters(parseInt(year, 10), locale);
  if (chapters.length === 0) notFound();

  return (
    <main className="bg-white min-h-screen">
      <div className="max-w-[720px] mx-auto px-8 py-20">
        <p className="font-mono text-xs uppercase tracking-wide text-text-2">
          {t('kicker')} {year}
        </p>

        {chapters.map((chapter, i) => (
          <article key={chapter.id as number} className="mt-20 first:mt-12">
            <p className="font-display text-sm uppercase text-red">
              {t('chapter')} {i + 1}
            </p>
            <h1 className="font-display text-3xl text-text-1 mt-2 mb-8">
              {chapter.title as string}
            </h1>
            <div className="font-prose text-text-1 leading-[1.7] whitespace-pre-wrap">
              {chapter.body_markdown as string}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
