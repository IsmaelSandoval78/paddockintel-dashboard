import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createAuthServerClient } from '@/lib/supabase/authServerClient';
import AccountActions from '@/components/account/AccountActions';

type PageParams = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'accountPage' });
  return {
    title: `${t('metaTitle')} — PaddockIntel`,
    // Deliberately no indexing — this page has nothing to say to a crawler
    // and its content is per-user.
    robots: { index: false, follow: false },
  };
}

export default async function AccountPage({ params }: { params: PageParams }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'accountPage' });
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="bg-bg min-h-screen px-5 py-12 max-w-2xl mx-auto">
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 border-b border-border pb-3 mb-8">
        {t('label')}
      </p>

      <h1 className="font-display text-[clamp(1.5rem,4vw,2rem)] uppercase text-text-1 leading-[0.95] tracking-[-0.03em] mb-6">
        {t('heading')}
      </h1>

      {!user ? (
        <p className="font-prose text-sm text-text-2 leading-relaxed">{t('signedOut')}</p>
      ) : (
        <>
          <p className="font-mono text-[11px] text-text-1 mb-10">{user.email}</p>
          <AccountActions />
        </>
      )}
    </main>
  );
}
