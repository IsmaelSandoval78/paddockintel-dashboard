import type { ReactNode } from 'react';

type BentoGridProps = {
  children: ReactNode;
  /** Desktop column behavior above the 1280px breakpoint, e.g. "lg:grid-cols-3" */
  desktopCols?: string;
  className?: string;
};

/**
 * Responsive card-grid primitive shared by Digest (Phase 4) and any future
 * card-list surface. Mobile: 1 col. Tablet (768px+): 2 col. Desktop: caller-supplied.
 */
export default function BentoGrid({ children, desktopCols = 'lg:grid-cols-3', className }: BentoGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${desktopCols} gap-px bg-border ${className ?? ''}`}>
      {children}
    </div>
  );
}
