import { Link } from '@/lib/i18n/navigation';
import type { ResolvedHookDeliver } from '@/lib/hookDeliver';

// Facts next to a Feed hook. Opinion stays on the Blog / the issue — this block
// has no Verdict chrome. Orange is the number only; the Hub link uses teal.

export default function HookDeliverBlock({
  data,
  contextLabel,
  sourceLabel,
  hubLabel,
  variant,
}: {
  data: ResolvedHookDeliver;
  contextLabel: string;
  sourceLabel: string;
  hubLabel: string;
  variant: 'compact' | 'page';
}) {
  if (variant === 'page') {
    return (
      <section className="soft-card mt-6 min-w-0 p-4 md:p-5" aria-label={contextLabel}>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent">{contextLabel}</p>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          {data.callouts.map((callout) => (
            <div key={`${callout.source}-${callout.label}`} className="min-w-0 rounded-sm bg-surface-raised px-3 py-3">
              <p className="font-sans text-[1.75rem] font-extrabold tabular-nums leading-none text-accent-2">{callout.value}</p>
              <p className="mt-2 break-words font-mono text-[10px] uppercase leading-snug tracking-[0.08em] text-text-2">{callout.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 truncate font-mono text-[9px] uppercase tracking-[0.08em] text-text-3" title={sourceLabel}>
          {sourceLabel}
        </p>
        <Link
          href={data.hub.href}
          className="mt-3 inline-block max-w-full truncate font-mono text-[10px] uppercase tracking-[0.08em] text-accent hover:underline"
        >
          {hubLabel}
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-3 min-w-0" aria-label={contextLabel}>
      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent">{contextLabel}</p>
      <ul className="mt-1.5 flex flex-col gap-1.5">
        {data.callouts.map((callout) => (
          <li key={`${callout.source}-${callout.label}`} className="min-w-0 rounded-sm bg-surface-raised px-2.5 py-1.5">
            <p className="font-sans text-base font-extrabold tabular-nums leading-none text-accent-2">{callout.value}</p>
            <p className="mt-1 break-words font-mono text-[9px] uppercase leading-snug tracking-[0.06em] text-text-2">
              {callout.label}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 truncate font-mono text-[9px] uppercase tracking-[0.08em] text-text-3" title={sourceLabel}>
        {sourceLabel}
      </p>
      <Link
        href={data.hub.href}
        className="mt-1.5 inline-block max-w-full truncate font-mono text-[10px] uppercase tracking-[0.08em] text-accent hover:underline"
      >
        {hubLabel}
      </Link>
    </section>
  );
}
