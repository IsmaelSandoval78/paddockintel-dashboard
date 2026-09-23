// One syndication list for the radar (scripts/beagle.mjs) and the v0 scorer.
// Add a family here first. Do not copy this array into a second file.
//
// The Motorsport Network ships one story across its locale feeds. Items stay
// stored under their own source_name; only outlet counts collapse.
export const SYNDICATION_GROUPS = [[/^Motorsport\.com/, 'Motorsport Network']];

export function outletOf(sourceName) {
  for (const [pattern, outlet] of SYNDICATION_GROUPS) {
    if (pattern.test(sourceName)) return outlet;
  }
  return sourceName;
}
