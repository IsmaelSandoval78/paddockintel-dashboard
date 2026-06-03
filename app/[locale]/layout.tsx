import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Archivo_Black, DM_Serif_Display, Inter, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';
import Navbar from '@/components/nav/Navbar';
import '../globals.css';

const display = Archivo_Black({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--pi-display',
  display: 'swap',
});

const serif = DM_Serif_Display({
  weight: ['400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--pi-serif',
  display: 'swap',
});

const sans = Inter({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--pi-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--pi-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PaddockIntel',
  description: 'F1 economic and performance intelligence hub',
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

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${display.variable} ${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
