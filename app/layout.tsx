import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/site-url';

// metadataBase resolves every relative metadata URL on every page. Without it Next.js falls back to
// http://localhost:3000, which is what shipped as og:image/twitter:image until 2026-10-15. Pages
// that set their own image (articles, via /api/og/article/...) override the default below.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  openGraph: { images: [{ url: '/og-image.png', width: 1200, height: 630, type: 'image/png' }] },
  twitter: { card: 'summary_large_image', images: ['/og-image.png'] },
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return children;
}
