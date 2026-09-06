'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMiBox } from '@/lib/useMiBox';

function formatRef(ref: string): string {
  return ref.replace(/_/g, ' ').toUpperCase();
}

export default function MiBoxIndicator() {
  const t = useTranslations('miBox');
  const { state, ready, toggle } = useMiBox();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  if (!ready) return <span className="w-9 h-6 shrink-0" aria-hidden="true" />; // reserves layout, no shift on hydrate

  const total = state.drivers.length + state.constructors.length;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-cursor
        className="font-mono text-[11px] tabular-nums border border-border px-2 py-0.5 text-text-1 hover:border-terracotta hover:text-terracotta transition-colors duration-150"
        aria-expanded={open}
      >
        #{state.number}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border z-50"
          style={{ boxShadow: 'none' }}
        >
          <p className="font-mono text-[9px] text-text-3 uppercase tracking-[0.14em] px-3 py-2 border-b border-border-subtle">
            {t('title')} · #{state.number}
          </p>

          {total === 0 ? (
            <p className="font-mono text-[10px] text-text-3 px-3 py-4">{t('empty')}</p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {state.drivers.length > 0 && (
                <div>
                  <p className="font-mono text-[8px] text-text-3 uppercase tracking-[0.12em] px-3 pt-2">
                    {t('driversHeading')}
                  </p>
                  {state.drivers.map((ref) => (
                    <div key={ref} className="flex items-center justify-between gap-2 px-3 py-1.5">
                      <span className="font-mono text-[11px] text-text-1 truncate">{formatRef(ref)}</span>
                      <button
                        type="button"
                        onClick={() => toggle('driver', ref)}
                        className="font-mono text-[9px] text-text-3 hover:text-terracotta uppercase tracking-[0.08em] shrink-0"
                      >
                        {t('unfollow')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {state.constructors.length > 0 && (
                <div>
                  <p className="font-mono text-[8px] text-text-3 uppercase tracking-[0.12em] px-3 pt-2">
                    {t('constructorsHeading')}
                  </p>
                  {state.constructors.map((ref) => (
                    <div key={ref} className="flex items-center justify-between gap-2 px-3 py-1.5">
                      <span className="font-mono text-[11px] text-text-1 truncate">{formatRef(ref)}</span>
                      <button
                        type="button"
                        onClick={() => toggle('constructor', ref)}
                        className="font-mono text-[9px] text-text-3 hover:text-terracotta uppercase tracking-[0.08em] shrink-0"
                      >
                        {t('unfollow')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
