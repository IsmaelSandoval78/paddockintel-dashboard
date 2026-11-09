import { renderArticle } from './articleView';

export { generateMetadata } from './articleView';

// Served from the ISR cache and re-rendered at most every five minutes, so an ingested
// correction is live within that window (decided 2026-11-09, mobile LCP). Nothing in a
// free article's render may read headers or cookies, or every request renders again.
export const revalidate = 300;

// No paths at build time: each one renders on its first request and is then served from the
// ISR cache (Next: an empty generateStaticParams opts a dynamic route into on-demand ISR;
// without it the route is rendered per request).
export function generateStaticParams() {
  return [];
}

type PageParams = Promise<{ locale: string; slug: string }>;

export default async function ArticlePage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  return renderArticle(locale, slug, false);
}
