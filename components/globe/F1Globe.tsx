'use client';

import createGlobe from 'cobe';
import { useEffect, useRef } from 'react';

export interface GlobeCircuit {
  lat: number;
  lng: number;
  isNext: boolean;
  completed: boolean;
}

export default function F1Globe({ circuits }: { circuits: GlobeCircuit[] }) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const phiRef      = useRef(1.2);
  const widthRef    = useRef(0);
  const pointerDown = useRef<number | null>(null);
  const pointerDelta = useRef(0);
  const rafRef      = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      widthRef.current = canvas.offsetWidth;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const markers = circuits.map((c) => ({
      location: [c.lat, c.lng] as [number, number],
      size: c.isNext ? 0.07 : c.completed ? 0.04 : 0.025,
    }));

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width:  widthRef.current * 2,
      height: widthRef.current * 2,
      phi:    phiRef.current,
      theta:  0.15,
      dark:   1,
      diffuse: 1.1,
      mapSamples: 20000,
      mapBrightness: 5.5,
      baseColor:   [0.05, 0.05, 0.07],
      markerColor: [0.9, 0.08, 0.08],
      glowColor:   [0.08, 0.08, 0.10],
      markers,
    });

    requestAnimationFrame(() => { canvas.style.opacity = '1'; });

    const animate = () => {
      if (pointerDown.current === null) phiRef.current += 0.003;
      const w = widthRef.current * 2;
      globe.update({
        phi:    phiRef.current + pointerDelta.current / 180,
        width:  w,
        height: w,
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      globe.destroy();
      window.removeEventListener('resize', handleResize);
    };
  }, [circuits]);

  const startDrag = (clientX: number) => {
    pointerDown.current = clientX;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  };
  const moveDrag = (clientX: number) => {
    if (pointerDown.current === null) return;
    pointerDelta.current += (clientX - pointerDown.current) * 0.5;
    pointerDown.current = clientX;
  };
  const endDrag = () => {
    pointerDown.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  };

  return (
    <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-0 transition-opacity duration-700"
        style={{ cursor: 'grab', contain: 'layout paint size' }}
        onPointerDown={(e) => startDrag(e.clientX)}
        onPointerUp={endDrag}
        onPointerOut={endDrag}
        onMouseMove={(e) => moveDrag(e.clientX)}
        onTouchStart={(e) => e.touches[0] && startDrag(e.touches[0].clientX)}
        onTouchMove={(e) => e.touches[0] && moveDrag(e.touches[0].clientX)}
        onTouchEnd={endDrag}
      />

      {/* Info overlay */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3 pointer-events-none">
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em]">
          {circuits.filter((c) => c.completed).length} done
        </span>
        <span className="font-mono text-[10px] text-text-3">·</span>
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em]">
          {circuits.filter((c) => !c.completed && !c.isNext).length} to go
        </span>
        {circuits.some((c) => c.isNext) && (
          <>
            <span className="font-mono text-[10px] text-text-3">·</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--red)' }}>
              ● NEXT
            </span>
          </>
        )}
      </div>
    </div>
  );
}
