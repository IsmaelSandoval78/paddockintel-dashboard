'use client';

import { useState, useRef, useEffect } from 'react';

export default function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-[14px] h-[14px] border border-border-subtle flex items-center justify-center font-mono text-[9px] text-text-3 hover:border-text-2 hover:text-text-2 transition-colors duration-150 leading-none"
        aria-label="More info"
        aria-expanded={open}
      >
        i
      </button>
      {open && (
        <div
          className="absolute z-50 left-5 top-0 w-60 bg-text-1 border border-border p-3 font-mono text-[10px] leading-relaxed"
          style={{ color: 'var(--bg)' }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
