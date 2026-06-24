import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — PaddockIntel',
  description: 'Who writes PaddockIntel and why the analysis is credible.',
};

export default function AboutPage() {
  return (
    <main className="bg-bg min-h-screen px-5 py-12 max-w-2xl mx-auto">
      <h1
        className="text-[2rem] uppercase text-text-1"
        style={{ fontFamily: 'var(--pi-display)' }}
      >
        About
      </h1>

      {/* TODO: real author bio pending — see PHASES.md Phase 2.
          Do not replace with invented credentials; this section ships only
          once Ismael provides the actual background copy + photo. */}
      <div className="mt-8 border border-border-subtle p-5 font-mono text-[11px] uppercase tracking-[0.06em] text-text-3">
        TODO — bio pending
      </div>

      <p className="mt-6 font-sans text-text-1 leading-relaxed">
        PaddockIntel is written and maintained by Ismael Sandoval.
      </p>
    </main>
  );
}
