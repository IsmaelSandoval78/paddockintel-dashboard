"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

interface CircuitItem {
  id: number;
  alt: number;
  lat: number;
  lng: number;
}

interface TacticalMapProps {
  circuits: CircuitItem[];
  selectedCircuit: CircuitItem | null;
  onSelectCircuit: (circuit: CircuitItem) => void;
}

const cyberIcon = new L.DivIcon({
  className: "custom-cyber-marker",
  html: `<div class="w-3 h-3 bg-zinc-400 border border-zinc-950 rounded-full hover:bg-emerald-400 hover:scale-125 transition-all duration-150 shadow-[0_0_8px_#34d399]"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const selectedCyberIcon = new L.DivIcon({
  className: "custom-cyber-marker-selected",
  html: `<div class="w-4 h-4 bg-emerald-400 border-2 border-zinc-950 rounded-full shadow-[0_0_12px_#34d399] relative flex items-center justify-center"><span class="absolute w-8 h-8 border border-emerald-400 rounded-full animate-ping opacity-40"></span></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function TacticalMap({ circuits, selectedCircuit, onSelectCircuit }: TacticalMapProps) {
  const defaultCenter: [number, number] = [20, 0];
  const mapCenter: [number, number] = selectedCircuit 
    ? [Number(selectedCircuit.lat), Number(selectedCircuit.lng)] 
    : defaultCenter;

  return (
    <div className="w-full h-full min-h-[400px] relative rounded-none overflow-hidden isolate">
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(to_right,#52525b_1px,transparent_1px),linear-gradient(to_bottom,#52525b_1px,transparent_1px)] bg-[size:30px_30px] z-[400]" />
      
      <MapContainer
        center={mapCenter}
        zoom={2}
        minZoom={2}
        maxZoom={8}
        scrollWheelZoom={true}
        className="w-full h-full bg-zinc-950 font-mono text-xs"
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {selectedCircuit && <ChangeView center={mapCenter} />}

        {circuits.map((circuit) => {
          const isSelected = selectedCircuit?.id === circuit.id;
          return (
            <Marker
              key={circuit.id}
              position={[Number(circuit.lat), Number(circuit.lng)]}
              icon={isSelected ? selectedCyberIcon : cyberIcon}
              eventHandlers={{
                click: () => onSelectCircuit(circuit),
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}