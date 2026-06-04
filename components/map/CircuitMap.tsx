'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Circuit } from '@/lib/types';

interface FlyTarget {
  center: [number, number];
  zoom: number;
  seq: number;
}

// L.divIcon requires an HTML string — inline styles are unavoidable here
function dotHtml(isActive: boolean, selected: boolean): string {
  if (selected)
    return '<div style="width:10px;height:10px;border-radius:50%;background:#E61919;border:2px solid #050505;box-shadow:0 0 10px rgba(230,25,25,0.4)"></div>';
  if (isActive)
    return '<div style="width:8px;height:8px;border-radius:50%;background:#E61919;border:1.5px solid rgba(230,25,25,0.25)"></div>';
  return '<div style="width:6px;height:6px;border-radius:50%;background:#B0AFA8;border:1px solid #9B9A93"></div>';
}

function makeIcon(isActive: boolean, selected: boolean): ReturnType<typeof L.divIcon> {
  const size = selected ? 10 : isActive ? 8 : 6;
  return L.divIcon({
    className: '',
    html: dotHtml(isActive, selected),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function formatCoord(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${ns} · ${Math.abs(lng).toFixed(2)}°${ew}`;
}

type LeafletMap = ReturnType<typeof L.map>;
type LeafletMarker = ReturnType<typeof L.marker>;

export default function CircuitMap({
  circuits,
  onSelect,
  flyTarget,
}: {
  circuits: Circuit[];
  onSelect?: (circuit: Circuit) => void;
  flyTarget?: FlyTarget | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef(new Map<number, LeafletMarker>());
  const prevSelIdRef = useRef<number | null>(null);
  const [selected, setSelected] = useState<Circuit | null>(null);

  // FlyTo when continent tab changes
  useEffect(() => {
    if (!mapRef.current || !flyTarget) return;
    mapRef.current.flyTo(flyTarget.center, flyTarget.zoom, { animate: true, duration: 0.8 });
  }, [flyTarget]);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20, 10],
      zoom: 2,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add markers after map is ready
  useEffect(() => {
    if (!mapRef.current || !circuits.length) return;
    const map = mapRef.current;

    circuits.forEach(circuit => {
      const marker = L.marker([circuit.lat, circuit.lng], {
        icon: makeIcon(circuit.is_active, false),
      });

      marker.on('click', () => {
        // Restore previous marker
        if (prevSelIdRef.current !== null) {
          const prev = circuits.find(c => c.id === prevSelIdRef.current);
          const prevM = markersRef.current.get(prevSelIdRef.current);
          if (prev && prevM) prevM.setIcon(makeIcon(prev.is_active, false));
        }
        // Highlight clicked marker
        marker.setIcon(makeIcon(circuit.is_active, true));
        prevSelIdRef.current = circuit.id;
        setSelected(circuit);
        onSelect?.(circuit);
      });

      marker.addTo(map);
      markersRef.current.set(circuit.id, marker);
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();
    };
  }, [circuits]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {selected && (
        <div className="absolute bottom-3 left-4 z-[1000] pointer-events-none">
          <p className="font-mono text-xs text-text-3">
            {formatCoord(selected.lat, selected.lng)}
            {' — '}
            {selected.name}
          </p>
        </div>
      )}
    </div>
  );
}
