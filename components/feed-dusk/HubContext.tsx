import { Link } from '@/lib/i18n/navigation';
import type { ResolvedHookDeliver } from '@/lib/hookDeliver';

// Hook & Deliver facts (lib/hookDeliver.ts, resolved from Supabase) in the dusk chart language:
// ice is the "context" colour, so these never compete with a story's own key number (sunset).

type Props = { data: ResolvedHookDeliver; contextLabel: string; sourceLabel: string; hubLabel: string };

export default function HubContext({ data, contextLabel, sourceLabel, hubLabel }: Props) {
  return (
    <section
      className="rounded-2xl p-3.5 flex flex-col gap-2.5 bg-[rgba(143,211,255,0.06)] border border-[rgba(143,211,255,0.22)] min-w-0"
      aria-label={contextLabel}
    >
      <p className="dusk-label m-0 text-[color:var(--dusk-ice)]">{contextLabel}</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-2.5">
        {data.callouts.map((c) => (
          <div key={`${c.source}-${c.label}`} className="min-w-0">
            <p className="dusk-display tabular-nums text-[1.35rem] leading-none m-0 text-[color:var(--dusk-ice)]">{c.value}</p>
            <p className="text-[12px] leading-[1.35] text-[color:var(--dusk-ink-2)] mt-1 mb-0 break-words">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-between gap-2.5">
        <span className="dusk-mono text-[10.5px] tracking-[0.03em] text-[color:var(--dusk-muted)]">{sourceLabel}</span>
        <Link href={data.hub.href} className="dusk-mono text-[11px] text-[color:var(--dusk-ice)] hover:underline">
          {hubLabel}
        </Link>
      </div>
    </section>
  );
}
