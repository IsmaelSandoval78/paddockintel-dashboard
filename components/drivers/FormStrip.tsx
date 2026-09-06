'use client';

import type { FormRace } from '@/lib/types';

// Last-5-races strip: P1 gold, podium ink, points raised, out of points ghost, DNF red ×.
// Oldest race left, most recent right — reads like a season timeline.
export default function FormStrip({ form }: { form: FormRace[] }) {
  return (
    <div className="flex items-center gap-[3px]">
      {form.map((r) => {
        let style: React.CSSProperties;
        let content: string;
        if (!r.raced) {
          style = { border: '1px solid var(--border-subtle)', color: 'var(--text-3)', opacity: 0.5 };
          content = '';
        } else if (r.retired) {
          style = { border: '1px solid var(--terracotta)', color: 'var(--terracotta)' };
          content = '×';
        } else if (r.position === 1) {
          style = { background: 'var(--gold)', color: 'var(--text-1)' };
          content = '1';
        } else if (r.position !== null && r.position <= 3) {
          style = { background: 'var(--text-1)', color: 'var(--bg)' };
          content = String(r.position);
        } else if (r.position !== null && r.position <= 10) {
          style = { background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-1)' };
          content = String(r.position);
        } else {
          style = { border: '1px solid var(--border-subtle)', color: 'var(--text-3)' };
          content = String(r.position ?? '');
        }
        return (
          <span
            key={r.round}
            title={`R${r.round} · ${r.raced ? (r.retired ? 'DNF' : `P${r.position}`) : '—'}`}
            className="w-[18px] h-[18px] flex items-center justify-center font-mono text-[9px] tabular-nums shrink-0 select-none"
            style={style}
          >
            {content}
          </span>
        );
      })}
    </div>
  );
}
