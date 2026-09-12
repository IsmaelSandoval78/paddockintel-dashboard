import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

// Per-article hero-number card, auto-generated from the article's own real
// `stats` (EDITORIAL.md already requires these on every article) -- no
// per-article manual image work, no stock photography.
//
// This is a plain Route Handler, not the app/[locale]/(blog)/[slug]/
// opengraph-image.tsx file convention -- that convention appends an
// unpredictable content hash to the URL for any *dynamic* image inside a
// param'd segment (confirmed via `next build`: it resolved to
// /[locale]/[slug]/opengraph-image-1o9wtw, not .../opengraph-image), which
// breaks a JSON-LD `image` field that has to be a fixed, known URL. A route
// handler's URL is exactly what we write here -- no surprises.

export const size = { width: 1200, height: 630 };

type Stat = { value: string; label: string; unit?: string };

const KRAFT = '#EDE3D0';
const TERRACOTTA = '#C1502E';
const INK = '#2B2620';
const MUTED = '#6B5F4E';
const GHOST = '#A69A82';

function BrandCard() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: KRAFT,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', fontWeight: 900, fontSize: 180, letterSpacing: '-0.04em' }}>
        <span style={{ color: TERRACOTTA }}>P</span>
        <span style={{ color: INK }}>I</span>
      </div>
      <div style={{ display: 'flex', marginTop: 24, fontWeight: 700, fontSize: 44, letterSpacing: '0.08em', color: INK }}>
        PADDOCKINTEL
      </div>
    </div>
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; slug: string }> }
) {
  const { locale, slug } = await params;
  const supabase = createClient();
  const { data } = await supabase
    .from('articles')
    .select('stats')
    .eq('locale', locale)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  const stats = (data?.stats as Stat[] | null) ?? [];
  const hero = stats[0];

  if (!hero) {
    return new ImageResponse(<BrandCard />, { ...size });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: KRAFT,
          fontFamily: 'sans-serif',
          padding: '0 100px',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', fontWeight: 700, fontSize: 26, letterSpacing: '0.16em', color: GHOST }}>
          PADDOCKINTEL
        </div>
        <div style={{ display: 'flex', marginTop: 36, fontWeight: 900, fontSize: 240, letterSpacing: '-0.03em', color: TERRACOTTA, lineHeight: 1 }}>
          {hero.value}
        </div>
        <div style={{ display: 'flex', width: 220, borderTop: `2px solid ${INK}`, marginTop: 32, marginBottom: 32 }} />
        <div style={{ display: 'flex', fontWeight: 700, fontSize: 32, letterSpacing: '0.03em', color: INK }}>
          {hero.label}
        </div>
        {hero.unit ? (
          <div style={{ display: 'flex', marginTop: 12, fontSize: 22, letterSpacing: '0.02em', color: MUTED }}>
            {hero.unit}
          </div>
        ) : null}
      </div>
    ),
    { ...size }
  );
}
