import type { Metadata } from 'next';
import { Link } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';

type PageParams = Promise<{ locale: string }>;

const SLUG = 'methodology/delta-ribbon';

function localeUrl(locale: string, slug: string): string {
  return locale === 'en'
    ? `https://paddockintel.com/${slug}/`
    : `https://paddockintel.com/${locale}/${slug}/`;
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;

  const title = 'Delta Ribbon Methodology — PaddockIntel';
  const description =
    'How Delta Ribbon is built: a descriptive, historical lap-delta visualization between two drivers, sourced from OpenF1 telemetry — not a forecast or projection.';

  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = localeUrl(l, SLUG);

  return {
    title,
    description,
    alternates: {
      canonical: localeUrl(locale, SLUG),
      languages,
    },
  };
}

const SECTIONS = [
  {
    num: '01',
    heading: 'What Delta Ribbon shows',
    body: (
      <>
        Delta Ribbon is a band drawn on top of a circuit&apos;s outline, one lap at a time. Its{' '}
        <strong className="text-text-1">color</strong> shows which of two selected drivers was
        ahead at each point around the lap. Its <strong className="text-text-1">width</strong>{' '}
        shows the size of the time gap between them at that same point — a thin ribbon means a
        close fight, a wide ribbon means a large gap. Small markers along the band flag two kinds
        of moment the data shows: a <strong className="text-text-1">snap</strong> (the lead
        changed hands) and a <strong className="text-text-1">defend</strong> (one driver closed to
        within about a second without getting past). Runs of quick, back-to-back lead changes in
        the same stretch of track are grouped and shown as a hatched &quot;braid&quot; instead of
        several separate snaps.
      </>
    ),
  },
  {
    num: '02',
    heading: 'What is actually measured',
    body: (
      <>
        The underlying number is a gap-to-leader difference: at each sampled instant, Delta Ribbon
        takes Driver A&apos;s and Driver B&apos;s official gap-to-race-leader and subtracts one
        from the other, giving the gap between those two drivers specifically. That value is then
        placed on the track outline using each driver&apos;s own recorded position: distance
        traveled is accumulated from their location samples and normalized to a 0–100% position
        around that lap, independent of the other driver&apos;s pace or position. The version
        currently shown on a circuit page renders the two drivers&apos; most recently completed
        lap of that session, gap-filled and smoothed into a continuous loop. Snap, defend and
        braid markers are found afterward by scanning that same completed gap series for lead
        changes and near-misses — they describe what already happened in the data, nothing more.
      </>
    ),
  },
  {
    num: '03',
    heading: 'Data source and coverage',
    body: (
      <>
        Delta Ribbon is built entirely from OpenF1&apos;s public telemetry endpoints — lap times,
        car location, car data, and interval (gap-to-leader) samples — pulled once per race by an
        offline loading script and written into PaddockIntel&apos;s own database. Pages never call
        OpenF1 directly; they read the precomputed result. Two coverage limits follow directly
        from that: OpenF1&apos;s telemetry does not extend before the 2023 season, so Delta Ribbon
        can only ever exist for a 2023-or-later session. And today the loader is intentionally
        scoped to one race and one driver pairing at a time — as of this writing, only the 2026
        Belgian Grand Prix, comparing Charles Leclerc and Max Verstappen, has been loaded. A
        circuit page without a matching load simply won&apos;t show a ribbon yet.
      </>
    ),
  },
  {
    num: '04',
    heading: 'What Delta Ribbon is not',
    body: (
      <>
        Delta Ribbon is a <strong className="text-text-1">descriptive, historical</strong>{' '}
        visualization of a session that has already finished. It does not forecast, project, or
        model where either driver might be in the future, and it carries no measure of
        forward-looking uncertainty. Every value on the ribbon — its color, its width, and its
        snap/defend/braid markers — is computed from telemetry recorded after the fact, not
        predicted ahead of it.
      </>
    ),
  },
];

export default async function DeltaRibbonMethodologyPage() {
  return (
    <main className="bg-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-2 mb-4">
          Methodology
        </p>
        <h1 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-[0.92] tracking-[-0.03em] text-text-1 mb-8">
          Delta Ribbon
        </h1>

        <p className="font-prose text-text-1 leading-relaxed mb-10">
          Delta Ribbon is PaddockIntel&apos;s proprietary chart for showing, lap by lap, how the
          time gap between two drivers opened and closed around a circuit. This page documents
          exactly what it computes, where the data comes from, and what it deliberately does not
          claim to do.
        </p>

        <div className="space-y-8 font-prose text-text-1 leading-relaxed">
          {SECTIONS.map((s) => (
            <section key={s.num}>
              <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-3 border-b border-border-subtle pb-2">
                {s.num} · {s.heading}
              </h2>
              <p>{s.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-12 pt-6 border-t border-border-subtle font-mono text-[11px] text-text-3">
          See it in context on any circuit page that has a loaded pairing, e.g.{' '}
          <Link href="/circuits/spa" className="text-terracotta hover:underline">
            Circuit de Spa-Francorchamps
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
