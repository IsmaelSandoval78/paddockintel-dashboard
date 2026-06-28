'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry } from 'geojson';
import type { Circuit } from '@/lib/types';

// ─── Region viewboxes [minLng, minLat, maxLng, maxLat] ───────────

const REGION_BOUNDS: Record<string, [number, number, number, number]> = {
  all:              [-180, -60,  180,  85],
  europe:           [  -15,  35,   45,  72],
  americas:         [ -140, -60,  -30,  75],
  asia:             [   50, -15,  155,  55],
  africaMiddleEast: [  -20, -40,   65,  40],
  oceania:          [  100, -50,  180,  10],
};

interface Props {
  circuits: Circuit[];
  onSelect: (circuit: Circuit) => void;
  targetRegion: string;
  selectedId: number | null;
}

const W = 960;
const H = 500;

function getProjection(region: string) {
  const bounds = REGION_BOUNDS[region] ?? REGION_BOUNDS.all;
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const cx = (minLng + maxLng) / 2;
  const cy = (minLat + maxLat) / 2;

  const proj = geoNaturalEarth1()
    .rotate([-cx, 0])
    .center([0, cy])
    .translate([W / 2, H / 2]);

  // Auto-fit scale to bounds
  const lngSpan = maxLng - minLng;
  const latSpan = maxLat - minLat;
  const scaleW = (W * 0.88) / (lngSpan * (Math.PI / 180) * 6371 * 2 / 6371);
  const scaleH = (H * 0.88) / (latSpan * (Math.PI / 180) * 6371 * 2 / 6371);
  const scale = Math.min(scaleW, scaleH, 800);
  proj.scale(scale);

  return proj;
}

export default function CircuitMapSVG({ circuits, onSelect, targetRegion, selectedId }: Props) {
  const [countries, setCountries] = useState<string[]>([]);
  const [region, setRegion] = useState(targetRegion);
  const svgRef = useRef<SVGSVGElement>(null);

  // Load TopoJSON once
  useEffect(() => {
    import('world-atlas/countries-110m.json').then((raw) => {
      const topo = raw.default as unknown as Topology<{ countries: GeometryCollection }>;
      const geo  = feature(topo, topo.objects.countries) as FeatureCollection;
      const proj = geoNaturalEarth1().scale(153).translate([W / 2, H / 2]);
      const path = geoPath(proj);
      setCountries(geo.features.map((f) => path(f as Parameters<typeof path>[0]) ?? '').filter(Boolean));
    });
  }, []);

  // Animate region change
  useEffect(() => {
    setRegion(targetRegion);
  }, [targetRegion]);

  const proj = geoNaturalEarth1().scale(153).translate([W / 2, H / 2]);

  // Compute dot positions
  const dots = circuits.map((c) => {
    const pos = proj([c.lng, c.lat]);
    return pos ? { ...c, x: pos[0], y: pos[1] } : null;
  }).filter((d): d is typeof d & { x: number; y: number } => d !== null);

  const handleClick = useCallback((c: Circuit, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(c);
  }, [onSelect]);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        style={{ maxHeight: '100%' }}
        aria-label="F1 circuit map"
      >
        {/* Ocean */}
        <rect width={W} height={H} fill="var(--bg)" />

        {/* Graticule lines */}
        {[-60, -30, 0, 30, 60].map((lat) => {
          const y = proj([0, lat])?.[1] ?? 0;
          return (
            <line
              key={`lat-${lat}`}
              x1={0} y1={y} x2={W} y2={y}
              stroke="var(--border-subtle)" strokeWidth={0.4} strokeDasharray="3 4"
            />
          );
        })}

        {/* Countries */}
        {countries.map((d, i) => (
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
          const isActive = c.is_active;
          const isSelected = c.id === selectedId;
          return (
            <g key={c.id} onClick={(e) => handleClick(c, e)} style={{ cursor: 'pointer' }}>
              {isSelected && (
                <circle
                  cx={c.x} cy={c.y}
                  r={isActive ? 10 : 8}
                  fill="var(--red)"
                  opacity={0.15}
                />
              )}
              <circle
                cx={c.x} cy={c.y}
                r={isActive ? 4 : 2.5}
                fill={isSelected ? 'var(--red)' : isActive ? 'var(--red)' : 'var(--border-subtle)'}
                opacity={isActive ? 1 : 0.7}
              />
              {isActive && (
                <circle
                  cx={c.x} cy={c.y}
                  r={2}
                  fill="var(--bg)"
                  opacity={isSelected ? 0 : 0.5}
                  style={{ pointerEvents: 'none' }}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
