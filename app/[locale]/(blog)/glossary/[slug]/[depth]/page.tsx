import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTermMetadata, TermPageBody } from '../../TermPageBody';
import type { GlossaryDepth } from '../../data';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string; slug: string; depth: string }>;

// URL segment -> db depth. 'eli5' has no URL segment (it's the base /glossary/[slug]),
// so only these two are ever valid here.
const URL_DEPTH: Record<string, GlossaryDepth> = {
  technical: 'technical',
  'fia-regulation': 'fia',
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, slug, depth } = await params;
  const dbDepth = URL_DEPTH[depth];
  if (!dbDepth) return { title: 'Glossary — PaddockIntel' };
  return getTermMetadata(locale, slug, dbDepth);
}

export default async function GlossaryTermLayerPage({ params }: { params: PageParams }) {
  const { locale, slug, depth } = await params;
  const dbDepth = URL_DEPTH[depth];
  if (!dbDepth) notFound();
  return <TermPageBody locale={locale} slug={slug} depth={dbDepth} />;
}
