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
}
