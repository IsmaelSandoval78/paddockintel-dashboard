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
    <nav
      aria-label={t('depthAria')}
      className="grid grid-flow-col auto-cols-fr sm:inline-flex self-stretch sm:self-start gap-1 p-1 rounded-[18px] sm:rounded-full bg-[rgba(14,13,18,0.45)] border border-[rgba(255,255,255,0.14)]"
    >
      {DEPTH_ORDER.filter((d) => present.has(d)).map((depth) => {
        const suffix = DEPTH_PATH[depth];
        const href = suffix ? `/glossary/${slug}/${suffix}` : `/glossary/${slug}`;
        const isActive = depth === activeDepth;
        return (
          <Link
            key={depth}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`min-h-10 inline-flex items-center justify-center text-center px-2 sm:px-4 py-2 rounded-[14px] sm:rounded-full text-[13px] sm:text-[14px] font-semibold transition-colors duration-150 ${
              isActive
                ? 'bg-[color:var(--dusk-ink)] text-[color:var(--dusk-ground)]'
                : 'text-[#EADBD6] hover:text-[color:var(--dusk-peach)]'
            }`}
          >
            {t(`depth.${depth}`)}
          </Link>
        );
      })}
    </nav>
  );
}
