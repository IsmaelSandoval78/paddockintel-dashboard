'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from '@/lib/i18n/navigation';
import type { ArchiveSeasonSummary } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger);

const eraDefinitions = [
  { key: 'founding', start: 1950, end: 1959, number: '01' },
  { key: 'rearEngine', start: 1960, end: 1969, number: '02' },
  { key: 'aero', start: 1970, end: 1979, number: '03' },
  { key: 'turbo', start: 1980, end: 1988, number: '04' },
  { key: 'electronic', start: 1989, end: 1999, number: '05' },
  { key: 'v10v8', start: 2000, end: 2009, number: '06' },
  { key: 'blown', start: 2010, end: 2013, number: '07' },
  { key: 'hybrid', start: 2014, end: 2021, number: '08' },
  { key: 'groundEffect', start: 2022, end: Number.POSITIVE_INFINITY, number: '09' },
] as const;

interface ArchiveExperienceProps {
  seasons: ArchiveSeasonSummary[];
  initialYear: number;
}

export default function ArchiveExperience({ seasons, initialYear }: ArchiveExperienceProps) {
  const t = useTranslations('archive');
  const rootRef = useRef<HTMLElement>(null);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [activeEra, setActiveEra] = useState<string>(eraDefinitions.at(-1)?.key ?? 'groundEffect');
  const [motionOk, setMotionOk] = useState(false);

  const firstYear = seasons[0]?.year ?? 1950;
  const lastYear = seasons.at(-1)?.year ?? initialYear;
  const selectedSeason = seasons.find((season) => season.year === selectedYear) ?? seasons.at(-1) ?? null;
  const seasonByYear = useMemo(() => new Map(seasons.map((season) => [season.year, season])), [seasons]);
  const eras = eraDefinitions.map((era) => ({
    ...era,
    end: Number.isFinite(era.end) ? era.end : lastYear,
    seasons: seasons.filter((season) => season.year >= era.start && season.year <= era.end),
  }));

  useEffect(() => {
    const allowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Environment preference is only available after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMotionOk(allowed);
  }, []);

  useEffect(() => {
    const sections = eraDefinitions
      .map((era) => document.getElementById(`era-${era.key}`))
      .filter((section): section is HTMLElement => section !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const key = visible?.target.getAttribute('data-era-key');
        if (key) setActiveEra(key);
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.15, 0.4] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!motionOk) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.archive-era').forEach((era) => {
        const title = era.querySelector('.archive-era-title');
        const years = era.querySelectorAll('.archive-year');
        gsap.from(title, {
          y: 42,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power4.out',
          scrollTrigger: { trigger: era, start: 'top 78%', once: true },
        });
        gsap.from(years, {
          y: 24,
          autoAlpha: 0,
          duration: 0.55,
          stagger: 0.035,
          ease: 'power3.out',
          scrollTrigger: { trigger: years[0] ?? era, start: 'top 86%', once: true },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk]);

  function selectSeason(year: number) {
    setSelectedYear(year);
    const url = new URL(window.location.href);
    url.searchParams.set('year', String(year));
    window.history.replaceState({}, '', url);
    window.setTimeout(() => {
      document.getElementById(`season-focus-${year}`)?.scrollIntoView({
        behavior: motionOk ? 'smooth' : 'auto',
        block: 'center',
      });
    }, 40);
  }

  if (!selectedSeason) return null;

  return (
    <main ref={rootRef} className="bg-bg">
      <header
        className="relative min-h-[78svh] overflow-hidden border-b border-border px-5 py-10 md:px-10 md:py-16 flex flex-col justify-between"
        style={{ background: 'var(--navy)', color: 'var(--text-on-accent)' }}
      >
        <div className="flex items-center justify-between font-mono text-[9px] md:text-[10px] uppercase tracking-[0.18em] text-text-2-on-accent">
          <span>{t('eyebrow')}</span>
          <span>{t('seasonCount', { count: seasons.length })}</span>
        </div>

        <div className="my-14">
          <p className="max-w-[38rem] font-prose text-sm md:text-base leading-relaxed text-text-2-on-accent">
            {t('intro')}
          </p>
          <h1
            className="mt-7 uppercase leading-[0.78] whitespace-nowrap text-[clamp(46px,15vw,270px)]"
            style={{ fontFamily: 'var(--pi-display)', letterSpacing: '-0.07em' }}
          >
            {firstYear}<span className="text-terracotta">—</span>{lastYear}
          </h1>
        </div>

        <div className="flex flex-col gap-5 border-t border-border-on-accent pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-2-on-accent">
              {t('instruction')}
            </p>
            <p className="mt-2 font-prose text-lg md:text-2xl">{t('promise')}</p>
          </div>
          <a href="#era-founding" className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-on-accent">
            {t('begin')} ↓
          </a>
        </div>
      </header>

      <div className="relative grid lg:grid-cols-[13rem_1fr]">
        <nav
          className="hidden lg:flex sticky top-12 h-[calc(100svh-3rem)] flex-col justify-center gap-3 border-r border-border px-6"
          aria-label={t('eraNavigation')}
        >
          {eras.map((era) => {
            const isActive = activeEra === era.key;
            return (
              <a
                key={era.key}
                href={`#era-${era.key}`}
                className="group grid grid-cols-[1.5rem_1fr] items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors"
                style={{ color: isActive ? 'var(--terracotta)' : 'var(--text-2)' }}
                aria-current={isActive ? 'location' : undefined}
              >
                <span>{era.number}</span>
                <span className="truncate">{t(`eras.${era.key}.title`)}</span>
              </a>
            );
          })}
        </nav>

        <div>
          {eras.map((era) => (
            <section
              key={era.key}
              id={`era-${era.key}`}
              data-era-key={era.key}
              className="archive-era scroll-mt-20 border-b border-border px-5 py-14 md:px-10 md:py-24"
            >
              <div className="grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(18rem,1fr)] md:items-end">
                <div className="relative">
                  <span
                    className="absolute -left-2 -top-12 select-none text-[clamp(90px,14vw,190px)] leading-none text-terracotta opacity-[0.10]"
                    style={{ fontFamily: 'var(--pi-display)' }}
                    aria-hidden="true"
                  >
                    {era.number}
                  </span>
                  <p className="relative font-mono text-[9px] md:text-[10px] uppercase tracking-[0.18em] text-text-2">
                    {era.number} · {era.start}—{era.end}
                  </p>
                  <h2
                    className="archive-era-title relative mt-4 uppercase leading-[0.88] text-[clamp(42px,7vw,102px)]"
                    style={{ fontFamily: 'var(--pi-display)', letterSpacing: '-0.045em' }}
                  >
                    {t(`eras.${era.key}.title`)}
                  </h2>
                </div>
                <p className="max-w-[38rem] font-prose text-sm md:text-base leading-relaxed text-text-2">
                  {t(`eras.${era.key}.copy`)}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 border-l border-t border-border">
                {era.seasons.map((season) => {
                  const isSelected = selectedYear === season.year;
                  return (
                    <button
                      key={season.year}
                      type="button"
                      onClick={() => selectSeason(season.year)}
                      aria-pressed={isSelected}
                      className="archive-year group min-h-32 border-r border-b border-border p-4 text-left transition-colors duration-200"
                      style={{
                        background: isSelected ? 'var(--terracotta)' : 'transparent',
                        color: isSelected ? 'var(--text-on-accent)' : 'var(--text-1)',
                      }}
                    >
                      <span className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em] opacity-70">
                        {season.inProgress ? t('live') : t('season')}
                        {season.inProgress && (
                          <span
                            className="pulse-red h-1.5 w-1.5 rounded-full"
                            style={{ background: isSelected ? 'var(--text-on-accent)' : 'var(--terracotta)' }}
                          />
                        )}
                      </span>
                      <span
                        className="mt-4 block text-[clamp(28px,3.2vw,48px)] leading-none tabular-nums"
                        style={{ fontFamily: 'var(--pi-display)', letterSpacing: '-0.04em' }}
                      >
                        {season.year}
                      </span>
                      <span className="mt-3 block truncate font-mono text-[9px] uppercase tracking-[0.08em] opacity-70">
                        {season.championDriver?.name ?? t('awaitingData')}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedSeason.year >= era.start && selectedSeason.year <= era.end && (
                <SeasonFocus
                  key={selectedSeason.year}
                  season={seasonByYear.get(selectedSeason.year) ?? selectedSeason}
                />
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function SeasonFocus({
  season,
}: {
  season: ArchiveSeasonSummary;
}) {
  const t = useTranslations('archive');
  return (
    <div
      id={`season-focus-${season.year}`}
      className="mt-8 scroll-mt-24 border border-border p-5 md:p-8"
      style={{ background: 'var(--surface-raised)' }}
    >
      <div className="flex items-center justify-between border-b border-border pb-4 font-mono text-[9px] uppercase tracking-[0.16em] text-text-2">
        <span>{season.inProgress ? t('seasonFocus.liveTitle') : t('seasonFocus.title')}</span>
        <span>{season.year}</span>
      </div>

      <div className="grid gap-8 py-7 md:grid-cols-[0.8fr_1.2fr] md:items-end">
        <span
          className="tabular-nums leading-[0.78] text-[clamp(72px,13vw,190px)] text-terracotta"
          style={{ fontFamily: 'var(--pi-display)', letterSpacing: '-0.07em' }}
          aria-hidden="true"
        >
          {season.year}
        </span>

        <div className="grid grid-cols-2 gap-x-6 gap-y-7">
          <Stat label={t('seasonFocus.races')} value={String(season.completedRaces || season.raceCount)} />
          <Stat label={t('seasonFocus.winners')} value={String(season.uniqueWinners)} />
          <EntityStat
            label={season.inProgress ? t('seasonFocus.driverLeader') : t('seasonFocus.driverChampion')}
            entity={season.championDriver}
            href={season.championDriver ? `/drivers/${season.championDriver.ref}` : null}
            fallback={t('awaitingData')}
          />
          <EntityStat
            label={season.inProgress ? t('seasonFocus.constructorLeader') : t('seasonFocus.constructorChampion')}
            entity={season.championConstructor}
            href={season.championConstructor ? `/constructors/${season.championConstructor.ref}` : null}
            fallback={season.year < 1958 ? t('seasonFocus.notAwarded') : t('awaitingData')}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-2">{label}</p>
      <p className="mt-2 font-display text-3xl md:text-5xl leading-none">{value}</p>
    </div>
  );
}

function EntityStat({
  label,
  entity,
  href,
  fallback,
}: {
  label: string;
  entity: ArchiveSeasonSummary['championDriver'];
  href: string | null;
  fallback: string;
}) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-2">{label}</p>
      {entity && href ? (
        <Link href={href} className="group mt-2 inline-flex items-end gap-2 font-display text-lg md:text-2xl uppercase leading-none">
          {entity.name}
          <span className="font-mono text-xs text-terracotta transition-transform group-hover:translate-x-1" aria-hidden="true">↗</span>
        </Link>
      ) : (
        <p className="mt-2 font-prose text-sm text-text-2">{fallback}</p>
      )}
    </div>
  );
}
