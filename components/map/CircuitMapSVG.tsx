'use client';

import { useEffect, useMemo, useState } from 'react';
import { geoNaturalEarth1, geoPath, geoGraticule } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection } from 'geojson';
import type { Circuit } from '@/lib/types';

const W = 960;
const H = 500;

// ─── Per-region projection params ────────────────────────────────
// rotateLng: D3 rotate([lng,0]) centers the map at longitude -lng
const REGION_CONFIG: Record<string, { rotateLng: number; centerLat: number; scale: number }> = {
  all:              { rotateLng:   0, centerLat:  0,  scale: 153 },
  europe:           { rotateLng: -15, centerLat: 54,  scale: 620 },
  americas:         { rotateLng:  92, centerLat: 10,  scale: 360 },
  asia:             { rotateLng:-103, centerLat: 22,  scale: 390 },
  africaMiddleEast: { rotateLng: -23, centerLat:  3,  scale: 430 },
  oceania:          { rotateLng:-140, centerLat:-28,  scale: 580 },
};

function makeProjection(region: string) {
  const cfg = REGION_CONFIG[region] ?? REGION_CONFIG.all;
  return geoNaturalEarth1()
    .rotate([cfg.rotateLng, 0])
    .center([0, cfg.centerLat])
    .scale(cfg.scale)
    .translate([W / 2, H / 2]);
}

interface GeoData {
  countryPaths: string[];
  graticulePath: string;
}

interface Props {
  circuits: Circuit[];
  onSelect: (circuit: Circuit) => void;
  targetRegion: string;
  selectedId: number | null;
}

export default function CircuitMapSVG({ circuits, onSelect, targetRegion, selectedId }: Props) {
  const [geoData, setGeoData] = useState<Map<string, GeoData>>(new Map());
  const [activeRegion, setActiveRegion] = useState(targetRegion);
  const [animating, setAnimating] = useState(false);

  // Load TopoJSON once, pre-render paths for every region
  useEffect(() => {
    import('world-atlas/countries-110m.json').then((raw) => {
      const topo = raw.default as unknown as Topology<{ countries: GeometryCollection }>;
      const geo  = feature(topo, topo.objects.countries) as FeatureCollection;
      const graticule = geoGraticule().step([30, 30])();

      const map = new Map<string, GeoData>();
      for (const region of Object.keys(REGION_CONFIG)) {
        const proj = makeProjection(region);
        const path = geoPath(proj);
        map.set(region, {
          countryPaths: geo.features.map((f) => path(f as Parameters<typeof path>[0]) ?? '').filter(Boolean),
          graticulePath: path(graticule) ?? '',
        });
      }
      setGeoData(map);
    });
  }, []);

  // Crossfade on region change
  useEffect(() => {
    if (targetRegion === activeRegion) return;
    setAnimating(true);
    const t = setTimeout(() => {
      setActiveRegion(targetRegion);
      setAnimating(false);
    }, 180);
    return () => clearTimeout(t);
  }, [targetRegion]); // eslint-disable-line react-hooks/exhaustive-deps

  const data = geoData.get(activeRegion);
  const proj = useMemo(() => makeProjection(activeRegion), [activeRegion]);

  const dots = useMemo(() =>
    circuits.flatMap((c) => {
      const pos = proj([c.lng, c.lat]);
      return pos ? [{ ...c, x: pos[0], y: pos[1] }] : [];
    }),
    [circuits, proj]
  );

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        style={{
          maxHeight: '100%',
          opacity: animating ? 0 : 1,
          transition: 'opacity 0.18s ease',
        }}
        aria-label="F1 circuit map"
      >
        <rect width={W} height={H} fill="var(--bg)" />

        {/* Graticule */}
        {data?.graticulePath && (
          <path
            d={data.graticulePath}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={0.4}
            strokeDasharray="3 4"
          />
        )}

        {/* Countries */}
        {data?.countryPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={0.5}
          />
        ))}

        {/* Circuit dots */}
        {dots.map((c) => {
          const isActive   = c.is_active;
          const isSelected = c.id === selectedId;
          return (
            <g
              key={c.id}
              onClick={() => onSelect(c)}
              style={{ cursor: 'pointer' }}
            >
              {isSelected && (
                <circle cx={c.x} cy={c.y} r={isActive ? 10 : 8} fill="var(--terracotta)" opacity={0.15} />
              )}
              <circle
                cx={c.x} cy={c.y}
                r={isActive ? 4 : 2.5}
                fill={isActive ? 'var(--terracotta)' : 'var(--border-subtle)'}
                opacity={isActive ? 1 : 0.7}
              />
              {isActive && !isSelected && (
                <circle cx={c.x} cy={c.y} r={1.8} fill="var(--bg)" style={{ pointerEvents: 'none' }} />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
