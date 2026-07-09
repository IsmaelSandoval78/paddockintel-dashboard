'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export interface SeasonBattleChartRound {
  round: number;
  raceName: string;
  championPoints: number;
  runnerUpPoints: number;
}

const W = 900;
const H = 320;
const PAD_L = 44;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 28;
const INNER_W = W - PAD_L - PAD_R;
const INNER_H = H - PAD_T - PAD_B;

export function SeasonBattleChart({
  rounds,
  championName,
  runnerUpName,
}: {
  rounds: SeasonBattleChartRound[];
  championName: string;
  runnerUpName: string;
}) {
  const t = useTranslations('records');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const n = rounds.length;
  if (n === 0) return null;

  const maxPoints = Math.max(1, ...rounds.flatMap((r) => [r.championPoints, r.runnerUpPoints]));
  const x = (i: number) => PAD_L + (n <= 1 ? 0 : (INNER_W * i) / (n - 1));
  const y = (v: number) => PAD_T + INNER_H - (INNER_H * v) / maxPoints;

  const championPath = rounds.map((r, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(r.championPoints)}`).join(' ');
  const runnerUpPath = rounds.map((r, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(r.runnerUpPoints)}`).join(' ');
  const gridLines = [0.25, 0.5, 0.75].map((f) => PAD_T + INNER_H * (1 - f));

  const hovered = hoverIdx !== null ? rounds[hoverIdx] : null;
  const tooltipLeft = hoverIdx !== null ? (x(hoverIdx) / W) * 100 : 0;

  return (
    <div className="relative">
      <div className="flex items-center gap-4 mb-3 font-mono text-[10px] uppercase tracking-[0.08em]">
        <span className="flex items-center gap-1.5 text-text-1">
          <span className="inline-block w-2.5 h-0.5" style={{ backgroundColor: 'var(--red)' }} />
          {championName}
        </span>
        <span className="flex items-center gap-1.5 text-text-2">
          <span className="inline-block w-2.5 h-0.5" style={{ backgroundColor: 'var(--text-2)' }} />
          {runnerUpName}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = ((e.clientX - rect.left) / rect.width) * W;
          const i = n <= 1 ? 0 : Math.round(((relX - PAD_L) / INNER_W) * (n - 1));
          setHoverIdx(Math.max(0, Math.min(n - 1, i)));
        }}
      >
        {gridLines.map((gy, i) => (
          <line key={i} x1={PAD_L} x2={W - PAD_R} y1={gy} y2={gy} stroke="var(--border-subtle)" strokeWidth="1" />
        ))}
        <path d={runnerUpPath} fill="none" stroke="var(--text-2)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <path d={championPath} fill="none" stroke="var(--red)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {hoverIdx !== null && (
          <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={PAD_T} y2={PAD_T + INNER_H} stroke="var(--border)" strokeWidth="1" />
        )}
      </svg>

      {hovered && (
        <div
          className="absolute pointer-events-none bg-surface border border-border px-3 py-2 font-mono text-[11px] whitespace-nowrap"
          style={{
            left: `${Math.min(88, Math.max(12, tooltipLeft))}%`,
            top: 0,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-text-2 uppercase tracking-[0.08em] mb-1">
            {t('closestChampionships.round')} {hovered.round} · {hovered.raceName}
          </p>
          <p style={{ color: 'var(--red)' }}>{championName}: {hovered.championPoints}</p>
          <p className="text-text-2">{runnerUpName}: {hovered.runnerUpPoints}</p>
        </div>
      )}
    </div>
  );
}
