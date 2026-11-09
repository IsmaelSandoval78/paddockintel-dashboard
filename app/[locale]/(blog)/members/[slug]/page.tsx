import type { Metadata } from 'next';
import { generateMetadata as articleMetadata, renderArticle } from '../../[slug]/articleView';

// Per-request twin of a paywalled article for subscribed or signed-in readers (see
// renderArticle in ../../[slug]/articleView.tsx). Not indexed: its canonical is the article's own URL.
export const dynamic = 'force-dynamic';

type PageParams = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const meta = await articleMetadata({ params });
  return { ...meta, robots: { index: false, follow: true } };
}

export default async function MembersArticlePage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  return renderArticle(locale, slug, true);
}
