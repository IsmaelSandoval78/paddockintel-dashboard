'use client';

import { useEffect, useRef, useState } from 'react';

type ShareButtonProps = {
  url: string;
  title: string;
  className?: string;
};

function resolveUrl(url: string): string {
  if (url.startsWith('http')) return url;
  if (typeof window === 'undefined') return url;
  return `${window.location.origin}${url}`;
}

export default function ShareButton({ url, title, className }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function handleClick() {
    const fullUrl = resolveUrl(url);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: fullUrl });
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    setOpen((v) => !v);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(resolveUrl(url));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const fullUrl = resolveUrl(url);
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div ref={rootRef} className={`relative inline-block ${className ?? ''}`}>
      <button
        onClick={handleClick}
        aria-label="Share"
        className="w-9 h-9 flex items-center justify-center rounded-none border border-border-subtle text-text-1 hover:text-terracotta hover:border-terracotta transition-colors duration-150"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12m0-12l-4 4m4-4l4 4M5 12v7a1 1 0 001 1h12a1 1 0 001-1v-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-bg border border-border rounded-none">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${title} ${fullUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 font-mono text-[11px] tracking-[0.06em] uppercase text-text-1 hover:text-terracotta hover:bg-surface-raised transition-colors duration-150 border-b border-border-subtle"
          >
            WhatsApp
          </a>
          <button
            onClick={handleCopy}
            className="block w-full text-left px-3 py-2 font-mono text-[11px] tracking-[0.06em] uppercase text-text-1 hover:text-terracotta hover:bg-surface-raised transition-colors duration-150 border-b border-border-subtle"
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 font-mono text-[11px] tracking-[0.06em] uppercase text-text-1 hover:text-terracotta hover:bg-surface-raised transition-colors duration-150 border-b border-border-subtle"
          >
            X
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 font-mono text-[11px] tracking-[0.06em] uppercase text-text-1 hover:text-terracotta hover:bg-surface-raised transition-colors duration-150"
          >
            Facebook
          </a>
        </div>
      )}
    </div>
  );
}
