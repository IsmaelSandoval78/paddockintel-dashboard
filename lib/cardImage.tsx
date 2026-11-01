import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Shared by the server-rendered card images (next/og): the data cards (app/data-cards/[file]) and
// the Feed item cards (app/api/og/feed/[locale]/[slug]).
//
// next/og takes inline styles only, so the colours are restated here as hex values: they mirror
// globals.css :root (DESIGN.md v5.0.0, Warm Studio). Keep them in step with that file.
export const WARM = {
  bg: '#EDE7E3',
  surface: '#FFFFFF',
  border: '#DFD8D2',
  borderSubtle: '#E7E1DB',
  text1: '#12303A',
  text2: '#6E7C7E',
  accent: '#1A6B78',
  accentDim: '#DDEEF0',
};

// Fonts (SIL OFL, licences next to the files in public/fonts/cards/).
export const FONT_FILES = {
  Anton: 'Anton-Regular.ttf',
  'Archivo Black': 'ArchivoBlack-Regular.ttf',
  'JetBrains Mono': 'JetBrainsMono-Regular.ttf',
  Lora: 'Lora-Regular.ttf',
} as const;

// Read from disk when a PNG is prerendered at build; on the Cloudflare Worker, where there is no
// filesystem, fetched from the site's own static assets.
async function loadFont(file: string, origin: string): Promise<ArrayBuffer> {
  try {
    const buf = await readFile(path.join(process.cwd(), 'public', 'fonts', 'cards', file));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    const res = await fetch(new URL(`/fonts/cards/${file}`, origin));
    if (!res.ok) throw new Error(`font ${file}: HTTP ${res.status}`);
    return res.arrayBuffer();
  }
}

/** All card fonts, in the shape ImageResponse takes. */
export function loadCardFonts(origin: string) {
  return Promise.all(
    Object.entries(FONT_FILES).map(async ([name, f]) => ({ name, data: await loadFont(f, origin), weight: 400 as const, style: 'normal' as const })),
  );
}

export function Wordmark({ size, dot }: { size: number; dot: string }) {
  return (
    <div style={{ display: 'flex', fontFamily: 'Archivo Black', fontSize: size }}>
      <span>PADDOCK</span>
      <span style={{ color: dot }}>·</span>
      <span>INTEL</span>
    </div>
  );
}

// Headline size that keeps `lines` lines for a font whose average glyph is `em` wide.
export function fitSize(text: string, width: number, lines: number, em: number, max: number): number {
  return Math.min(max, Math.floor((width * lines) / Math.max(1, text.length * em)));
}
