'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart2 } from 'lucide-react';

interface Driver {
  id: number; // Cambiado a id (integer) según tu esquema
  forename: string;
  surname: string;
  code: string;
  number: number; // Cambiado a number según tu esquema
}

interface CompareDashboardProps {
  drivers: Driver[];
  dict: any;
  locale: string;
}

export default function CompareDashboard({ drivers, dict, locale }: CompareDashboardProps) {
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');
  const [statsA, setStatsA] = useState<any>(null);
  const [statsB, setStatsB] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchComparisonData() {
      if (!idA || !idB) return;
      setLoading(true);
      
      // En la tabla results la columna de cruce es driver_id, por lo que la consulta es correcta
      const [resA, resB] = await Promise.all([
        supabase.from('results').select('points, position_order, grid').eq('driver_id', parseInt(idA)),
        supabase.from('results').select('points, position_order, grid').eq('driver_id', parseInt(idB))
      ]);

      const process = (data: any[] | null) => {
        if (!data || data.length === 0) return { totalPoints: 0, wins: 0, avgGrid: 0 };
        const totalPoints = data.reduce((acc, r) => acc + (Number(r.points) || 0), 0);
        const wins = data.filter(r => r.position_order === 1).length;
        const avgGrid = data.reduce((acc, r) => acc + (r.grid || 0), 0) / data.length;
        return { totalPoints, wins, avgGrid: avgGrid.toFixed(1) };
      };

      setStatsA(process(resA.data));
      setStatsB(process(resB.data));
      setLoading(false);
    }

    fetchComparisonData();
  }, [idA, idB]);

  return (
    <div className="space-y-8">
      {/* SELECTORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950 p-4 border border-zinc-900">
        <div>
          <label className="text-[10px] text-zinc-500 block mb-2 font-bold tracking-widest">// PILOTO ALPHA</label>
          <select 
            value={idA} 
            onChange={(e) => setIdA(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 p-3 text-sm focus:outline-none focus:border-red-600 font-sans"
          >
            <option value="">-- {dict.select_driver} --</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>
                {d.surname}, {d.forename} {d.number ? `(#${d.number})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-zinc-500 block mb-2 font-bold tracking-widest">// PILOTO BRAVO</label>
          <select 
            value={idB} 
            onChange={(e) => setIdB(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 p-3 text-sm focus:outline-none focus:border-zinc-500 font-sans"
          >
            <option value="">-- {dict.select_driver} --</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>
                {d.surname}, {d.forename} {d.number ? `(#${d.number})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RENDER DE TELEMETRÍA */}
      {loading ? (
        <div className="text-center py-12 border border-zinc-900 bg-zinc-950 animate-pulse text-zinc-500 text-xs tracking-widest">
          // CRUNCHING TELEMETRY METRICS...
        </div>
      ) : statsA && statsB ? (
        <div className="bg-zinc-950 border border-zinc-900 p-6 space-y-6">
          <div>
            <div className="flex justify-between text-xs mb-1 text-zinc-400">
              <span className="text-emerald-400 font-bold">{statsA.totalPoints} PTS</span>
              <span className="uppercase text-[10px] tracking-widest text-zinc-500">{dict.metrics?.speed || 'Puntos acumulados'}</span>
              <span className="text-zinc-300 font-bold">{statsB.totalPoints} PTS</span>
            </div>
            <div className="w-full bg-zinc-900 h-2 flex rounded-sm overflow-hidden">
              <div 
                className="bg-red-600 h-full transition-all duration-500" 
                style={{ width: `${(statsA.totalPoints / (statsA.totalPoints + statsB.totalPoints || 1)) * 100}%` }}
              />
              <div className="bg-zinc-700 h-full flex-1" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 text-zinc-400">
              <span className="text-amber-400 font-bold">{statsA.wins} WINS</span>
              <span className="uppercase text-[10px] tracking-widest text-zinc-500">Victorias</span>
              <span className="text-zinc-300 font-bold">{statsB.wins} WINS</span>
            </div>
            <div className="w-full bg-zinc-900 h-2 flex rounded-sm overflow-hidden">
              <div 
                className="bg-amber-500 h-full transition-all duration-500" 
                style={{ width: `${(statsA.wins / (statsA.wins + statsB.wins || 1)) * 100}%` }}
              />
              <div className="bg-zinc-700 h-full flex-1" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 text-zinc-400">
              <span className="text-cyan-400 font-bold">P{statsA.avgGrid}</span>
              <span className="uppercase text-[10px] tracking-widest text-zinc-500">{dict.metrics?.qualifying || 'Parrilla Promedio'}</span>
              <span className="text-zinc-300 font-bold">P{statsB.avgGrid}</span>
            </div>
            <div className="w-full bg-zinc-900 h-2 flex rounded-sm overflow-hidden">
              <div 
                className="bg-cyan-500 h-full transition-all duration-500" 
                style={{ width: `${(parseFloat(statsB.avgGrid) / (parseFloat(statsA.avgGrid) + parseFloat(statsB.avgGrid) || 1)) * 100}%` }}
              />
              <div className="bg-zinc-700 h-full flex-1" />
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-zinc-900 p-12 text-center text-xs text-zinc-600">
          <BarChart2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
          SELECOIONA DOS PILOTOS PARA SINCRONIZAR TELEMETRÍA CARA A CARA
        </div>
      )}
    </div>
  );
}