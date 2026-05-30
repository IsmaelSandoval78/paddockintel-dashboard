import { createClient } from '@supabase/supabase-js';

// Valores defensivos para que el motor gráfico NUNCA colapse en local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ozcmecoaofolbrzhlhum.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96Y21lY29hb2ZvbGJyemhsaHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMTAxNjUsImV4cCI6MjA5NTU4NjE2NX0.p4kaSuGnkOwJzZ-6eolAFP7QyX8nTtuyoyjSSg07qC8';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export interface Database {
  public: {
    Tables: {
      seasons: { Row: { year: number; url: string }; Insert: any; Update: any };
      circuits: { Row: { circuit_id: string; name: string; location: string; country: string; lat: number; lng: number; url: string }; Insert: any; Update: any };
      drivers: { Row: { driver_id: string; permanent_number: string; code: string; forename: string; surname: string; dob: string; nationality: string; url: string; driver_ref: string }; Insert: any; Update: any };
      constructors: { Row: { constructor_id: string; constructor_ref: string; name: string; nationality: string; url: string }; Insert: any; Update: any };
      races: { Row: { race_id: number; year: number; round: number; circuit_id: string; name: string; date: string; time: string; url: string }; Insert: any; Update: any };
      results: { Row: { result_id: number; race_id: number; driver_id: string; constructor_id: string; number: number; grid: number; position: number; position_text: string; position_order: number; points: number; lobs: number; time: string; milliseconds: number; fastest_lap: number; rank: number; fastest_lap_time: string; fastest_lap_speed: string; status_id: number }; Insert: any; Update: any };
      qualifying: { Row: { qualy_id: number; race_id: number; driver_id: string; constructor_id: string; number: number; position: number; q1: string; q2: string; q3: string }; Insert: any; Update: any };
      pit_stops: { Row: { race_id: number; driver_id: string; stop: number; lap: number; time: string; duration: string; milliseconds: number }; Insert: any; Update: any };
      lap_times: { Row: { race_id: number; driver_id: string; lap: number; position: number; time: string; milliseconds: number }; Insert: any; Update: any };
      driver_standings: { Row: { standings_id: number; race_id: number; driver_id: string; points: number; position: number; position_text: string; wins: number }; Insert: any; Update: any };
      constructor_standings: { Row: { standings_id: number; race_id: number; constructor_id: string; points: number; position: number; position_text: string; wins: number }; Insert: any; Update: any };
      sprint_results: { Row: { sprint_result_id: number; race_id: number; driver_id: string; constructor_id: string; number: number; grid: number; position: number; points: number; time: string; milliseconds: number }; Insert: any; Update: any };
      status: { Row: { status_id: number; status: string }; Insert: any; Update: any };
      gemini_insights: { Row: { insight_id: string; entity_type: 'driver' | 'circuit' | 'constructor'; entity_id: string; locale: 'en' | 'es' | 'pt'; content: string; updated_at: string }; Insert: any; Update: any };
    };
  };
}