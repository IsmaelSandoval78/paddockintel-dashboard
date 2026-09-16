import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';

// Overrides whatever metadata the route that called notFound() had already
// resolved (e.g. a blog [slug] page's generateMetadata sets an "Article"
// title before finding out the slug doesn't exist) — without this the browser
// tab keeps that stale title even though the page itself renders this 404.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notFound');
  return {
    title: `${t('label')} — PaddockIntel`,
    robots: { index: false, follow: true },
  };
}

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <main className="min-h-[70vh] bg-bg flex items-center justify-center px-5 py-20">
      <div className="text-center max-w-md">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3 mb-5">
          {t('eyebrow')}
        </p>

        <p
          className="leading-none text-terracotta"
          style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(4.5rem, 16vw, 8rem)' }}
        >
          404
        </p>

        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-2 mt-3 mb-7">
          {t('label')}
        </p>

        <p
          className="text-text-2 leading-relaxed mb-9"
          style={{ fontFamily: 'var(--pi-prose)', fontSize: '0.9375rem' }}
        >
          {t('body')}
        </p>

        <Link
          href="/"
          className="inline-block font-mono text-[11px] uppercase tracking-[0.1em] border border-border px-5 py-2.5 text-text-1 hover:border-terracotta hover:text-terracotta transition-colors duration-150"
        >
          {t('cta')} →
        </Link>
      </div>
    </main>
  );
}
