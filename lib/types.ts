export interface DriverSelectorRow {
  driver_id: number;
  driver_ref: string;
  forename: string;
  surname: string;
  nationality: string;
  wins: number;
}

export interface ConstructorSelectorRow {
  constructor_id: number;
  constructor_ref: string;
  name: string;
  nationality: string;
  wins: number;
}

export interface CompareDriverSeason {
  year: number;
  constructor_ref: string;
  constructor_name: string;
  wins: number;
  podiums: number;
  races: number;
  position: number | null;
  points: number;
}

export interface CompareDriverData {
  driver_id: number;
  driver_ref: string;
  forename: string;
  surname: string;
  code: string | null;
  nationality: string;
  first_year: number;
  last_year: number;
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  fastest_laps: number;
  championships: number;
  win_pct: number;
  seasons: CompareDriverSeason[];
}

export interface CompareConstructorSeason {
  year: number;
  wins: number;
  podiums: number;
  races: number;
  position: number | null;
  points: number;
}

export interface CompareConstructorData {
  constructor_id: number;
  constructor_ref: string;
  name: string;
  nationality: string;
  first_year: number;
  last_year: number;
  races: number;
  wins: number;
  podiums: number;
  fastest_laps: number;
  championships: number;
  win_pct: number;
  seasons: CompareConstructorSeason[];
}

export interface Circuit {
  id: number;
  circuit_ref: string;
  name: string;
  location: string;
  country: string;
  lat: number;
  lng: number;
  is_active: boolean;
}

export interface CalendarStop {
  round: number;
  circuitId: number;
  lat: number;
  lng: number;
  name: string;
}

export interface DriverRow {
  driver_id: number;
  forename: string;
  surname: string;
  driver_ref: string;
  nationality: string;
  position: number;
  points: number;
  wins: number;
  podiums: number;
  races: number;
}

export interface ConstructorRow {
  constructor_id: number;
  constructor_ref: string;
  name: string;
  nationality: string;
  position: number;
  points: number;
  wins: number;
}

export interface DriverSeasonRow {
  driver_id: number;
  driver_ref: string;
  forename: string;
  surname: string;
  code: string | null;
  nationality: string;
  position: number;
  points: number;
  wins: number;
  podiums: number;
  races: number;
  constructor_id: number;
  constructor_name: string;
  constructor_ref: string;
}

export interface DriverAllTimeRow {
  driver_id: number;
  driver_ref: string;
  forename: string;
  surname: string;
  nationality: string;
  first_year: number;
  last_year: number;
  wins: number;
  races: number;
  championships: number;
  number: number | null;
}

export interface DriverDetail {
  driver_id: number;
  driver_ref: string;
  forename: string;
  surname: string;
  code: string | null;
  nationality: string;
  dob: string | null;
  first_year: number;
  last_year: number;
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  fastest_laps: number;
  season_2026: {
    position: number;
    points: number;
    wins: number;
    constructor_name: string;
  } | null;
  last_5_results: Array<{
    race_name: string;
    year: number;
    position: number | null;
    points: number;
  }>;
  career_arc: Array<{
    year: number;
    points: number;
    position: number | null;
  }>;
}

export interface ConstructorSeasonRow {
  constructor_id: number;
  constructor_ref: string;
  name: string;
  nationality: string;
  position: number;
  points: number;
  wins: number;
  podiums: number;
  races: number;
}

export interface ConstructorAllTimeRow {
  constructor_id: number;
  constructor_ref: string;
  name: string;
  nationality: string;
  first_year: number;
  last_year: number;
  wins: number;
  races: number;
  championships: number;
}

export interface ConstructorDetail {
  constructor_id: number;
  constructor_ref: string;
  name: string;
  nationality: string;
  first_year: number;
  last_year: number;
  races: number;
  wins: number;
  podiums: number;
  fastest_laps: number;
  season_2026: {
    position: number;
    points: number;
    wins: number;
  } | null;
  last_5_results: Array<{
    race_name: string;
    year: number;
    best_position: number | null;
    points: number;
  }>;
}

export interface CircuitInfo {
  name: string;
  location: string;
  country: string;
  lat: number;
  lng: number;
  circuit_ref: string;
  first_year: number | null;
  total_races: number;
  champions: Array<{ year: number; forename: string; surname: string }>;
  fastest_pit: {
    constructor: string;
    duration: string;
    year: number;
  } | null;
  fastest_lap: {
    forename: string;
    surname: string;
    time: string;
    year: number;
  } | null;
  top_constructor: { name: string; wins: number } | null;
  top_win_driver: { forename: string; surname: string; wins: number } | null;
  top_pole_driver: { forename: string; surname: string; poles: number } | null;
  avg_winner_grid: number | null;
  track_path: { path: string; viewBox: string } | null;
}

// ─── Home page types ──────────────────────────────────────────────

export interface HomeNextRace {
  round: number;
  name: string;
  date: string;
  circuit_name: string;
  location: string;
  country: string;
  circuit_ref: string;
  days_remaining: number;
  last_winner: { year: number; forename: string; surname: string; constructor: string } | null;
  circuit_laps: number | null;
  circuit_lap_record: { time: string; forename: string; surname: string; year: number } | null;
  circuit_svg: { path: string; viewBox: string } | null;
  qualifying_grid: Array<{
    position: number;
    forename: string;
    surname: string;
    constructor_ref: string;
    constructor_name: string;
    q_time: string | null;
  }> | null;
}

export interface HomeLastRaceData {
  race_id: number;
  round: number;
  year: number;
  name: string;
  date: string;
  circuit_name: string;
  circuit_ref: string;
  circuit_svg: { path: string; viewBox: string } | null;
  podium: Array<{
    position: number;
    forename: string;
    surname: string;
    constructor_name: string;
    constructor_ref: string;
    time: string | null;
  }>;
  fastest_lap: { forename: string; surname: string; time: string } | null;
  fastest_pit: { forename: string; surname: string; constructor_name: string; duration: string } | null;
  retirements: Array<{
    forename: string;
    surname: string;
    constructor_name: string;
    lap: number;
    status: string;
  }>;
}

export interface HomeDriverRow {
  driver_id: number;
  driver_ref: string;
  position: number;
  forename: string;
  surname: string;
  code: string | null;
  number: number | null;
  points: number;
  wins: number;
  constructor_ref: string;
  constructor_name: string;
  podiums: number;
  win_rate: number; // career wins / career races (0–1)
}

export interface HomeConstructorOfDay {
  constructor_id: number;
  constructor_ref: string;
  name: string;
  nationality: string;
  races: number;
  wins: number;
  first_year: number;
  last_year: number;
}

export interface HomeConstructorRow {
  constructor_id: number;
  constructor_ref: string;
  name: string;
  position: number;
  points: number;
  wins: number;
  podiums: number;
}

export interface HomeStreaksData {
  totalRounds2026: number;
  driverActive: {
    driver_id: number;
    forename: string;
    surname: string;
    constructor_ref: string;
    streak: number;
  } | null;
  constructorActive: {
    constructor_id: number;
    name: string;
    constructor_ref: string;
    streak: number;
  } | null;
  driverAllTime: { forename: string; surname: string; streak: number; year: number } | null;
  constructorAllTime: { name: string; streak: number; year: number } | null;
}

export interface HomeScorecardData {
  driver_id: number;
  driver_ref: string;
  forename: string;
  surname: string;
  nationality: string;
  code: string | null;
  number: number | null;
  wins: number;
  podiums: number;
  poles: number;
  fastest_laps: number;
  races: number;
  dnfs: number;
}
