'use client';

import { useEffect, useState } from 'react';
import type { Heading } from '@/lib/markdown';

interface ArticleTOCProps {
  toc: Heading[];
  locale: string;
}

const LABEL: Record<string, string> = {
  en: 'In This Article',
  es: 'En Este Artículo',
  pt: 'Neste Artigo',
};

export default function ArticleTOC({ toc, locale }: ArticleTOCProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (toc.length === 0) return;

    const headings = document.querySelectorAll<HTMLElement>(
      '.prose-article h2[id], .prose-article h3[id]'
    );

    const observer = new IntersectionObserver(
      (entries) => {
        // Use the topmost intersecting heading as active
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-8% 0% -80% 0%', threshold: 0 }
    );

    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  const label = LABEL[locale] ?? LABEL.en;

  const list = (
    <ol className="space-y-2">
      {toc.map((item) => {
        const isActive = activeId === item.id;
        return (
          <li
            key={item.id}
            style={{ paddingLeft: item.level === 3 ? '0.75rem' : '0' }}
          >
            <a
              href={`#${item.id}`}
              className="font-mono text-[11px] flex items-baseline gap-1.5 transition-colors duration-150"
              style={{ color: isActive ? 'var(--red)' : 'var(--text-2)' }}
            >
              <span
                className="shrink-0 transition-colors duration-150"
                aria-hidden="true"
                style={{ color: isActive ? 'var(--red)' : 'var(--border-subtle)' }}
              >
                →
              </span>
              <span>{item.text}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      {/* Desktop: static panel in sticky sidebar */}
      <div className="hidden lg:block">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 mb-3">
          {label}
        </p>
        {list}
      </div>

      {/* Mobile: collapsible details */}
      <details className="lg:hidden mb-8 border border-border-subtle group">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2">
            {label}
          </span>
          <span
            className="font-mono text-[11px] text-text-3 transition-transform duration-150 group-open:rotate-180"
            aria-hidden="true"
          >
            ↓
          </span>
        </summary>
        <div className="px-4 pb-4 pt-2 border-t border-border-subtle">{list}</div>
      </details>
    </>
  );
}
