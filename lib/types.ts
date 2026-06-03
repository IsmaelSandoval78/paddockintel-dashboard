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
  is_2026: boolean;
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
}

export interface HomeDriverRow {
  driver_id: number;
  position: number;
  forename: string;
  surname: string;
  code: string | null;
  points: number;
  wins: number;
  constructor_ref: string;
  constructor_name: string;
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
