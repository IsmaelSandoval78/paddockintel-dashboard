const REPO_BASE =
  'https://raw.githubusercontent.com/julesr0y/f1-circuits-svg/main';

// Ergast circuit_ref values that don't resolve via simple underscore→hyphen transform
const OVERRIDES: Record<string, string> = {
  albert_park:      'melbourne',
  americas:         'austin',
  red_bull_ring:    'spielberg',
  spa:              'spa-francorchamps',
  losail:           'lusail',
  rodriguez:        'mexico-city',
  vegas:            'las-vegas',
  villeneuve:       'montreal',
  magny_cours:      'magny-cours',
  brands_hatch:     'brands-hatch',
  long_beach:       'long-beach',
  paul_ricard:      'paul-ricard',
  east_london:      'east-london',
  ain_diab:         'ain-diab',
  buenos_aires:     'buenos-aires',
  caesars_palace:   'caesars-palace',
  clermont_ferrand: 'clermont-ferrand',
  marina_bay:       'marina-bay',
  watkins_glen:     'watkins-glen',
  yas_marina:       'yas-marina',
  mont_tremblant:   'mont-tremblant',
};

function toRepoId(circuitRef: string): string {
  return OVERRIDES[circuitRef] ?? circuitRef.replace(/_/g, '-');
}

interface CircuitEntry {
  id: string;
  layouts: Array<{ layoutId: string; seasons: string }>;
}

function latestLayoutId(entry: CircuitEntry): string {
  let best = entry.layouts[0].layoutId;
  let bestYear = -1;
  for (const layout of entry.layouts) {
    const years = layout.seasons.match(/\d{4}/g) ?? [];
    if (years.length) {
      const max = Math.max(...years.map(Number));
      if (max > bestYear) { bestYear = max; best = layout.layoutId; }
    }
  }
  return best;
}

export interface TrackPathData {
  path: string;
  viewBox: string;
}

export async function fetchTrackPathData(
  circuitRef: string
): Promise<TrackPathData | null> {
  try {
    const indexRes = await fetch(`${REPO_BASE}/circuits.json`, {
      cache: 'force-cache',
    });
    if (!indexRes.ok) return null;

    const index: CircuitEntry[] = await indexRes.json();
    const repoId = toRepoId(circuitRef);
    const entry = index.find((c) => c.id === repoId);
    if (!entry) return null;

    const layoutId = latestLayoutId(entry);
    const svgUrl = `${REPO_BASE}/circuits/minimal/black-outline/${layoutId}.svg`;
    const svgRes = await fetch(svgUrl, { cache: 'force-cache' });
    if (!svgRes.ok) return null;

    const svg = await svgRes.text();
    const pathMatch = svg.match(/\bd="([^"]+)"/);
    if (!pathMatch) return null;

    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    const viewBox = viewBoxMatch?.[1] ?? '0 0 500 500';

    return { path: pathMatch[1], viewBox };
  } catch {
    return null;
  }
}
