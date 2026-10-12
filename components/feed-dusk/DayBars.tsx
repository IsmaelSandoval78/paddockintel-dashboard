// Stories per day as columns; days with no story keep a stub so the gap is visible, the latest
// day with stories glows. Heights are to one scale (the busiest day in the window).

type Day = { key: string; day: number; count: number; title: string };

export default function DayBars({ days, highlight, ariaLabel }: { days: Day[]; highlight: string; ariaLabel: string }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="flex items-end gap-1.5 h-[92px]" role="img" aria-label={ariaLabel}>
      {days.map((d) => {
        const on = d.key === highlight;
        return (
          <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5" title={d.title}>
            <span
              className="block w-full rounded-t-md rounded-b-sm"
              style={{
                height: `${Math.max(4, Math.round((d.count / max) * 70))}px`,
                background: on ? 'var(--dusk-warm)' : '#3A3442',
                boxShadow: on ? '0 0 8px rgba(240,122,69,.5)' : undefined,
              }}
            />
            <span className="dusk-mono text-[10px] text-[color:var(--dusk-muted)]">{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}
