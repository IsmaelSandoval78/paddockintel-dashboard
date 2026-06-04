// Server component — pure CSS hover, no client JS needed

interface TrackSvgProps {
  pathData: string;
  viewBox: string;
  circuitName: string;
}

export default function TrackSvg({ pathData, viewBox, circuitName }: TrackSvgProps) {
  return (
    <div
      className="w-full aspect-square border border-border"
      style={{ background: 'var(--bg)' }}
    >
      <svg
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full block"
        role="img"
        aria-label={`Track map — ${circuitName}`}
      >
        {/* Hover rule via embedded style — inline :hover on SVG path */}
        <style>{`
          .track-line {
            stroke: #050505;
            transition: stroke 120ms ease;
          }
          .track-line:hover {
            stroke: #E61919;
          }
        `}</style>
        <path
          d={pathData}
          className="track-line"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ cursor: 'default' }}
        />
      </svg>
    </div>
  );
}

export function TrackSvgFallback({ circuitName }: { circuitName: string }) {
  return (
    <div
      className="w-full aspect-square border border-border flex items-center justify-center"
      style={{ background: 'var(--bg)' }}
      aria-label={`Track map unavailable — ${circuitName}`}
    >
      <span className="font-mono text-[11px] text-text-3 uppercase tracking-[0.1em]">
        [ TRACK MAP NOT YET AVAILABLE ]
      </span>
    </div>
  );
}
