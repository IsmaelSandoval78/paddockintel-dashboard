import trackPaths from '@/data/circuits-svg/track-paths.json';

// Track path data used to be fetched from https://raw.githubusercontent.com/
// julesr0y/f1-circuits-svg on every call — two of this function's four call
// sites have no ISR/revalidate, so that request ran on every real page view /
// API call. Confirmed in Cloudflare Workers Metrics as a ~145ms subrequest per
// invocation (the Workers runtime doesn't persist Next.js's fetch cache the
// way Vercel's Data Cache does, so every cold invocation re-fetched from
// scratch). track-paths.json is a static import — bundled at build time, zero
// network/filesystem I/O at request time, on any platform.
//
// track-paths.json is generated offline from data/circuits-svg/circuits.json
// + data/circuits-svg/svg/*.svg (both committed, downloaded once from the repo
// above). To update it — only needed if a real circuit's layout physically
// changes, a rare event — see the instructions at the top of
// scripts/regenerate-track-paths.ts.
//
// 9 of this project's 78 circuits have no entry (same as before this
// migration — they already returned null from the old GitHub fetch too,
// either because the external repo doesn't have that circuit at all, or
// because this project's circuit_ref for it doesn't match any id in the
// repo's index): boavista, charade, essarts, galvez, george, lemans, okayama,
// ricard, tremblant.

export interface TrackPathData {
  path: string;
  viewBox: string;
}

const TRACK_PATHS: Record<string, TrackPathData> = trackPaths;

export async function fetchTrackPathData(
  circuitRef: string
): Promise<TrackPathData | null> {
  return TRACK_PATHS[circuitRef] ?? null;
}
