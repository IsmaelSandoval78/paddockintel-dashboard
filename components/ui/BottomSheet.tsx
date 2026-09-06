'use client';

import { useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, children }: Props) {
  const startYRef = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    startYRef.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (startYRef.current === null) return;
    const delta = e.changedTouches[0].clientY - startYRef.current;
    if (delta > 60) onClose();
    startYRef.current = null;
  }

  return (
    <>
      {/* Backdrop — tap to close */}
      <div
        className="fixed inset-0 z-40 md:hidden"
        style={{
          background: open ? 'rgba(5,5,5,0.3)' : 'transparent',
          transition: 'background 150ms',
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden h-[60vh] overflow-y-auto"
        style={{
          background: 'var(--bg)',
          borderTop: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 150ms ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div style={{ width: '32px', height: '2px', background: 'var(--border-subtle)', borderRadius: 0 }} />
        </div>

        {children}
      </div>
    </>
  );
}
