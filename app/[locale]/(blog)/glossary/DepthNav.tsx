import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import type { GlossaryDepth, GlossaryTermRow } from './data';

const DEPTH_ORDER: GlossaryDepth[] = ['eli5', 'technical', 'fia'];
const DEPTH_PATH: Record<GlossaryDepth, string | null> = {
  eli5: null, // base URL, no suffix
  technical: 'technical',
  fia: 'fia-regulation',
};

export async function DepthNav({
  slug,
  activeDepth,
  layers,
}: {
  slug: string;
  activeDepth: GlossaryDepth;
  layers: GlossaryTermRow[];
}) {
  if (layers.length < 2) return null; // legacy single-layer terms: no nav to show

  const t = await getTranslations('glossary');
  const present = new Set(layers.map((l) => l.depth));

  return (
    <nav className="flex gap-2 mb-8 -mt-2">
      {DEPTH_ORDER.filter((d) => present.has(d)).map((depth) => {
        const suffix = DEPTH_PATH[depth];
        const href = suffix ? `/glossary/${slug}/${suffix}` : `/glossary/${slug}`;
        const isActive = depth === activeDepth;
        return (
          <Link
            key={depth}
            href={href}
            className={`font-mono text-[11px] uppercase tracking-[0.06em] px-3 py-1.5 border transition-colors duration-150 ${
              isActive
                ? 'border-terracotta text-terracotta'
                : 'border-border text-text-2 hover:border-text-1 hover:text-text-1'
            }`}
          >
            {t(`depth.${depth}`)}
          </Link>
        );
      })}
    </nav>
  );
}
