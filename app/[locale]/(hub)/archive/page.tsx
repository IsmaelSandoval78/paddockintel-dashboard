import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import ArchiveExperience from '@/components/archive/living/ArchiveExperience';
import type { ArchiveSeasonSummary } from '@/lib/types';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string }>;
type PageSearchParams = Promise<{ year?: string | string[] }>;

async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: unknown[] | null }>,
): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data } = await build(from, from + pageSize - 1);
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

async function getArchiveData(): Promise<ArchiveSeasonSummary[]> {
  const supabase = createClient();

  const [races, drivers, constructors] = await Promise.all([
    fetchAllRows<{ id: number; year: number; round: number; circuit_id: number }>((from, to) =>
      supabase
        .from('races')
        .select('id, year, round, circuit_id')
        .gte('year', 1950)
        .order('id', { ascending: true })
        .range(from, to),
    ),
    fetchAllRows<{ id: number; driver_ref: string; forename: string; surname: string }>((from, to) =>
      supabase
        .from('drivers')
        .select('id, driver_ref, forename, surname')
        .order('id', { ascending: true })
        .range(from, to),
    ),
    fetchAllRows<{ id: number; constructor_ref: string; name: string }>((from, to) =>
      supabase
        .from('constructors')
        .select('id, constructor_ref, name')
        .order('id', { ascending: true })
        .range(from, to),
    ),
  ]);

  const [raceWinners, driverLeaders, constructorLeaders] = await Promise.all([
    fetchAllRows<{ race_id: number; driver_id: number; constructor_id: number }>((from, to) =>
      supabase
        .from('results')
        .select('race_id, driver_id, constructor_id')
        .eq('position', 1)
        .order('race_id', { ascending: true })
        .range(from, to),
    ),
    fetchAllRows<{ race_id: number; driver_id: number }>((from, to) =>
      supabase
        .from('driver_standings')
        .select('race_id, driver_id')
        .eq('position', 1)
        .order('race_id', { ascending: true })
        .range(from, to),
    ),
    fetchAllRows<{ race_id: number; constructor_id: number }>((from, to) =>
      supabase
        .from('constructor_standings')
        .select('race_id, constructor_id')
        .eq('position', 1)
        .order('race_id', { ascending: true })
        .range(from, to),
    ),
  ]);

  const raceById = new Map(races.map((race) => [race.id, race]));
  const driverById = new Map(drivers.map((driver) => [driver.id, driver]));
  const constructorById = new Map(constructors.map((constructor) => [constructor.id, constructor]));
  const years = [...new Set(races.map((race) => race.year))].sort((a, b) => a - b);
  const latestYear = years.at(-1) ?? new Date().getUTCFullYear();

  const winnersByYear = new Map<number, Set<number>>();
  const completedByYear = new Map<number, number>();
  for (const winner of raceWinners) {
    const race = raceById.get(winner.race_id);
    if (!race) continue;
    if (!winnersByYear.has(race.year)) winnersByYear.set(race.year, new Set());
    winnersByYear.get(race.year)?.add(winner.driver_id);
    completedByYear.set(race.year, (completedByYear.get(race.year) ?? 0) + 1);
  }

  const latestDriverByYear = new Map<number, { round: number; driverId: number }>();
  for (const standing of driverLeaders) {
    const race = raceById.get(standing.race_id);
    if (!race) continue;
    const current = latestDriverByYear.get(race.year);
    if (!current || race.round > current.round) {
      latestDriverByYear.set(race.year, { round: race.round, driverId: standing.driver_id });
    }
  }

  const latestConstructorByYear = new Map<number, { round: number; constructorId: number }>();
  for (const standing of constructorLeaders) {
    const race = raceById.get(standing.race_id);
    if (!race) continue;
    const current = latestConstructorByYear.get(race.year);
    if (!current || race.round > current.round) {
      latestConstructorByYear.set(race.year, { round: race.round, constructorId: standing.constructor_id });
    }
  }

  return years.map((year) => {
    const yearRaces = races.filter((race) => race.year === year);
    const driverStanding = latestDriverByYear.get(year);
    const constructorStanding = latestConstructorByYear.get(year);
    const driver = driverStanding ? driverById.get(driverStanding.driverId) : null;
    const constructor = constructorStanding ? constructorById.get(constructorStanding.constructorId) : null;
    const completedRaces = completedByYear.get(year) ?? 0;

    return {
      year,
      raceCount: yearRaces.length,
      completedRaces,
      uniqueWinners: winnersByYear.get(year)?.size ?? 0,
      championDriver: driver
        ? { id: driver.id, ref: driver.driver_ref, name: `${driver.forename} ${driver.surname}` }
        : null,
      championConstructor: constructor
        ? { id: constructor.id, ref: constructor.constructor_ref, name: constructor.name }
        : null,
      inProgress: year === latestYear && completedRaces < yearRaces.length,
    };
  });
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  await params;
  const t = await getTranslations('archive');
  return {
    title: `${t('metaTitle')} — PaddockIntel`,
    description: t('metaDescription'),
  };
}

export default async function ArchivePage({
  searchParams,
}: {
  params: PageParams;
  searchParams: PageSearchParams;
}) {
  const [seasons, query] = await Promise.all([getArchiveData(), searchParams]);
  const latestYear = seasons.at(-1)?.year ?? 2026;
  const requestedYear = Number(Array.isArray(query.year) ? query.year[0] : query.year);
  const initialYear = seasons.some((season) => season.year === requestedYear) ? requestedYear : latestYear;

  return <ArchiveExperience seasons={seasons} initialYear={initialYear} />;
}
