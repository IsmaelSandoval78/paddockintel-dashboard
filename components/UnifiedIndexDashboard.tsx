"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

const TacticalMap = dynamic(() => import("./TacticalMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[440px] bg-zinc-950 flex flex-col items-center justify-center font-mono text-xs text-zinc-500 border border-zinc-800">
      <span className="w-5 h-5 border-2 border-t-zinc-200 border-zinc-800 rounded-full animate-spin mb-2" />
      INITIALIZING_GLOBAL_TILES_MATRIX...
    </div>
  ),
});

interface CircuitItem {
  id: number;
  name: string;
  location: string;
  country: string;
  alt: number;
  lat: number;
  lng: number;
}

interface DriverItem {
  id: number;
  number: number | null;
  forename: string;
  surname: string;
  code: string;
}

interface SeasonItem {
  year: number;
}

interface UnifiedProps {
  circuits: CircuitItem[];
  drivers: DriverItem[];
  seasons: SeasonItem[];
  dictionary: Record<string, string>;
  locale: string;
}

interface RecentWinnerPayload {
  year: number;
  driver: string;
}

interface TelemetryPayload {
  circuitId: number;
  fastestLap: string;
  fastestPit: string;
  topWinnerName: string;
  topWinnerCount: number;
  recentWinners: RecentWinnerPayload[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 380, damping: 28 },
  },
};

export default function UnifiedIndexDashboard({
  circuits,
  drivers,
  seasons,
  dictionary,
  locale,
}: UnifiedProps) {
  const [selectedCircuit, setSelectedCircuit] = useState<CircuitItem | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Formateador de milisegundos a estampa cronográfica estándar de F1 (M:SS.mmm)
  const formatLapTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(3);
    return minutes > 0 ? `${minutes}:${Number(seconds) < 10 ? "0" : ""}${seconds}s` : `${seconds}s`;
  };

  const handleInterceptTelemetry = async (circuit: CircuitItem) => {
    setSelectedCircuit(circuit);
    setIsLoading(true);
    setTelemetry(null);

    try {
      // Ejecución en paralelo de analíticas crudas sobre el nodo seleccionado
      const [lapTimesRes, pitRes, winnersRes] = await Promise.all([
        supabase
          .from("lap_times")
          .select("milliseconds, lap, drivers(surname), races!inner(year, circuit_id)")
          .eq("races.circuit_id", circuit.id)
          .order("milliseconds", { ascending: true })
          .limit(1),
        supabase
          .from("pit_stops")
          .select("milliseconds, races!inner(circuit_id)")
          .eq("races.circuit_id", circuit.id)
          .order("milliseconds", { ascending: true })
          .limit(1),
        supabase
          .from("results")
          .select("driver_id, drivers(surname), races!inner(year, circuit_id)")
          .eq("races.circuit_id", circuit.id)
          .eq("position_order", 1)
      ]);

      // 1. Parseo del récord de vuelta rápida absoluta en carrera
      let formattedLap = "N/A // NO_LAP_RECORDS";
      if (lapTimesRes.data && lapTimesRes.data[0]) {
        const record = lapTimesRes.data[0];
        const driverName = (record.drivers as any)?.surname || `ID: ${record.driver_id}`;
        const yearStamp = (record.races as any)?.year || "";
        formattedLap = `${formatLapTime(record.milliseconds)} (${driverName} - ${yearStamp})`;
      }

      // 2. Parseo de la latencia mínima en parada de boxes
      const formattedPit = pitRes.data && pitRes.data[0]
        ? `${(pitRes.data[0].milliseconds / 1000).toFixed(3)}s`
        : "N/A // NO_PIT_LOGS";

      // 3. Agregación de Dominio Histórico (Más victorias) y Línea de Ganadores Recientes
      let topWinnerName = "N/A";
      let topWinnerCount = 0;
      let recentWinnersList: RecentWinnerPayload[] = [];

      if (winnersRes.data && winnersRes.data.length > 0) {
        // Ordenar cronológicamente de forma descendente por el año del GP
        const sortedWinners = [...winnersRes.data].sort(
          (a: any, b: any) => b.races.year - a.races.year
        );

        // Calcular piloto con mayor volumen de victorias en la pista
        const winTracking: Record<string, number> = {};
        sortedWinners.forEach((row: any) => {
          const name = row.drivers?.surname || `Driver ID: ${row.driver_id}`;
          winTracking[name] = (winTracking[name] || 0) + 1;
        });

        Object.entries(winTracking).forEach(([name, count]) => {
          if (count > topWinnerCount) {
            topWinnerCount = count;
            topWinnerName = name;
          }
        });

        // Extraer los últimos 5 ganadores del circuito
        recentWinnersList = sortedWinners.slice(0, 5).map((row: any) => ({
          year: row.races.year,
          driver: row.drivers?.surname || `ID: ${row.driver_id}`,
        }));
      }

      setTelemetry({
        circuitId: circuit.id,
        fastestLap: formattedLap,
        fastestPit: formattedPit,
        topWinnerName,
        topWinnerCount,
        recentWinners: recentWinnersList,
      });
    } catch (e) {
      console.error("TELEMETRY_CORE_PIPELINE_EXCEPTION", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      
      {/* SECCIÓN SUPERIOR: RADAR CARTOGRÁFICO Y PANEL DE CONVERSIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full">
        
        {/* MAPA OPERATIVO TILE-BASED */}
        <div className="lg:col-span-2 bg-zinc-900/80 backdrop-blur-xl border border-zinc-100/10 p-0 relative flex flex-col justify-center items-center overflow-hidden min-h-[440px] z-10">
          <TacticalMap 
            circuits={circuits}
            selectedCircuit={selectedCircuit}
            onSelectCircuit={handleInterceptTelemetry}
          />
        </div>

        {/* SIDEBAR TÁCTICO INLINE */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-100/10 flex flex-col justify-between overflow-hidden relative min-h-[380px] z-20">
          <AnimatePresence mode="wait">
            {!selectedCircuit ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 animate-pulse mb-3 block" />
                <p className="font-mono text-xs text-zinc-500 uppercase tracking-wider leading-relaxed max-w-xs">
                  {dictionary.clickPrompt}
                </p>
              </div>
            ) : (
              <motion.div 
                key="telemetry-panel" 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="flex-1 flex flex-col p-5 h-full justify-between"
              >
                <div className="flex flex-col gap-4 overflow-y-auto pr-1 scrollbar-none">
                  
                  {/* IDENTIFICACIÓN ESTRUCTURAL */}
                  <div className="flex justify-between items-start border-b border-zinc-800 pb-2">
                    <div className="max-w-[80%]">
                      <span className="font-mono text-[9px] font-bold text-emerald-400 uppercase">// LIVE_STREAM_CONNECTED</span>
                      <h2 className="font-mono text-sm window-title font-black text-zinc-50 uppercase tracking-tight mt-0.5 truncate">
                        {selectedCircuit.name}
                      </h2>
                      <span className="font-mono text-[10px] text-zinc-500 block uppercase tracking-wide">
                        {selectedCircuit.location} // {selectedCircuit.country}
                      </span>
                    </div>
                    <button 
                      onClick={() => { setSelectedCircuit(null); setTelemetry(null); }} 
                      className="font-mono text-[9px] bg-zinc-950 border border-zinc-800 text-zinc-400 px-2 py-0.5 hover:text-zinc-100 cursor-pointer uppercase font-bold"
                    >
                      {dictionary.closeBtn}
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="font-mono text-xs text-zinc-500 text-center py-16 animate-pulse uppercase tracking-wider">
                      INTERCEPTING_RELATIONAL_TELEMETRY...
                    </div>
                  ) : telemetry && (
                    <div className="flex flex-col gap-4">
                      
                      {/* MÉTRICAS CRÍTICAS */}
                      <motion.div variants={itemVariants}>
                        <span className="font-mono text-[9px] text-zinc-500 block uppercase mb-1 font-bold">
                          // {dictionary.statsTitle}
                        </span>
                        <div className="bg-zinc-950 p-2.5 border-l border-emerald-500 font-mono text-xs mb-1.5 shadow-sm">
                          <span className="text-zinc-500 text-[9px] block font-bold uppercase">{dictionary.fastestLap}</span>
                          <span className="text-zinc-100 font-black tracking-tight">{telemetry.fastestLap}</span>
                        </div>
                        <div className="bg-zinc-950 p-2.5 border-l border-zinc-600 font-mono text-xs shadow-sm">
                          <span className="text-zinc-500 text-[9px] block font-bold uppercase">{dictionary.fastestPit}</span>
                          <span className="text-zinc-100 font-black tracking-tight">{telemetry.fastestPit}</span>
                        </div>
                      </motion.div>

                      {/* DOMINIO HISTÓRICO */}
                      <motion.div variants={itemVariants}>
                        <span className="font-mono text-[9px] text-zinc-500 block uppercase mb-1 font-bold">
                          // {dictionary.topWinners}
                        </span>
                        <div className="bg-zinc-950 p-2.5 border-l border-zinc-400 font-mono text-xs flex justify-between items-center shadow-sm">
                          <span className="text-zinc-300 uppercase font-bold">{telemetry.topWinnerName}</span>
                          <span className="text-emerald-400 font-black text-sm tracking-tight">
                            {telemetry.topWinnerCount} {dictionary.wins}
                          </span>
                        </div>
                      </motion.div>

                      {/* CRONOLOGÍA DE GANADORES */}
                      <motion.div variants={itemVariants} className="flex flex-col">
                        <span className="font-mono text-[9px] text-zinc-500 block uppercase mb-1 font-bold">
                          // {dictionary.recentWinners}
                        </span>
                        <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto pr-1 scrollbar-none">
                          {telemetry.recentWinners.length === 0 ? (
                            <span className="font-mono text-[10px] text-zinc-600 uppercase">NO_RECORDS_FOUND_IN_SCOPE</span>
                          ) : (
                            telemetry.recentWinners.map((winner, idx) => (
                              <div 
                                key={idx} 
                                className="flex justify-between items-center bg-zinc-950/50 border border-zinc-800/80 p-2 font-mono text-[11px]"
                              >
                                <span className="text-zinc-500 font-bold">GP_{winner.year}</span>
                                <span className="text-zinc-200 font-medium uppercase tracking-wide">{winner.driver}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>

                    </div>
                  )}
                </div>

                {telemetry && (
                  <div className="pt-3 border-t border-zinc-800 mt-2">
                    <Link 
                      href={`/${locale}/circuits/${selectedCircuit.id}`} 
                      className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-mono text-xs font-bold text-center py-2.5 block uppercase transition-colors"
                    >
                      {dictionary.viewProfile}
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: BENTO GRID DE RED SEMÁNTICA INDEXABLE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        
        {/* ENLAZADO DE CIRCUITOS */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-100/10 p-5 flex flex-col justify-between rounded-none">
          <div>
            <h3 className="font-mono text-xs window-title font-black uppercase tracking-wider text-zinc-100 border-b border-zinc-800 pb-2 mb-3">
              // {dictionary.circuitsLabel}
            </h3>
            <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {circuits.map((c) => (
                <Link 
                  key={c.id} 
                  href={`/${locale}/circuits/${c.id}`} 
                  className="flex justify-between bg-zinc-950 border border-zinc-800/60 p-2 font-mono text-[11px] text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-all rounded-none"
                >
                  <span className="truncate max-w-[70%] font-bold uppercase">{c.name}</span>
                  <span className="text-zinc-600 font-normal">ID_{c.id.toString().padStart(2, "0")}</span>
                </Link>
              ))}
            </div>
          </div>
          <span className="font-mono text-[10px] text-zinc-600 mt-4 block font-bold">ACTIVE_NODES // {circuits.length}</span>
        </div>

        {/* ENLAZADO DE PILOTOS */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-100/10 p-5 flex flex-col justify-between rounded-none">
          <div>
            <h3 className="font-mono text-xs window-title font-black uppercase tracking-wider text-zinc-100 border-b border-zinc-800 pb-2 mb-3">
              // {dictionary.driversLabel}
            </h3>
            <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {drivers.map((d) => (
                <Link 
                  key={d.id} 
                  href={`/${locale}/drivers/${d.id}`} 
                  className="flex justify-between items-center bg-zinc-950 border border-zinc-800/40 p-2 font-mono text-xs text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-all rounded-none"
                >
                  <span className="font-bold uppercase">{d.forename} {d.surname}</span>
                  <span className="text-zinc-500 font-bold">{d.number ? `N° ${d.number}` : `[${d.code}]`}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* CRONOLOGÍA DE TEMPORADAS */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-100/10 p-5 flex flex-col justify-between rounded-none">
          <div>
            <h3 className="font-mono text-xs window-title font-black uppercase tracking-wider text-zinc-100 border-b border-zinc-800 pb-2 mb-3">
              // {dictionary.seasonsLabel}
            </h3>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {seasons.map((s) => (
                <div key={s.year} className="bg-zinc-950 p-2.5 border-l border-zinc-700 font-mono text-xs text-zinc-400 font-bold rounded-none">
                  {s.year} <span className="text-[9px] text-emerald-500 float-right font-normal">SYNC</span>
                </div>
              ))}
            </div>
          </div>
          <p className="font-sans text-[11px] text-zinc-500 leading-normal border-t border-zinc-800/80 pt-3 mt-4 font-normal">
            Routing matrix fully synchronized to 2025/2026 database entries.
          </p>
        </div>
      </div>

    </div>
  );
}