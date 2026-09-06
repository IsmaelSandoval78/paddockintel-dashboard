import type { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';

export type T = Awaited<ReturnType<typeof getTranslations>>;

export function PageHeader({ sectionCode, title, sub }: { sectionCode: string; title: string; sub?: string }) {
  return (
    <div className="h-12 px-5 border-b border-border flex items-center gap-3 bg-bg">
      <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] shrink-0">
        06 · {sectionCode} ·
      </span>
      <h1
        className="text-[clamp(1.15rem,2vw,1.8rem)] uppercase leading-none tracking-[-0.03em] truncate"
        style={{ fontFamily: 'var(--pi-display)' }}
      >
        {title}
      </h1>
      {sub && (
        <span className="font-mono text-[10px] text-text-3 tracking-[0.1em] uppercase ml-1 shrink-0 hidden md:block">
          {sub}
        </span>
      )}
    </div>
  );
}

export function SubBar({ t, updated }: { t: T; updated?: boolean }) {
  return (
    <div className="h-9 px-5 border-b border-border flex items-center bg-bg">
      <Link
        href="/records"
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-terracotta transition-colors duration-150 no-underline"
      >
        ← {t('back')}
      </Link>
      {updated && (
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] ml-auto hidden md:block">
          {t('updated')}
        </span>
      )}
    </div>
  );
}

export function OtherRecordsNav({
  t,
  title,
  siblings,
}: {
  t: T;
  title: string;
  siblings: { slug: string; title: string }[];
}) {
  return (
    <div className="border-t border-border px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
      <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em]">{title} ·</span>
      {siblings.map((s) => (
        <Link
          key={s.slug}
          href={`/records/${s.slug}`}
          className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-2 hover:text-terracotta transition-colors duration-150 no-underline"
        >
          {s.title}
        </Link>
      ))}
    </div>
  );
}
