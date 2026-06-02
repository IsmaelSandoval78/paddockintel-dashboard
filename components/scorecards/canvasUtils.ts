// ─── Constants ────────────────────────────────────────────────────────────────

export const CARD_SIZES = {
  square: { width: 1080, height: 1080 },
  story:  { width: 1080, height: 1920 },
  wide:   { width: 1920, height: 1080 },
} as const;

export type CardFormat = keyof typeof CARD_SIZES;

const COLORS = {
  bg:    '#080808',
  text1: '#F5F5F0',
  text2: '#888884',
  text3: '#3a3a38',
};

const TEAM_COLORS: Record<string, string> = {
  mercedes:     '#00D2BE',
  mclaren:      '#FF8700',
  red_bull:     '#3671C6',
  ferrari:      '#E8002D',
  alpine:       '#FF87BC',
  aston_martin: '#358C75',
  haas:         '#B6BABD',
  williams:     '#64C4FF',
  sauber:       '#52E252',
  kick_sauber:  '#52E252',
  rb:           '#6692FF',
  alphatauri:   '#6692FF',
};

export function getTeamColor(ref: string): string {
  return TEAM_COLORS[ref] ?? '#3a3a38';
}

// ─── Asset loading ────────────────────────────────────────────────────────────

export async function loadFontsForCanvas(): Promise<void> {
  // Fonts are already loaded by the page CSS — we just ensure specific
  // variants are in the font cache before canvas uses them.
  try {
    await Promise.all([
      document.fonts.load('400 96px "DM Serif Display"'),
      document.fonts.load('500 24px Inter'),
      document.fonts.load('400 20px "JetBrains Mono"'),
    ]);
  } catch {
    // Canvas will fall back to system fonts if unavailable
  }
}

export async function loadLogoImage(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src =
      'https://paddockintel.com/content/images/2026/02/paddockintel-logo-light-xl.png';
  });
}

// ─── Data shapes ─────────────────────────────────────────────────────────────

export interface ScorecardDriverData {
  forename: string;
  surname: string;
  code: string | null;
  nationality: string;
  firstYear: number;
  lastYear: number;
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  championships: number;
  constructorRef: string;
}

export interface ScorecardConstructorData {
  name: string;
  constructorRef: string;
  nationality: string;
  firstYear: number;
  lastYear: number;
  races: number;
  wins: number;
  podiums: number;
  fastestLaps: number;
  championships: number;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function drawSharedChrome(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  logo: HTMLImageElement | null,
  teamColor: string,
  pad: number,
  ref: number,
): void {
  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  // Team color bar — bottom 6px
  ctx.fillStyle = teamColor;
  ctx.fillRect(0, h - 6, w, 6);

  // Logo — top-left
  if (logo) {
    const logoH = ref * 0.065;
    const logoW = logo.naturalWidth * (logoH / logo.naturalHeight);
    ctx.drawImage(logo, pad, pad, logoW, logoH);
  }

  // "paddockintel.com" watermark — bottom-left
  const wmSize = ref * 0.016;
  ctx.font = `400 ${wmSize}px "JetBrains Mono", monospace`;
  ctx.fillStyle = COLORS.text3;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('paddockintel.com', pad, h - pad * 0.5);
}

// ─── Portrait layout (1:1 + 9:16) ────────────────────────────────────────────
//
// Vertical positions expressed as fractions of h so both formats adapt.
// Font sizes use ref = min(w,h) so physical size is consistent.

function drawPortrait(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pad: number,
  ref: number,
  opts: {
    entityLabel: string;       // "DRIVER" | "CONSTRUCTOR"
    primaryLine: string;       // surname (CAPS) or constructor name
    secondaryLine: string;     // forename + code, or nationality
    metaLine: string;          // era / nationality + era
    heroValue: string;         // big number
    heroLabel: string;         // "WINS"
    stats: { value: string; label: string }[];
  },
): void {
  const { entityLabel, primaryLine, secondaryLine, metaLine, heroValue, heroLabel, stats } = opts;

  // Section label
  const labelSize = ref * 0.019;
  ctx.font = `400 ${labelSize}px "JetBrains Mono", monospace`;
  ctx.fillStyle = COLORS.text3;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(entityLabel, pad, h * 0.20);

  // Primary name
  const nameSize = ref * 0.089;
  ctx.font = `400 ${nameSize}px "DM Serif Display", Georgia, serif`;
  ctx.fillStyle = COLORS.text1;
  ctx.fillText(primaryLine, pad, h * 0.20 + nameSize * 1.2);

  // Secondary (forename / nationality)
  const metaSize = ref * 0.023;
  ctx.font = `500 ${metaSize}px Inter, sans-serif`;
  ctx.fillStyle = COLORS.text2;
  ctx.fillText(secondaryLine, pad, h * 0.20 + nameSize * 1.2 + metaSize * 1.8);

  // Era / meta
  const eraSize = ref * 0.019;
  ctx.font = `400 ${eraSize}px "JetBrains Mono", monospace`;
  ctx.fillStyle = COLORS.text3;
  ctx.fillText(metaLine, pad, h * 0.20 + nameSize * 1.2 + metaSize * 1.8 + eraSize * 2.0);

  // Hero number — right-aligned, vertically centred in the mid zone
  const heroSize = ref * 0.148;
  ctx.font = `400 ${heroSize}px "DM Serif Display", Georgia, serif`;
  ctx.fillStyle = COLORS.text1;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(heroValue, w - pad, h * 0.625);

  // Hero label
  const heroLabelSize = ref * 0.019;
  ctx.font = `400 ${heroLabelSize}px "JetBrains Mono", monospace`;
  ctx.fillStyle = COLORS.text3;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(heroLabel, w - pad, h * 0.625 + heroSize * 0.55 + heroLabelSize * 2);

  // Secondary stats — evenly spaced row
  const secNumSize = ref * 0.052;
  const secLabelSize = ref * 0.015;
  const secY = h * 0.845;
  const colW = (w - pad * 2) / stats.length;

  ctx.textAlign = 'left';
  stats.forEach(({ value, label }, i) => {
    const x = pad + i * colW;
    ctx.font = `400 ${secNumSize}px "DM Serif Display", Georgia, serif`;
    ctx.fillStyle = COLORS.text1;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, secY);
    ctx.font = `400 ${secLabelSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = COLORS.text3;
    ctx.fillText(label, x, secY + secLabelSize * 2.8);
  });
}

// ─── Landscape layout (16:9) ──────────────────────────────────────────────────

function drawLandscape(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pad: number,
  ref: number,
  opts: {
    entityLabel: string;
    primaryLine: string;
    secondaryLine: string;
    metaLine: string;
    heroValue: string;
    heroLabel: string;
    stats: { value: string; label: string }[];
  },
): void {
  const { entityLabel, primaryLine, secondaryLine, metaLine, heroValue, heroLabel, stats } = opts;
  const divider = w * 0.50;

  // Left column — label + name + meta + secondary stats
  ctx.textAlign = 'left';

  const labelSize = ref * 0.019;
  ctx.font = `400 ${labelSize}px "JetBrains Mono", monospace`;
  ctx.fillStyle = COLORS.text3;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(entityLabel, pad, h * 0.30);

  const nameSize = ref * 0.089;
  ctx.font = `400 ${nameSize}px "DM Serif Display", Georgia, serif`;
  ctx.fillStyle = COLORS.text1;
  const nameY = h * 0.30 + nameSize * 1.2;
  ctx.fillText(primaryLine, pad, nameY);

  const metaSize = ref * 0.023;
  ctx.font = `500 ${metaSize}px Inter, sans-serif`;
  ctx.fillStyle = COLORS.text2;
  const subY = nameY + metaSize * 1.8;
  ctx.fillText(secondaryLine, pad, subY);

  const eraSize = ref * 0.019;
  ctx.font = `400 ${eraSize}px "JetBrains Mono", monospace`;
  ctx.fillStyle = COLORS.text3;
  ctx.fillText(metaLine, pad, subY + eraSize * 2.0);

  // Secondary stats (left column, bottom)
  const secNumSize = ref * 0.052;
  const secLabelSize = ref * 0.015;
  const secY = h * 0.75;
  const colW = (divider - pad) / stats.length;
  stats.forEach(({ value, label }, i) => {
    const x = pad + i * colW;
    ctx.font = `400 ${secNumSize}px "DM Serif Display", Georgia, serif`;
    ctx.fillStyle = COLORS.text1;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, secY);
    ctx.font = `400 ${secLabelSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = COLORS.text3;
    ctx.fillText(label, x, secY + secLabelSize * 2.8);
  });

  // Vertical divider
  ctx.fillStyle = COLORS.text3;
  ctx.fillRect(divider, pad * 2, 0.5, h - pad * 4);

  // Right column — hero number centred
  const heroSize = ref * 0.148;
  ctx.font = `400 ${heroSize}px "DM Serif Display", Georgia, serif`;
  ctx.fillStyle = COLORS.text1;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(heroValue, divider + (w - divider) / 2, h * 0.48);

  const heroLabelSize = ref * 0.019;
  ctx.font = `400 ${heroLabelSize}px "JetBrains Mono", monospace`;
  ctx.fillStyle = COLORS.text3;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(heroLabel, divider + (w - divider) / 2, h * 0.48 + heroSize * 0.57 + heroLabelSize * 2);
  ctx.textAlign = 'left';
}

// ─── Public draw functions ────────────────────────────────────────────────────

export function drawDriverCard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: ScorecardDriverData,
  logo: HTMLImageElement | null,
  teamColor: string,
): void {
  const ref = Math.min(w, h);
  const pad = ref * 0.059;

  drawSharedChrome(ctx, w, h, logo, teamColor, pad, ref);

  const meta = data.code
    ? `${data.forename}  ${data.code}`
    : data.forename;

  const opts = {
    entityLabel: 'DRIVER',
    primaryLine: data.surname.toUpperCase(),
    secondaryLine: meta,
    metaLine: `${data.nationality}  ·  ${data.firstYear}–${data.lastYear}`,
    heroValue: String(data.wins),
    heroLabel: 'WINS',
    stats: [
      { value: String(data.championships), label: 'CHAMPS' },
      { value: String(data.podiums),       label: 'POD' },
      { value: String(data.poles),         label: 'POLES' },
    ],
  };

  if (w > h) {
    drawLandscape(ctx, w, h, pad, ref, opts);
  } else {
    drawPortrait(ctx, w, h, pad, ref, opts);
  }
}

export function drawConstructorCard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: ScorecardConstructorData,
  logo: HTMLImageElement | null,
  teamColor: string,
): void {
  const ref = Math.min(w, h);
  const pad = ref * 0.059;

  drawSharedChrome(ctx, w, h, logo, teamColor, pad, ref);

  const opts = {
    entityLabel: 'CONSTRUCTOR',
    primaryLine: data.name.toUpperCase(),
    secondaryLine: data.nationality,
    metaLine: `${data.firstYear}–${data.lastYear}`,
    heroValue: String(data.wins),
    heroLabel: 'WINS',
    stats: [
      { value: String(data.championships), label: 'CHAMPS' },
      { value: String(data.podiums),       label: 'POD' },
      { value: String(data.fastestLaps),   label: 'FL' },
    ],
  };

  if (w > h) {
    drawLandscape(ctx, w, h, pad, ref, opts);
  } else {
    drawPortrait(ctx, w, h, pad, ref, opts);
  }
}
