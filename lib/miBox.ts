// Mi Box — personal panel, no accounts (CONCEPT-V2.md §4). A single client-writable cookie
// (not httpOnly) so both the browser (instant follow/unfollow) and Server Components (SSR
// personalized ordering, no flash-of-unordered-content after hydration) read the same state.

export const MI_BOX_COOKIE = 'pi_box';
const MAX_FOLLOWED = 12; // keeps the cookie small; also a sane personal-list size

export interface MiBoxState {
  number: number | null; // personal number, 2-3 digits like a real car number
  drivers: string[];     // driver_ref, most-recently-followed first
  constructors: string[]; // constructor_ref, most-recently-followed first
}

export const EMPTY_MI_BOX: MiBoxState = { number: null, drivers: [], constructors: [] };

export function parseMiBox(raw: string | undefined | null): MiBoxState {
  if (!raw) return EMPTY_MI_BOX;
  try {
    const parsed = JSON.parse(raw) as Partial<MiBoxState>;
    return {
      number: typeof parsed.number === 'number' ? parsed.number : null,
      drivers: Array.isArray(parsed.drivers) ? parsed.drivers.filter((v) => typeof v === 'string') : [],
      constructors: Array.isArray(parsed.constructors) ? parsed.constructors.filter((v) => typeof v === 'string') : [],
    };
  } catch {
    return EMPTY_MI_BOX;
  }
}

export function serializeMiBox(state: MiBoxState): string {
  return JSON.stringify(state);
}

export function toggleFollowed(state: MiBoxState, kind: 'driver' | 'constructor', ref: string): MiBoxState {
  const key = kind === 'driver' ? 'drivers' : 'constructors';
  const list = state[key];
  const next = list.includes(ref)
    ? list.filter((r) => r !== ref)
    : [ref, ...list].slice(0, MAX_FOLLOWED);
  return { ...state, [key]: next };
}

export function withPersonalNumber(state: MiBoxState, number: number): MiBoxState {
  return { ...state, number };
}

// Not crypto-random on purpose — this is a personal flourish (like picking a car number),
// not an identity/security token. 2-99, mirrors the real range F1 permanent numbers use.
export function randomPersonalNumber(): number {
  return Math.floor(Math.random() * 98) + 2;
}
