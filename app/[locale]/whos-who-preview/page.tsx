import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import XProfileEmbed from '@/components/whos-who/XProfileEmbed';

export const metadata: Metadata = {
  title: 'Who\'s Who — Fase 1 smoke test',
  robots: { index: false, follow: false },
};

export const revalidate = 3600;

async function getExpert(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('experts')
    .select('name, role, x_handle, credibility_note')
    .eq('slug', slug)
    .single();
  return data;
}

export default async function WhosWhoPreviewPage() {
  const expert = await getExpert('dieter-rencken');
  if (!expert || !expert.x_handle) notFound();

  return (
    <main className="bg-bg min-h-screen px-5 py-12 max-w-2xl mx-auto">
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 border-b border-border pb-3 mb-8">
        Who&apos;s Who — Fase 1 smoke test (no linkeada, no pública)
      </p>

      <h1 className="font-display text-2xl uppercase text-text-1">{expert.name}</h1>
      <p className="font-prose text-sm text-text-2 mt-1">{expert.role}</p>
      {expert.credibility_note && (
        <p className="font-prose text-sm text-text-2 mt-1 italic">{expert.credibility_note}</p>
      )}

      <div className="mt-8">
        <XProfileEmbed handle={expert.x_handle} />
      </div>
    </main>
  );
}
