import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string; slug: string }>;

async function getArticle(locale: string, slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('articles')
    .select('title, meta_description, body_markdown, published_at')
    .eq('locale', locale)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  return data;
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticle(locale, slug);
  if (!article) return { title: 'Article — PaddockIntel' };
  return {
    title: `${article.title as string} — PaddockIntel`,
    description: (article.meta_description as string) ?? undefined,
  };
}

export default async function ArticlePage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  const article = await getArticle(locale, slug);
  if (!article) notFound();

  return (
    <main className="bg-bg min-h-screen px-5 py-12 max-w-2xl mx-auto">
      <h1
        className="text-[2rem] uppercase text-text-1"
        style={{ fontFamily: 'var(--pi-display)' }}
      >
        {article.title as string}
      </h1>
      <article className="mt-8 whitespace-pre-wrap font-sans text-text-1">
        {article.body_markdown as string}
      </article>
    </main>
  );
}
