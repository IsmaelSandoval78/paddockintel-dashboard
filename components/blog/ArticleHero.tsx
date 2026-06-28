import ShareButton from '@/components/ui/ShareButton';

type Stat = { value: string; label: string; unit?: string };

interface ArticleHeroProps {
  title: string;
  tags: string[];
  publishedAt: string;
  readTime: number;
  pageUrl: string;
  locale: string;
  featuredStat?: Stat;
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === 'pt' ? 'pt-BR' : locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ArticleHero({
  title,
  tags,
  publishedAt,
  readTime,
  pageUrl,
  locale,
  featuredStat,
}: ArticleHeroProps) {
  const kicker = [
    tags[0] ?? '',
    publishedAt ? formatDate(publishedAt, locale) : '',
    `${readTime} min read`,
  ]
    .filter(Boolean)
    .join(' · ')
    .toUpperCase();

  return (
    <section
      className="border-b border-border"
      style={{ background: 'var(--surface-raised)' }}
    >
      <div className="max-w-5xl mx-auto px-5 py-12 md:py-16">

        {/* Kicker */}
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-2 mb-6 md:mb-8">
          {kicker}
        </p>

        {/* Title */}
        <h1
          className="uppercase text-text-1 leading-[0.9] tracking-[-0.03em]"
          style={{
            fontFamily: 'var(--pi-display)',
            fontSize: 'clamp(1.9rem, 6.5vw, 5.5rem)',
          }}
        >
          {title}
        </h1>

        {/* Rule */}
        <div className="border-t border-border mt-8 mb-8" />

        {/* Bottom row — featured stat + share */}
        <div className="flex items-end justify-between gap-8">
          {featuredStat ? (
            <div>
              <p
                className="tabular-nums leading-none tracking-[-0.04em]"
                style={{
                  fontFamily: 'var(--pi-display)',
                  fontSize: 'clamp(3.5rem, 12vw, 9rem)',
                  color: 'var(--red)',
                }}
              >
                {featuredStat.value}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-2 mt-3">
                {featuredStat.label}
              </p>
              {featuredStat.unit && (
                <p className="font-mono text-[10px] text-text-3 mt-0.5">
                  {featuredStat.unit}
                </p>
              )}
            </div>
          ) : (
            <div />
          )}
          <div className="shrink-0 self-start">
            <ShareButton url={pageUrl} title={title} />
          </div>
        </div>

      </div>
    </section>
  );
}
