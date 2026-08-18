'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { useMiBox } from '@/lib/useMiBox';
import { teamColor } from './teamColors';
import type { MiBoxSummaryResponse } from '@/app/api/mi-box/summary/route';

// Deliberately does NOT reorder any ranked list (standings, wins) — that would misrepresent
// real position/wins data, which the project's data-integrity rule forbids. Instead this is
// its own personal module: "how are the people you follow doing", pulled to the top of the
// page, with the canonical ranked lists below left untouched. See CONCEPT-V2.md §4.
//
// Client-fetched, not server-rendered — the Hub home page has `revalidate = 3600` (ISR);
// reading the mi-box cookie in a Server Component there would force full dynamic rendering
// on every request. See app/api/mi-box/summary/route.ts for the fuller rationale.
export default function MiBoxStrip() {
  const t = useTranslations('miBox');
  const { state, ready } = useMiBox();
  const [data, setData] = useState<MiBoxSummaryResponse | null>(null);

  const hasFollows = state.drivers.length > 0 || state.constructors.length > 0;

  useEffect(() => {
    if (!ready || !hasFollows) return;
    const params = new URLSearchParams({
      drivers: state.drivers.join(','),
      constructors: state.constructors.join(','),
    });
    fetch(`/api/mi-box/summary?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: MiBoxSummaryResponse | null) => setData(json))
      .catch(() => setData(null));
  }, [ready, hasFollows, state.drivers, state.constructors]);

  if (!ready || !hasFollows || !data) return null;
  if (data.drivers.length === 0 && data.constructors.length === 0) return null;

  return (
    <section className="border-b border-border px-5 md:px-10 py-6 md:py-8">
      <p className="font-mono text-[9px] md:text-[10px] text-text-2 uppercase tracking-[0.18em] mb-4">
        {t('title')}
      </p>
      <div className="flex gap-3 overflow-x-auto">
        {data.drivers.map((d) => (
          <Link
            key={`d-${d.ref}`}
            href={`/drivers/${d.ref}`}
            data-cursor
            className="shrink-0 flex flex-col gap-1 px-4 py-3 border border-border-subtle hover:border-red transition-colors duration-150"
            style={{ borderLeft: `2px solid ${teamColor(d.constructorRef)}` }}
          >
            <span className="font-mono text-[11px] text-text-1 uppercase tracking-[0.04em] whitespace-nowrap">
              {d.surname}
            </span>
            <span className="font-mono text-[10px] text-text-3 tabular-nums">
              {d.position ? `P${d.position}` : '—'} · {d.points ?? '—'} pts
            </span>
          </Link>
        ))}
        {data.constructors.map((c) => (
          <Link
            key={`c-${c.ref}`}
            href={`/constructors/${c.ref}`}
            data-cursor
            className="shrink-0 flex flex-col gap-1 px-4 py-3 border border-border-subtle hover:border-red transition-colors duration-150"
            style={{ borderLeft: `2px solid ${teamColor(c.ref)}` }}
          >
            <span className="font-mono text-[11px] text-text-1 uppercase tracking-[0.04em] whitespace-nowrap">
              {c.name}
            </span>
            <span className="font-mono text-[10px] text-text-3 tabular-nums">
              {c.position ? `P${c.position}` : '—'} · {c.points ?? '—'} pts
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
