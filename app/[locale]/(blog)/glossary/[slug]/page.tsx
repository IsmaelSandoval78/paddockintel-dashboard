import type { Metadata } from 'next';
import { getTermMetadata, TermPageBody } from '../TermPageBody';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, slug } = await params;
  return getTermMetadata(locale, slug, 'eli5');
}

export default async function GlossaryTermPage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  return <TermPageBody locale={locale} slug={slug} depth="eli5" />;
}
