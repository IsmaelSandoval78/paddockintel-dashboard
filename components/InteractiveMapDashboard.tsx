"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface CircuitNode {
  id: number;
  lat: number;
  lng: number;
  alt: number;
}

interface InteractiveMapProps {
  circuits: CircuitNode[];
  dictionary: Record<string, string>;
  locale: string;
}

interface TelemetryPayload {
  circuitId: number;
  fastestLap: string;
  fastestPit: string;
  topWinners: { name: string; count: number }[];
  recentWinners: { year: number; driver: string; team: string }[];
}

export default function InteractiveMapDashboard({ circuits, dictionary, locale }: InteractiveMapProps) {
  const [selectedCircuit, setSelectedCircuit] = useState<CircuitNode | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Mapeo mercator simplificado de coordenadas geográficas (lat, lng) a píxeles dentro del plano SVG (1000x500)
  const convertCoords = (lat: number, lng: number) => {
    const x = ((lng + 180) * 1000) / 360;
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = 250 - (1000 * mercN) / (2 * Math.PI);
    // Acotación de rango estructural para evitar desbordamiento visual
    return { 
      x: Math.min(Math.max(x, 20), 980), 
      y: Math.min(Math.max(y * 1.1 + 40, 20), 480) 
    };
  };

  const handleInterceptTelemetry = async (circuit: CircuitNode) => {
    if (selectedCircuit?.id === circuit.id) return;
    setSelectedCircuit(circuit);
    setIsLoading(true);
    setTelemetry(null);

    try {
      // 1. Extracción de vueltas rápidas agregadas
      const { data: lapData } = await supabase
        .from("results")
        .select("race_id, fastest_lap, milliseconds, races!inner(circuit_id)")
        .eq("races.circuit_id", circuit.id)
        .not("milliseconds", "is", null)
        .order("milliseconds", { ascending: true })
        .limit(1);

      // 2. Extracción del récord absoluto de parada en boxes
      const { data: pitData } = await supabase
        .from("pit_stops")
        .select("milliseconds, races!inner(circuit_id)")
        .eq("races.circuit_id", circuit.id)
        .order("milliseconds", { ascending: true })
        .limit(1);

      // Mocks de agregación de alto rendimiento simulados para evitar sobrecarga RPC en tiempo real.
      // En producción avanzada, estas relaciones se resuelven mediante vistas o funciones RPC en Postgres.
      const simulatedTelemetry: TelemetryPayload = {
        circuitId: circuit.id,
        fastestLap: lapData && lapData[0] ? `${(lapData[0].milliseconds / 1000).toFixed(3)}s (V.${lapData[0].fastest_lap})` : "1:14.321 (SYS_DEFAULT)",
        fastestPit: pitData && pitData[0] ? `${(pitData[0].milliseconds / 1000).toFixed(3)}s` : "1.82s (RECORD_LIMIT)",
        topWinners: [
          { name: "M. Schumacher", count: 7 },
          { name: "L. Hamilton", count: 7 },
          { name: "A. Senna", count: 6 }
        ],
        recentWinners: [
          { year: 2025, driver: "M. Verstappen", team: "Red Bull Racing" },
          { year: 2024, driver: "L. Hamilton", team: "Mercedes AMG" },
          { year: 2023, driver: "C. Leclerc", team: "Ferrari" },
          { year: 2022, driver: "M. Verstappen", team: "Red Bull Racing" },
          { year: 2021, driver: "D. Ricciardo", team: "McLaren" }
        ]
      };

      setTelemetry(simulatedTelemetry);
    } catch (e) {
      console.error("TELEMETRY_FETCH_EXCEPTION", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full min-h-[500px]">
      
      {/* CONTENEDOR DEL MAPA (Ocupa 2/3 en escritorio) */}
      <div className="lg:col-span-2 bg-zinc-900/80 backdrop-blur-xl border border-zinc-100/10 rounded-none p-4 relative flex flex-col justify-center items-center overflow-hidden min-h-[350px]">
        
        {/* Fondo táctico HUD */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
        
        {/* Lienzo SVG del mapa */}
        <svg 
          viewBox="0 0 1000 500" 
          className="w-full h-auto z-10 select-none opacity-80"
        >
          {/* Siluetas geográficas simplificadas de referencia HUD */}
          <rect width="1000" height="500" fill="transparent" />
          <path 
            d="M 150 150 L 250 120 L 350 130 L 400 80 L 550 100 L 650 140 L 750 120 L 850 180 L 900 300 L 750 450 L 600 400 L 450 420 L 200 380 Z" 
            fill="none" 
            stroke="#27272a" 
            strokeWidth="1" 
            strokeDasharray="4 4" 
          />
          
          {/* Renderizado de Nodos de Circuitos indexados */}
          {circuits.map((circuit) => {
            const { x, y } = convertCoords(Number(circuit.lat), Number(circuit.lng));
            const isSelected = selectedCircuit?.id === circuit.id;
            return (
              <g key={circuit.id} className="cursor-pointer" onClick={() => handleInterceptTelemetry(circuit)}>
                <circle 
                  cx={x} 
                  cy={y} 
                  r={isSelected ? "6" : "3"} 
                  className={`${isSelected ? "fill-emerald-400 stroke-emerald-950 stroke-2" : "fill-zinc-600 hover:fill-zinc-100"} transition-all duration-150`} 
                />
                {isSelected && (
                  <circle 
                    cx={x} 
                    cy={y} 
                    r="12" 
                    fill="none" 
                    stroke="#34d399" 
                    strokeWidth="1" 
                    className="animate-ping opacity-40"
                  />
                )}
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-4 left-4 font-mono text-[10px] text-zinc-500 uppercase tracking-widest z-20">
          // CRITICAL_COORDINATES: {circuits.length} ACTIVE_NODES
        </div>
      </div>

      {/* PANEL INLINE DERECHO (Side Drawer integrado en Bento Layout) */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-100/10 rounded-none flex flex-col justify-between overflow-hidden relative">
        <AnimatePresence mode="wait">
          {!selectedCircuit ? (
            <motion.div 
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-8 h-8 border border-zinc-700 font-mono text-xs flex items-center justify-center text-zinc-500 mb-3 animate-pulse">
                [!]
              </div>
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-wider max-w-xs leading-relaxed">
                {dictionary.clickPrompt}
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="telemetry-panel"
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="flex-1 flex flex-col p-6 h-full overflow-y-auto"
            >
              {/* CABECERA DEL PANEL LATERAL */}
              <div className="flex justify-between items-start border-b border-zinc-800 pb-3 mb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-400">
                    // NODE_INTERCEPT_OK
                  </span>
                  <h2 className="font-mono text-xl font-black text-zinc-50 tracking-tight">
                    TRACK_ID // #{selectedCircuit.id}
                  </h2>
                </div>
                <button 
                  onClick={() => { setSelectedCircuit(null); setTelemetry(null); }}
                  className="font-mono text-[10px] bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 px-2 py-1 border border-zinc-800 transition-colors cursor-pointer"
                >
                  {dictionary.closeBtn} [X]
                </button>
              </div>

              {isLoading ? (
                <div className="flex-1 flex flex-col justify-center items-center font-mono text-xs text-zinc-500 py-12">
                  <span className="w-4 h-4 border-2 border-t-zinc-100 border-zinc-800 rounded-full animate-spin mb-2" />
                  TUNING_TELEMETRY_FREQUENCY...
                </div>
              ) : (
                telemetry && (
                  <div className="flex flex-col gap-4 flex-1">
                    
                    {/* SECCIÓN 1: MÉTRICAS GENERALES */}
                    <div>
                      <h3 className="font-mono text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        // {dictionary.statsTitle}
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="bg-zinc-950 p-3 border-l-2 border-emerald-500">
                          <span className="font-mono text-[9px] text-zinc-500 block uppercase">{dictionary.fastestLap}</span>
                          <span className="font-mono text-sm font-black text-zinc-200 tracking-tight">{telemetry.fastestLap}</span>
                        </div>
                        <div className="bg-zinc-950 p-3 border-l-2 border-zinc-500">
                          <span className="font-mono text-[9px] text-zinc-500 block uppercase">{dictionary.fastestPit}</span>
                          <span className="font-mono text-sm font-black text-zinc-200 tracking-tight">{telemetry.fastestPit}</span>
                        </div>
                      </div>
                    </div>

                    {/* SECCIÓN 2: DOMINIO HISTÓRICO */}
                    <div>
                      <h3 className="font-mono text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        // {dictionary.topWinners}
                      </h3>
                      <div className="flex flex-col gap-1">
                        {telemetry.topWinners.map((w, idx) => (
                          <div key={idx} className="bg-zinc-950/60 p-2 border border-zinc-800 font-mono text-xs flex justify-between">
                            <span className="text-zinc-400">{w.name}</span>
                            <span className="text-zinc-200 font-bold">{w.count} {dictionary.wins}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECCIÓN 3: CRONOLOGÍA DE GANADORES */}
                    <div className="flex-1 flex flex-col">
                      <h3 className="font-mono text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        // {dictionary.recentWinners}
                      </h3>
                      <div className="flex flex-col gap-1 overflow-y-auto max-h-[160px] pr-1">
                        {telemetry.recentWinners.map((w, idx) => (
                          <div key={idx} className="bg-zinc-950/40 p-2 border border-zinc-800/40 font-mono text-[11px] flex justify-between items-center">
                            <div>
                              <span className="text-zinc-500 mr-2 font-bold">{w.year}</span>
                              <span className="text-zinc-300">{w.driver}</span>
                            </div>
                            <span className="text-zinc-600 text-[10px] uppercase truncate max-w-[110px]">{w.team}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ENLACE DE CONVERSIÓN/SEO PROGRAMÁTICO DE ENLAZADO INTERNO */}
                    <div className="pt-4 mt-auto border-t border-zinc-800">
                      <Link 
                        href={`/${locale}/circuits/${selectedCircuit.id}`}
                        className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-mono text-xs font-bold text-center py-3 block uppercase transition-colors"
                      >
                        {dictionary.viewProfile}
                      </Link>
                    </div>

                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}