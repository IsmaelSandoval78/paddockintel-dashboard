'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import type { SearchResult } from '@/app/api/search/route';

export default function SearchBar({ className = 'max-w-[220px]' }: { className?: string }) {
  const t = useTranslations('search');
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    // Below 2 chars the dropdown is hidden by `showDropdown` regardless, so
    // stale results/loading state from a longer prior query is harmless —
    // skip fetching without touching state synchronously in the effect body.
    if (trimmed.length < 2) return;

    const handle = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}&locale=${locale}`)
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query, locale]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-border-subtle focus-within:border-text-1 transition-colors duration-150">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-3 shrink-0"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t('placeholder')}
          aria-label={t('ariaLabel')}
          className="w-full bg-transparent border-0 outline-none py-1.5 font-sans text-[13px] text-text-1 placeholder:text-text-3"
        />
      </div>

      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-bg border border-border max-h-[70vh] overflow-y-auto z-50 min-w-[280px]"
          style={{ borderRadius: 'var(--radius-sm)' }}
        >
          {loading ? (
            <div className="px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-3">
              {t('searching')}
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-3">
              {t('noResults')}
            </div>
          ) : (
            results.map((r) => (
              <Link
                key={r.slug}
                href={`/${r.slug}`}
                onClick={() => {
                  setOpen(false);
                  setQuery('');
                }}
                className="block px-3 py-2.5 border-b border-border-subtle last:border-b-0 hover:bg-surface-raised transition-colors duration-150"
              >
                <div className="font-sans text-[13px] text-text-1 leading-snug">{r.title}</div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
