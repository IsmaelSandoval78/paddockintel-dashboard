'use client';

import { useTranslations } from 'next-intl';
import { useMiBox } from '@/lib/useMiBox';

export default function FollowButton({
  kind,
  reference,
  color,
  idleBorderColor = 'var(--border)',
  idleTextColor = 'var(--text-2)',
}: {
  kind: 'driver' | 'constructor';
  reference: string;
  color: string;
  /** Override for pages not yet migrated to Data Mode tokens (e.g. Constructors detail,
   *  still hardcoded-light per CONCEPT-V2.md §7 — the default `var(--border)`/`var(--text-2)`
   *  would render as dark-navy-tuned values there and clash with the page's light hex). */
  idleBorderColor?: string;
  idleTextColor?: string;
}) {
  const t = useTranslations('miBox');
  const { ready, isFollowed, toggle } = useMiBox();

  // Renders the same size/position before and after hydration (unfollowed) to avoid layout
  // shift — `ready` only gates the color/label, never whether the button exists.
  const followed = ready && isFollowed(kind, reference);

  return (
    <button
      type="button"
      onClick={() => toggle(kind, reference)}
      data-cursor
      className="font-mono text-[10px] uppercase tracking-[0.1em] border px-2.5 py-1 transition-colors duration-150 shrink-0"
      style={{
        borderColor: followed ? color : idleBorderColor,
        color: followed ? color : idleTextColor,
      }}
      aria-pressed={followed}
    >
      {followed ? `✓ ${t('following')}` : `+ ${t('follow')}`}
    </button>
  );
}
