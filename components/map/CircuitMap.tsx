'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Circuit } from '@/lib/types';

interface FlyTarget {
  center: [number, number];
  zoom: number;
  seq: number;
}

export interface CircuitDominance {
  winsA: number;
  winsB: number;
  total: number;
}

// ─── Default dot (explore mode) ───────────────────────────────────

function dotHtml(isActive: boolean, selected: boolean): string {
  if (selected)
    return '<div style="width:10px;height:10px;border-radius:50%;background:#E61919;border:2px solid #050505;box-shadow:0 0 10px rgba(230,25,25,0.4)"></div>';
  if (isActive)
    return '<div style="width:8px;height:8px;border-radius:50%;background:#E61919;border:1.5px solid rgba(230,25,25,0.25)"></div>';
  return '<div style="width:6px;height:6px;border-radius:50%;background:#B0AFA8;border:1px solid #9B9A93"></div>';
}

function makeIcon(isActive: boolean, selected: boolean): ReturnType<typeof L.divIcon> {
  const size = selected ? 10 : isActive ? 8 : 6;
  return L.divIcon({ className: '', html: dotHtml(isActive, selected), iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

// ─── Dominance dot ────────────────────────────────────────────────
//
// Color encodes who dominates:
//   #E61919  Driver A (race red)
//   #2A5DB0  Driver B (blue)
//   #B5B4AE  Even
//   #D8D7D1  No overlap
//
// Size encodes magnitude — larger = more one-sided.

function dotHtmlDominance(
  dominance: CircuitDominance | null,
  selected: boolean,
): string {
  let color: string;
  let size: number;

  if (!dominance || dominance.total === 0) {
    color = '#D8D7D1';
    size = 5;
  } else if (dominance.winsA === dominance.winsB) {
    color = '#B5B4AE';
    size = 6;
  } else if (dominance.winsA > dominance.winsB) {
    const pct = dominance.winsA / dominance.total;
    color = '#E61919';
    size = pct >= 0.7 ? 11 : pct >= 0.55 ? 8 : 6;
  } else {
    const pct = dominance.winsB / dominance.total;
    color = '#2A5DB0';
    size = pct >= 0.7 ? 11 : pct >= 0.55 ? 8 : 6;
  }

  if (selected) size = Math.max(size, 12);
  const shadow = selected ? `;box-shadow:0 0 8px ${color}88` : '';
  const border = selected
    ? `2px solid #050505`
    : dominance && dominance.total > 0
      ? `1.5px solid ${color}44`
      : '1px solid #C8C7C0';

  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border}${shadow}"></div>`;
}

function makeDominanceIcon(
  dominance: CircuitDominance | null,
  selected: boolean,
): ReturnType<typeof L.divIcon> {
  const size = selected ? 12 : (dominance?.total ?? 0) > 0 ? 11 : 5;
  return L.divIcon({
    className: '',
    html: dotHtmlDominance(dominance, selected),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ─────────────────────────────────────────────────────────────────

function formatCoord(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${ns} · ${Math.abs(lng).toFixed(2)}°${ew}`;
}

type LeafletMap    = ReturnType<typeof L.map>;
type LeafletMarker = ReturnType<typeof L.marker>;

export default function CircuitMap({
  circuits,
  onSelect,
  flyTarget,
  dominanceData,
}: {
  circuits: Circuit[];
  onSelect?: (circuit: Circuit) => void;
  flyTarget?: FlyTarget | null;
  dominanceData?: Record<number, CircuitDominance> | null;
}) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const mapRef         = useRef<LeafletMap | null>(null);
  const markersRef     = useRef(new Map<number, LeafletMarker>());
  const prevSelIdRef   = useRef<number | null>(null);
  const [selected, setSelected] = useState<Circuit | null>(null);

  // FlyTo when continent filter changes
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

  // Add markers once circuits load
  useEffect(() => {
    if (!mapRef.current || !circuits.length) return;
    const map = mapRef.current;

    circuits.forEach((circuit) => {
      const marker = L.marker([circuit.lat, circuit.lng], {
        icon: makeIcon(circuit.is_active, false),
      });

      marker.on('click', () => {
        // Restore previous
        if (prevSelIdRef.current !== null) {
          const prevC = circuits.find((c) => c.id === prevSelIdRef.current);
          const prevM = markersRef.current.get(prevSelIdRef.current);
          if (prevC && prevM) {
            prevM.setIcon(
              dominanceData
                ? makeDominanceIcon(dominanceData[prevC.id] ?? null, false)
                : makeIcon(prevC.is_active, false)
            );
          }
        }
        // Highlight clicked
        marker.setIcon(
          dominanceData
            ? makeDominanceIcon(dominanceData[circuit.id] ?? null, true)
            : makeIcon(circuit.is_active, true)
        );
        prevSelIdRef.current = circuit.id;
        setSelected(circuit);
        onSelect?.(circuit);
      });

      marker.addTo(map);
      markersRef.current.set(circuit.id, marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
    };
  }, [circuits]);

  // Recolor all markers when dominanceData changes
  useEffect(() => {
    markersRef.current.forEach((marker, circuitId) => {
      const circuit  = circuits.find((c) => c.id === circuitId);
      if (!circuit) return;
      const isSelected = circuitId === prevSelIdRef.current;

      marker.setIcon(
        dominanceData
          ? makeDominanceIcon(dominanceData[circuitId] ?? null, isSelected)
          : makeIcon(circuit.is_active, isSelected)
      );
    });
  }, [dominanceData, circuits]);

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
