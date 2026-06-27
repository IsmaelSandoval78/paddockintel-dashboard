import type { Metadata } from 'next';
import { Link } from '@/lib/i18n/navigation';

export const metadata: Metadata = {
  title: 'Unsubscribed — PaddockIntel',
};

export default function UnsubscribedPage() {
  return (
    <main className="bg-bg min-h-screen flex items-center justify-center px-5">
      <div className="max-w-sm text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-2 mb-4">
          Digest
        </p>
        <h1 className="font-display text-[clamp(1.8rem,4vw,2.5rem)] leading-[0.92] tracking-[-0.03em] text-text-1 mb-4">
          Unsubscribed.
        </h1>
        <p className="font-sans text-text-2 leading-relaxed mb-8">
          You&apos;ve been removed from the PaddockIntel Weekly Digest. You won&apos;t receive any further emails.
        </p>
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.08em] text-red hover:underline"
        >
          ← Back to PaddockIntel
        </Link>
      </div>
    </main>
  );
}
