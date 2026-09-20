'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from './Hero';
import Ticker from './Ticker';
import LastRaceChapter from './LastRaceChapter';
import NextRaceChapter from './NextRaceChapter';
import TheGrid from './TheGrid';
import StreaksSection from './StreaksSection';
import FormGuideSection from './FormGuideSection';
import SeasonShapeSection from './SeasonShapeSection';
import ChampionshipGapSection from './ChampionshipGapSection';
import KineticFooter from './KineticFooter';
import MiBoxStrip from './MiBoxStrip';
import ChapterNavigator from './ChapterNavigator';
import ChapterPrelude from './ChapterPrelude';
import ArchiveThreshold from './ArchiveThreshold';
import ExploreChapter from './ExploreChapter';
import { useTranslations } from 'next-intl';
import type {
  HomeNextRace,
  HomeDriverRow,
  HomeLastRaceData,
  HomeStreaksData,
  HomeFormGuideData,
  HomeSeasonShapeData,
  HomeChampionshipGapData,
} from '@/lib/types';

gsap.registerPlugin(ScrollTrigger);

interface HomeExperienceProps {
  nextRace: HomeNextRace | null;
  lastRace: HomeLastRaceData | null;
  topDrivers: HomeDriverRow[];
  streaksData: HomeStreaksData | null;
  formGuideData: HomeFormGuideData;
  seasonShapeData: HomeSeasonShapeData;
  championshipGapData: HomeChampionshipGapData;
  leaderPodiumsSeason: number;
  round: number;
  year: number;
}

export default function HomeExperience({
  nextRace, lastRace, topDrivers, streaksData,
  formGuideData, seasonShapeData, championshipGapData, leaderPodiumsSeason,
  round, year,
}: HomeExperienceProps) {
  const t = useTranslations('hub.home.livingArchive');
  // motionOk = no reduced-motion preference. isMobile = coarse pointer.
  // Resolved on mount; SSR renders the static editorial fallback.
  const [env, setEnv] = useState<{ motionOk: boolean; isMobile: boolean } | null>(null);

  const cursorDot  = useRef<HTMLDivElement>(null);
  const cursorRing = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    // Must run post-mount: matching SSR's default here would mismatch the client's real preference.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnv({ motionOk, isMobile });
  }, []);

  // ── Custom cursor — desktop, motion allowed ──────────────────────
  useEffect(() => {
    if (!env || !env.motionOk || env.isMobile) return;
    if (!cursorDot.current || !cursorRing.current) return;

    document.body.classList.add('velocity-cursor');

    gsap.set([cursorDot.current, cursorRing.current], { xPercent: -50, yPercent: -50 });
    const xDot  = gsap.quickTo(cursorDot.current,  'x', { duration: 0.08, ease: 'power2.out' });
    const yDot  = gsap.quickTo(cursorDot.current,  'y', { duration: 0.08, ease: 'power2.out' });
    const xRing = gsap.quickTo(cursorRing.current, 'x', { duration: 0.45, ease: 'power3.out' });
    const yRing = gsap.quickTo(cursorRing.current, 'y', { duration: 0.45, ease: 'power3.out' });

    const onMove = (e: MouseEvent) => {
      xDot(e.clientX);  yDot(e.clientY);
      xRing(e.clientX); yRing(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a, button, [data-cursor]');
      gsap.to(cursorRing.current, {
        scale: target ? 2.2 : 1,
        opacity: target ? 0.9 : 0.5,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });

    return () => {
      document.body.classList.remove('velocity-cursor');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
    };
  }, [env]);

  // Refresh ScrollTrigger once everything mounted (fonts/layout settle)
  useEffect(() => {
    if (!env?.motionOk) return;
    const id = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => clearTimeout(id);
  }, [env]);

  const motionOk = env?.motionOk ?? false;
  const isMobile = env?.isMobile ?? true;
  const leader = topDrivers[0] ?? null;

  return (
    <main className="bg-bg">

      <ChapterNavigator />

      <div id="lights-out" data-archive-chapter className="scroll-mt-20">
        {leader && (
          <Hero
            leader={leader}
            round={round}
            year={year}
            motionOk={motionOk}
            isMobile={isMobile}
            gapToP2={championshipGapData.driver}
            seasonPodiums={leaderPodiumsSeason}
            seasonRaces={seasonShapeData.totalRaces}
          />
        )}

        <MiBoxStrip />
      </div>

      <div id="last-chapter" data-archive-chapter className="scroll-mt-20">
        <LastRaceChapter race={lastRace} motionOk={motionOk} />
      </div>

      <div id="next-on-calendar" data-archive-chapter className="scroll-mt-20">
        <NextRaceChapter race={nextRace} motionOk={motionOk} />
      </div>

      <div id="season-in-motion" data-archive-chapter className="scroll-mt-20">
        <ChapterPrelude
          number="04"
          eyebrow={t('season.eyebrow')}
          title={t('season.title')}
          copy={t('season.copy')}
          motionOk={motionOk}
        />

        <Ticker drivers={topDrivers} motionOk={motionOk} />

        <TheGrid drivers={topDrivers} motionOk={motionOk} />

        <StreaksSection data={streaksData} motionOk={motionOk} />

        <FormGuideSection data={formGuideData} motionOk={motionOk} />

        <SeasonShapeSection data={seasonShapeData} motionOk={motionOk} />

        <ChampionshipGapSection data={championshipGapData} motionOk={motionOk} />
      </div>

      <div id="enter-the-archive" data-archive-chapter className="scroll-mt-20">
        <ArchiveThreshold year={year} motionOk={motionOk} />
      </div>

      <div id="explore-the-archive" data-archive-chapter className="scroll-mt-20">
        <ExploreChapter />
      </div>

      <KineticFooter motionOk={motionOk} />

      {/* Custom cursor layer */}
      {env && env.motionOk && !env.isMobile && (
        <div className="fixed inset-0 pointer-events-none z-[9999]" aria-hidden="true">
          <div
            ref={cursorDot}
            className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--terracotta)' }}
          />
          <div
            ref={cursorRing}
            className="absolute top-0 left-0 w-7 h-7 rounded-full opacity-50"
            style={{ border: '1px solid var(--text-1)' }}
          />
        </div>
      )}
    </main>
  );
}
