'use client';

export interface CareerStageRow {
  season: string;
  series: string;
  team: string | null;
  position: string | null;
  points: string | null;
  roleNote: string | null;
  isF1: boolean;
}

export default function CareerPathTimeline({ rows }: { rows: CareerStageRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="relative px-6 py-6">
      {/* Connecting line */}
      <div
        className="absolute left-6 right-6 h-px"
        style={{ top: '38px', background: 'var(--border)' }}
        aria-hidden="true"
      />

      <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 shrink-0"
            style={{ minWidth: 132, scrollSnapAlign: 'start' }}
          >
            {/* Marker dot */}
            <div
              className="w-2.5 h-2.5 shrink-0 relative z-10"
              style={{
                background: row.isF1 ? 'var(--terracotta)' : 'var(--text-3)',
                border: '2px solid var(--surface)',
              }}
              aria-hidden="true"
            />

            {/* Card */}
            <div
              className="w-full px-3 py-2.5 text-center"
              style={{
                border: `1px solid ${row.isF1 ? 'var(--terracotta)' : 'var(--border)'}`,
                background: 'var(--surface)',
              }}
            >
              <p
                className="leading-none tabular-nums mb-1.5"
                style={{ fontFamily: 'var(--pi-display)', fontSize: '15px', color: 'var(--text-1)' }}
              >
                {row.season}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.04em] text-text-3 leading-snug mb-1">
                {row.series}
              </p>
              {row.team && (
                <p className="text-[10px] text-text-2 truncate mb-1.5">{row.team}</p>
              )}
              <p
                className="font-mono text-[11px] tabular-nums"
                style={{ color: row.isF1 ? 'var(--terracotta)' : 'var(--text-2)' }}
              >
                {row.roleNote ?? (row.position ?? '—')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
