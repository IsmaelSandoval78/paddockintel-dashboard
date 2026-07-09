'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  CARD_SIZES,
  type CardFormat,
  type ScorecardSeasonBattleData,
  loadRecordFonts,
  drawSeasonBattleCard,
} from '@/components/scorecards/canvasUtils';

export function SeasonBattleScorecardButton({
  data,
  year,
}: {
  data: ScorecardSeasonBattleData;
  year: number;
}) {
  const t = useTranslations('scorecard');
  const tr = useTranslations('records');
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<CardFormat>('square');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fontsReady = useRef(false);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = CARD_SIZES[format];
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawSeasonBattleCard(ctx, width, height, data);
  }, [format, data]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    async function init() {
      if (!fontsReady.current) {
        await loadRecordFonts();
        fontsReady.current = true;
      }
      if (!cancelled) render();
    }
    init();
    return () => { cancelled = true; };
  }, [isOpen, format, render]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setIsOpen(false); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  function handleDownload() {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paddockintel-closest-championship-${year}-${format}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  const FORMATS: { key: CardFormat; label: string }[] = [
    { key: 'square', label: '1:1' },
    { key: 'story',  label: '9:16' },
    { key: 'wide',   label: '16:9' },
  ];

  const previewW = format === 'wide' ? 'min(720px, 88vw)' : 'min(380px, 80vw)';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-2 hover:text-red transition-colors duration-150"
      >
        {tr('shareScorecard')}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(8,8,8,0.88)' }}
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div className="bg-surface border border-border flex flex-col max-h-[94vh]">

            {/* Format tabs + close */}
            <div className="flex items-center gap-5 px-5 py-3 border-b border-border shrink-0">
              {FORMATS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFormat(key)}
                  className={[
                    'font-mono text-[11px] tracking-[0.06em] transition-colors duration-150',
                    format === key ? 'text-red' : 'text-text-2 hover:text-text-1',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setIsOpen(false)}
                className="ml-auto font-mono text-lg text-text-3 hover:text-text-1 transition-colors duration-150 leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Canvas preview */}
            <div className="overflow-auto p-5 flex items-center justify-center min-h-0">
              <div style={{ width: previewW }}>
                <canvas
                  ref={canvasRef}
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                />
              </div>
            </div>

            {/* Download */}
            <div className="px-5 py-3 border-t border-border shrink-0">
              <button
                onClick={handleDownload}
                className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-1 hover:text-red transition-colors duration-150"
              >
                {t('download')}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
