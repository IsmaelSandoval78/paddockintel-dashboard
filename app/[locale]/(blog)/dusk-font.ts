import localFont from 'next/font/local';

// "Telemetry at Dusk" (docs/DECISION-2026-10-11-home-dusk.md): UI/body face for the pages that
// render `.theme-dusk` (magazine home and articles) only. Apply `duskSans.variable` on that root.
// Self-hosted (app/fonts/, SIL OFL): Google Fonts' latin variable file, once per weight as before.
export const duskSans = localFont({
  src: [
    { path: '../../fonts/InstrumentSans-Variable-latin.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/InstrumentSans-Variable-latin.woff2', weight: '500', style: 'normal' },
    { path: '../../fonts/InstrumentSans-Variable-latin.woff2', weight: '600', style: 'normal' },
    { path: '../../fonts/InstrumentSans-Variable-latin.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--pi-dusk-sans',
  display: 'swap',
});
