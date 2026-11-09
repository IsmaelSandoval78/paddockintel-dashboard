import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { routing } from '@/lib/i18n/routing';
import { AuthProvider } from '@/lib/auth/AuthContext';
import Navbar from '@/components/nav/Navbar';
import Footer from '@/components/nav/Footer';
import PwaRegister from '@/components/PwaRegister';
import { SITE_URL } from '@/lib/site-url';
import '../globals.css';

// Cloudflare Web Analytics site token (public: it ships in the HTML). Set only in the production
// deploy (deploy-cloudflare.yml, repo variable CF_BEACON_TOKEN); empty elsewhere, so previews and
// local builds render no beacon. Cookieless, disclosed in the privacy policy (s6).
const CF_BEACON_TOKEN = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

// Self-hosted from app/fonts/ (SIL OFL, licences alongside), so the build never downloads from
// Google Fonts: next/font/google fetched them at build time and a bad response from Google failed
// the production deploy twice (#153, #154). Same faces and weights as before; the variable files
// are Google Fonts' own latin subsets, declared once per weight as Google's CSS did. Lora (a
// Reserved Font Name) is the unmodified family from google/fonts, only converted to WOFF2.
// Only the faces painted above the fold are preloaded (Archivo Black titles, Inter and JetBrains
// Mono in the navbar, Instrument Sans on .theme-dusk pages via dusk-font.ts). DM Serif Display and
// Lora (225 KB together) are used below the fold or on legacy surfaces, so they load on demand
// instead of competing with the HTML, CSS and LCP image for bandwidth on a slow mobile connection.
const display = localFont({
  src: [{ path: '../fonts/ArchivoBlack-Regular-latin.woff2', weight: '400', style: 'normal' }],
  variable: '--pi-display',
  display: 'swap',
});

const serif = localFont({
  src: [
    { path: '../fonts/DMSerifDisplay-Regular-latin.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/DMSerifDisplay-Italic-latin.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--pi-serif',
  display: 'swap',
  preload: false,
  adjustFontFallback: 'Times New Roman',
});

const sans = localFont({
  src: [
    { path: '../fonts/Inter-Variable-latin.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/Inter-Variable-latin.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/Inter-Variable-latin.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--pi-sans',
  display: 'swap',
});

const mono = localFont({
  src: [
    { path: '../fonts/JetBrainsMono-Variable-latin.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/JetBrainsMono-Variable-latin.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--pi-mono',
  display: 'swap',
});

const prose = localFont({
  src: [
    { path: '../fonts/Lora-Variable.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/Lora-Variable.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/Lora-Italic-Variable.woff2', weight: '400', style: 'italic' },
    { path: '../fonts/Lora-Italic-Variable.woff2', weight: '500', style: 'italic' },
  ],
  variable: '--pi-prose',
  display: 'swap',
  preload: false,
  adjustFontFallback: 'Times New Roman',
});

export const metadata: Metadata = {
  title: 'PaddockIntel',
  description: 'F1 economic and performance intelligence hub',
  alternates: {
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  // Nothing in this layout reads the request (headers, cookies, session): any such read makes
  // every page under it render per request and bypass the ISR cache, which is what held the
  // article group's mobile LCP at 4.0s (Search Console, 2026-11-09). The locale comes from the
  // route; the signed-in state is fetched by AuthProvider in the browser (/api/auth/me).
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations('nav');

  return (
    <html
      lang={locale}
      className={`${display.variable} ${serif.variable} ${sans.variable} ${mono.variable} ${prose.variable}`}
    >
      <body>
        {/* A page's openGraph metadata replaces the root object, so the site name rides here, once
            for every page; React hoists the tag into <head>. */}
        <meta property="og:site_name" content="PaddockIntel" />
        <a href="#main-content" className="skip-link">
          {t('skipToContent')}
        </a>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <Navbar />
            <div id="main-content" tabIndex={-1} className="outline-none">
              {children}
            </div>
            <Footer />
          </AuthProvider>
        </NextIntlClientProvider>
        <PwaRegister />
        {CF_BEACON_TOKEN && (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
            data-cf-beacon={JSON.stringify({ token: CF_BEACON_TOKEN })}
          />
        )}
      </body>
    </html>
  );
}
