import { Instrument_Sans } from 'next/font/google';

// "Telemetry at Dusk" (docs/DECISION-2026-10-11-home-dusk.md): UI/body face for the pages that
// render `.theme-dusk` (magazine home and articles) only. Apply `duskSans.variable` on that root.
export const duskSans = Instrument_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--pi-dusk-sans',
  display: 'swap',
});
