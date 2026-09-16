// Shared loading UI for the site's highest-traffic routes (Hub home,
// Magazine home, an article, /feed, /glossary). Not a spinner -- DESIGN.md's
// "motion maps to meaning" rule means even a loading state should read as an
// F1 concept, not a generic UI widget. "Reading telemetry" is what the data
// layer is actually doing (a Supabase query resolving), so that's the copy.
// A blinking cursor stands in for the blinking readout in the reference
// aesthetic (2011 earthquake-infographic style, kraft substrate) rather than
// a rotating spinner, which never appears anywhere else on this site.
export default function RouteLoading() {
  return (
    <main className="min-h-[70vh] bg-bg flex items-center justify-center px-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">
        Reading telemetry
        <span className="rl-cursor" aria-hidden="true">
          _
        </span>
      </p>
      <style>{`
        .rl-cursor { animation: rl-blink 1s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .rl-cursor { animation: none; }
        }
        @keyframes rl-blink { 50% { opacity: 0; } }
      `}</style>
    </main>
  );
}
