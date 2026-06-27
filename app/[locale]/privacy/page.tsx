import type { Metadata } from 'next';
import { Link } from '@/lib/i18n/navigation';

export const metadata: Metadata = {
  title: 'Privacy Policy — PaddockIntel',
  description: 'How PaddockIntel collects and uses your email address.',
};

export default function PrivacyPage() {
  return (
    <main className="bg-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-2 mb-4">
          Legal
        </p>
        <h1 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-[0.92] tracking-[-0.03em] text-text-1 mb-8">
          Privacy Policy
        </h1>

        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 mb-8">
          Last updated: June 2026
        </p>

        <div className="space-y-8 font-sans text-text-1 leading-relaxed">
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-3 border-b border-border-subtle pb-2">
              01 · What we collect
            </h2>
            <p>
              When you subscribe to the PaddockIntel Weekly Digest, we collect your email address and your preferred language (English, Spanish, or Portuguese). We collect nothing else — no name, no tracking cookies tied to your subscription.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-3 border-b border-border-subtle pb-2">
              02 · How we use it
            </h2>
            <p>
              Your email address is used only to send the PaddockIntel Weekly Digest. We do not sell, share, or transfer your email to any third party. We do not use your address for advertising or profiling.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-3 border-b border-border-subtle pb-2">
              03 · Who processes your data
            </h2>
            <p>
              Subscription records are stored in Supabase (database hosted in the United States). Emails are delivered via Resend (transactional email provider). Both operate under their own privacy policies and data processing agreements.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-3 border-b border-border-subtle pb-2">
              04 · Unsubscribing
            </h2>
            <p>
              Every digest email contains an unsubscribe link at the bottom. Clicking it removes your address immediately and permanently. You can also contact us directly at{' '}
              <a href="mailto:info@paddockintel.com" className="text-red hover:underline">
                info@paddockintel.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-3 border-b border-border-subtle pb-2">
              05 · Cookies & analytics
            </h2>
            <p>
              paddockintel.com does not use advertising cookies. Basic analytics (page views, country, device type) may be collected via Vercel Analytics — no personally identifiable information is collected or stored.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-3 border-b border-border-subtle pb-2">
              06 · Contact
            </h2>
            <p>
              Questions about this policy:{' '}
              <a href="mailto:info@paddockintel.com" className="text-red hover:underline">
                info@paddockintel.com
              </a>
              {' '}or via the{' '}
              <Link href="/about" className="text-red hover:underline">
                about page
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
