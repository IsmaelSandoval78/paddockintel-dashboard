import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadArchivoBlack } from "@remotion/google-fonts/ArchivoBlack";

const { fontFamily: MONO } = loadJetBrainsMono();
const { fontFamily: DISPLAY } = loadArchivoBlack();

// ─── Blueprint design tokens (DESIGN.md — "Motion pieces (Remotion)") ─────
const BG = "#F4F4F0";
const GRID = "#E4E4DD";
const INK = "#1A1A18";
const ACCENT = "#E61919";
const NEUTRAL = "#8A8A82";

type DriverTelemetry = { x: number; y: number; speed: number; t: number };

export type LapFrame = {
  distanceMeters: number;
  driverA: DriverTelemetry;
  driverB: DriverTelemetry;
  gapSeconds: number; // driverB time - driverA time; positive = driverA ahead
};

export type DriverMeta = { name: string; code: string; lapTimeSeconds: number };

// Generic two-driver fastest-lap comparison — pass any race/pair via `data`,
// nothing here is specific to a single race or driver pairing.
export type LapComparisonData = {
  race: string;
  driverA: DriverMeta;
  driverB: DriverMeta;
  frames: LapFrame[];
};

const surname = (fullName: string) => fullName.trim().split(" ").slice(-1)[0].toUpperCase();

export const LAP_COMPARISON_FPS = 30;
const MAIN_SECONDS = 9;
const EASE_SECONDS = 1;
const HOLD_SECONDS = 2;
export const LAP_COMPARISON_DURATION_IN_FRAMES =
  (MAIN_SECONDS + EASE_SECONDS + HOLD_SECONDS) * LAP_COMPARISON_FPS;

const smoothstep = (t: number) => {
  const c = Math.min(Math.max(t, 0), 1);
  return c * c * (3 - 2 * c);
};

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const rem = (s - m * 60).toFixed(3).padStart(6, "0");
  return `${m}:${rem}`;
};

export const LapComparison: React.FC<{ data: LapComparisonData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { frames } = data;
  const lastIdx = frames.length - 1;

  const mainFrames = MAIN_SECONDS * LAP_COMPARISON_FPS;
  const easeFrames = EASE_SECONDS * LAP_COMPARISON_FPS;

  // continuous sample index into the telemetry array for the main lap phase
  const rawIndex = interpolate(frame, [0, mainFrames - 1], [0, lastIdx], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const idx0 = Math.floor(rawIndex);
  const idx1 = Math.min(idx0 + 1, lastIdx);
  const t = rawIndex - idx0;
  const lerp = (a: number, b: number) => a + (b - a) * t;

  const aX = lerp(frames[idx0].driverA.x, frames[idx1].driverA.x);
  const aY = lerp(frames[idx0].driverA.y, frames[idx1].driverA.y);
  const bX = lerp(frames[idx0].driverB.x, frames[idx1].driverB.x);
  const bY = lerp(frames[idx0].driverB.y, frames[idx1].driverB.y);
  const sampledGap = lerp(frames[idx0].gapSeconds, frames[idx1].gapSeconds);

  const trueFinalGap = data.driverB.lapTimeSeconds - data.driverA.lapTimeSeconds; // positive = driverA ahead

  let gap: number;
  if (frame <= mainFrames) {
    gap = sampledGap;
  } else if (frame <= mainFrames + easeFrames) {
    const easeT = (frame - mainFrames) / easeFrames;
    gap = sampledGap + (trueFinalGap - sampledGap) * smoothstep(easeT);
  } else {
    gap = trueFinalGap;
  }

  const leaderIsA = gap >= 0;
  const revealedA = frames.slice(0, idx0 + 1).map((f) => [f.driverA.x, f.driverA.y] as const);
  revealedA.push([aX, aY]);
  const revealedB = frames.slice(0, idx0 + 1).map((f) => [f.driverB.x, f.driverB.y] as const);
  revealedB.push([bX, bY]);

  const HILITE = 35;
  const hilitePoints = leaderIsA ? revealedA.slice(-HILITE) : revealedB.slice(-HILITE);

  // world-space bounds (computed once from the full dataset) → SVG viewBox
  const allX = frames.flatMap((f) => [f.driverA.x, f.driverB.x]);
  const allY = frames.flatMap((f) => [f.driverA.y, f.driverB.y]);
  const pad = 900;
  const minX = Math.min(...allX) - pad;
  const maxX = Math.max(...allX) + pad;
  const minY = Math.min(...allY) - pad;
  const maxY = Math.max(...allY) + pad;
  const w = maxX - minX;
  const h = maxY - minY;

  const step = 1000;
  const gridLinesX: number[] = [];
  for (let gx = Math.floor(minX / step) * step; gx < maxX; gx += step) gridLinesX.push(gx);
  const gridLinesY: number[] = [];
  for (let gy = Math.floor(minY / step) * step; gy < maxY; gy += step) gridLinesY.push(gy);

  const toPointsAttr = (pts: readonly (readonly [number, number])[]) =>
    pts.map(([x, y]) => `${x},${-y}`).join(" "); // flip Y: SVG y-down vs. telemetry y-up

  const gapLabel = (g: number) => {
    if (Math.abs(g) < 0.005) return "|—  Δ 0.000s  —|";
    const leader = g < 0 ? data.driverB.code : data.driverA.code;
    return `|—  ${leader} Δ${Math.abs(g).toFixed(3)}s  —|`;
  };

  const showFinal = frame >= mainFrames;

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <svg
        viewBox={`${minX} ${-maxY} ${w} ${h}`}
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        {gridLinesX.map((gx) => (
          <line key={`gx${gx}`} x1={gx} x2={gx} y1={-maxY} y2={-minY} stroke={GRID} strokeWidth={2} />
        ))}
        {gridLinesY.map((gy) => (
          <line key={`gy${gy}`} x1={minX} x2={maxX} y1={-gy} y2={-gy} stroke={GRID} strokeWidth={2} />
        ))}

        <polyline points={toPointsAttr(revealedA)} fill="none" stroke={NEUTRAL} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={toPointsAttr(revealedB)} fill="none" stroke={NEUTRAL} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />

        <polyline points={toPointsAttr(hilitePoints)} fill="none" stroke={ACCENT} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" />

        <circle cx={bX} cy={-bY} r={26} fill={leaderIsA ? INK : ACCENT} stroke={BG} strokeWidth={7} />
        <circle cx={aX} cy={-aY} r={26} fill={leaderIsA ? ACCENT : INK} stroke={BG} strokeWidth={7} />
      </svg>

      {/* header card — hard-offset shadow, no blur */}
      <div style={{ position: "absolute", top: 60, left: 54, right: 54 }}>
        <div style={{ position: "absolute", top: 8, left: 8, right: -8, bottom: -8, background: INK }} />
        <div
          style={{
            position: "relative",
            background: BG,
            border: `3px solid ${INK}`,
            padding: "20px 24px 14px",
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 14, color: NEUTRAL, letterSpacing: 3 }}>
            FASTEST LAP COMPARISON
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 34, color: INK, letterSpacing: 0.5, marginTop: 4 }}>
            {surname(data.driverA.name)} vs {surname(data.driverB.name)}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 15, color: NEUTRAL, marginTop: 8 }}>
            {showFinal
              ? `${data.driverA.code} ${fmtTime(data.driverA.lapTimeSeconds)}   ·   ${data.driverB.code} ${fmtTime(data.driverB.lapTimeSeconds)}   ·   FINAL MARGIN ${Math.abs(trueFinalGap).toFixed(3)}s`
              : data.race.toUpperCase()}
          </div>
        </div>
      </div>

      {/* delta callout — dimension-line style, one stat at a time */}
      <div style={{ position: "absolute", bottom: 96, left: "50%", transform: "translateX(-50%)", width: "62%" }}>
        <div style={{ position: "absolute", top: 8, left: 8, right: -8, bottom: -8, background: INK }} />
        <div
          style={{
            position: "relative",
            background: BG,
            border: `3px solid ${INK}`,
            padding: "22px 0",
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 38, fontWeight: 700, color: INK }}>{gapLabel(gap)}</div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 56,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 15,
          color: NEUTRAL,
        }}
      >
        ● {data.driverA.name.toUpperCase()}        ● {data.driverB.name.toUpperCase()}
      </div>
    </AbsoluteFill>
  );
};
